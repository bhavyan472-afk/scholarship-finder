import { handler, ok, requireAdmin } from "@/lib/api";
import { getAdminStats } from "@/lib/admin";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await getAdminStats());
});
