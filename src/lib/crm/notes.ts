import { db } from "@/lib/db";

export async function createNote(
  guestId: string,
  staffId: string,
  restaurantId: string,
  content: string,
) {
  return db.guestNote.create({
    data: { guestId, staffId, restaurantId, content },
  });
}

export async function updateNote(noteId: string, content: string) {
  return db.guestNote.update({
    where: { id: noteId },
    data: { content },
  });
}

export async function deleteNote(noteId: string) {
  return db.guestNote.delete({ where: { id: noteId } });
}

export async function getGuestNotes(guestId: string) {
  return db.guestNote.findMany({
    where: { guestId },
    include: { staff: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
