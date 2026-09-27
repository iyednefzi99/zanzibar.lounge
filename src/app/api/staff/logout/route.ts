import { destroyStaffSession } from "@/lib/staff-session";

export async function POST(): Promise<Response> {
  await destroyStaffSession();
  // 204 : c'est le client qui navigue vers la page de login (locale correcte).
  return new Response(null, { status: 204 });
}
