import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getRestaurantBySlug } from "@/lib/saas";
import { getStaffMembers } from "@/lib/staff-auth";

import {
  addTeamMember,
  changeStaffRole,
  deactivateTeamMember,
} from "../actions";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function OwnerTeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  if (!(await isAdminOrOwner())) notFound();

  const slug = process.env.OWNER_RESTAURANT_SLUG;
  if (!slug) notFound();

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const members = await getStaffMembers(restaurant.id);

  return (
      <TeamClient
        members={members}
      addMemberAction={addTeamMember}
      changeRoleAction={changeStaffRole}
      deactivateAction={deactivateTeamMember}
    />
  );
}

async function isAdminOrOwner(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
