import { redirect } from "next/navigation";

import { destroyGuestSession } from "@/lib/guest-session";

export async function POST() {
  await destroyGuestSession();
  redirect("/");
}
