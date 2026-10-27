import "server-only";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/api";
import { authOptions } from "@/lib/auth";

/**
 * Page-level admin check against the database. Call it in every admin page as well as the
 * layout: layouts are not re-rendered on client-side navigation between sibling pages.
 */
export async function requireAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (!(await isAdmin(session.user.id))) redirect("/dashboard");
  return session.user;
}
