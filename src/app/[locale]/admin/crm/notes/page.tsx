import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { isLocale } from "@/i18n/config";
import { db } from "@/lib/db";
import { createNote, deleteNote } from "@/lib/crm/notes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notes — CRM",
};

export default async function CrmNotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin();

  const restaurantId = await getDefaultRestaurantId();

  const notes = await db.guestNote.findMany({
    where: { restaurantId },
    include: {
      guest: { select: { name: true, phone: true } },
      staff: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  async function handleCreateNote(formData: FormData) {
    "use server";
    const guestId = (formData.get("guestId") as string)?.trim();
    const content = (formData.get("content") as string)?.trim();
    if (!guestId || !content) return;

    // Find or use first staff as author
    const staff = await db.staff.findFirst({
      where: { restaurantId },
      select: { id: true },
    });
    if (!staff) return;

    await createNote(guestId, staff.id, restaurantId, content);
  }

  async function handleDeleteNote(formData: FormData) {
    "use server";
    const noteId = formData.get("noteId") as string;
    if (!noteId) return;
    await deleteNote(noteId);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-display text-3xl text-shell">Notes clients</h1>
        <p className="mt-2 text-sm text-shell-dim">
          {notes.length} notes récentes
        </p>
      </div>

      {/* Create form */}
      <form
        action={handleCreateNote}
        className="space-y-3 rounded-xl border border-shell/10 bg-deep/40 p-4"
      >
        <input
          name="guestId"
          placeholder="ID du client"
          required
          className="w-full rounded-lg border border-shell/15 bg-night/60 px-3 py-2 text-sm text-shell placeholder:text-shell-dim/40 focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <textarea
          name="content"
          placeholder="Contenu de la note..."
          required
          rows={3}
          className="w-full rounded-lg border border-shell/15 bg-night/60 px-3 py-2 text-sm text-shell placeholder:text-shell-dim/40 focus:outline-none focus:ring-1 focus:ring-brass resize-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-night hover:bg-brass/80 transition"
        >
          Ajouter la note
        </button>
      </form>

      {/* Notes list */}
      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="rounded-xl border border-shell/10 bg-deep/40 py-12 text-center">
            <p className="text-shell-dim">Aucune note.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-shell/10 bg-deep/40 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-shell">
                      {note.guest?.name ?? note.guest?.phone ?? "Client"}
                    </p>
                    <span className="text-xs text-shell-dim">
                      par {note.staff?.name ?? "—"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-shell-dim whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="mt-2 text-[0.65rem] text-shell-dim/50">
                    {note.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <form action={handleDeleteNote} className="shrink-0">
                  <input type="hidden" name="noteId" value={note.id} />
                  <button
                    type="submit"
                    className="rounded px-2 py-1 text-xs text-coral/70 hover:bg-coral/10 hover:text-coral transition"
                  >
                    ✕
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
