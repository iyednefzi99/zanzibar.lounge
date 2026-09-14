import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { isLocale } from "@/i18n/config";
import { getTags, createTag, deleteTag } from "@/lib/crm/tags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tags — CRM",
};

export default async function CrmTagsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();
  const tags = await getTags(restaurantId);

  async function handleCreateTag(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    const color = (formData.get("color") as string)?.trim() || undefined;
    if (!name) return;
    await createTag(restaurantId, name, color);
  }

  async function handleDeleteTag(formData: FormData) {
    "use server";
    const tagId = formData.get("tagId") as string;
    if (!tagId) return;
    await deleteTag(tagId);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl text-shell">Tags</h1>
        <p className="mt-2 text-sm text-shell-dim">
          {tags.length} tags créés
        </p>
      </div>

      {/* Create form */}
      <form
        action={handleCreateTag}
        className="flex gap-3 rounded-xl border border-shell/10 bg-deep/40 p-4"
      >
        <input
          name="name"
          placeholder="Nom du tag"
          required
          className="flex-1 rounded-lg border border-shell/15 bg-night/60 px-3 py-2 text-sm text-shell placeholder:text-shell-dim/40 focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <input
          name="color"
          type="color"
          defaultValue="#C9A96E"
          className="size-10 cursor-pointer rounded-lg border border-shell/15 bg-night/60"
        />
        <button
          type="submit"
          className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-night hover:bg-brass/80 transition"
        >
          Créer
        </button>
      </form>

      {/* Tags list */}
      <div className="space-y-2">
        {tags.length === 0 ? (
          <div className="rounded-xl border border-shell/10 bg-deep/40 py-12 text-center">
            <p className="text-shell-dim">Aucun tag créé.</p>
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <div>
                  <p className="text-sm font-medium text-shell">{tag.name}</p>
                  <p className="text-xs text-shell-dim">
                    {tag._count.assignments} assignations
                  </p>
                </div>
              </div>
              <form action={handleDeleteTag}>
                <input type="hidden" name="tagId" value={tag.id} />
                <button
                  type="submit"
                  className="rounded px-3 py-1 text-xs text-coral/70 hover:bg-coral/10 hover:text-coral transition"
                >
                  Supprimer
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
