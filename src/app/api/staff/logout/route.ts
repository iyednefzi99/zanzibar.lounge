import { redirect } from "next/navigation";

import { destroyStaffSession } from "@/lib/staff-session";

export async function POST() {
  await destroyStaffSession();
  redirect("/fr/staff/login");
}
