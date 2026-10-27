import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { ipFromHeaders } from "@/lib/ip";
import { prisma } from "@/lib/prisma";
import { LOGIN_IP_LIMIT, LOGIN_LIMIT, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";
import type { Role } from "@/lib/constants";

const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 12);

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Credentials sign-in requires JWT sessions.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, req) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const header = (name: string) => {
          const v = req?.headers?.[name];
          return (Array.isArray(v) ? v[0] : v) ?? null;
        };
        const ip = ipFromHeaders(header);
        const [perAccount, perIp] = await Promise.all([
          rateLimit(`login:${ip}:${email}`, LOGIN_LIMIT.limit, LOGIN_LIMIT.windowMs),
          rateLimit(`login-ip:${ip}`, LOGIN_IP_LIMIT.limit, LOGIN_IP_LIMIT.windowMs),
        ]);
        // NextAuth forwards the thrown message to the client as `error` (see auth-form).
        if (!perAccount.ok || !perIp.ok) throw new Error("RATE_LIMITED");

        let user;
        try {
          user = await prisma.user.findUnique({ where: { email } });
        } catch (err) {
          // Without this, NextAuth only shows a generic error page; the real cause goes to the Vercel log.
          console.error("[auth] authorize: user lookup failed:", err);
          throw err;
        }
        // Compare even when the user is missing to keep timing uniform.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.passwordHash || !valid) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role as Role };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = ((user as { role?: Role }).role ?? "STUDENT") as Role;
      }
      // Refresh role/onboarding state on sign-in and on explicit session.update().
      if (user || trigger === "update") {
        const db = await prisma.user
          .findUnique({
            where: { id: token.id as string },
            select: { role: true, profile: { select: { onboardedAt: true } } },
          })
          .catch((err) => {
            console.error("[auth] jwt: refreshing role/onboarding failed:", err);
            throw err;
          });
        if (db) {
          token.role = db.role as Role;
          token.onboarded = Boolean(db.profile?.onboardedAt);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "STUDENT";
        session.user.onboarded = Boolean(token.onboarded);
      }
      return session;
    },
  },
  // Middleware (withAuth) reads the same variables, so both must be set in Vercel, not only in a local .env.
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  logger: {
    error: (code, metadata) => console.error(`[next-auth][error][${code}]`, metadata),
    warn: (code) => console.warn(`[next-auth][warn][${code}]`),
  },
};

if (process.env.VERCEL && !process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  console.error("[auth] NEXTAUTH_SECRET is not set in Vercel → Settings → Environment Variables; sign-in will fail.");
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
