import { describe, it, expect, beforeEach, vi } from "vitest";
import { WaitlistStatus } from "@/generated/prisma/client";

// Mock des dépendances
vi.mock("@/lib/db", () => ({
  db: {
    waitlist: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/channels", () => ({
  sendOnBestChannel: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/restaurant", () => ({
  getDefaultRestaurantId: vi.fn().mockResolvedValue("test-restaurant-id"),
}));

vi.mock("@/lib/hours", () => ({
  formatSlot: vi.fn((m: number) => `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`),
}));

import {
  joinWaitlist,
  notifyWaitlist,
  processWaitlistResponse,
  cleanupExpiredWaitlist,
  cancelWaitlistEntry,
} from "@/lib/waitlist";
import { db } from "@/lib/db";

const mockDb = vi.mocked(db);

describe("waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("joinWaitlist", () => {
    it("crée une entrée en waitlist", async () => {
      vi.mocked(mockDb.waitlist.findUnique).mockResolvedValue(null);
      vi.mocked(mockDb.waitlist.count).mockResolvedValue(0);
      vi.mocked(mockDb.waitlist.create).mockResolvedValue({
        id: "w1",
        guestId: "g1",
        restaurantId: "r1",
        date: "2026-09-20",
        minutes: 1200,
        partySize: 4,
        status: WaitlistStatus.WAITING,
        position: 1,
        notifiedAt: null,
        expiresAt: null,
        reservationId: null,
        createdAt: new Date(),
        guest: { name: "Test", phone: "+21620123456" },
      } as never);

      const result = await joinWaitlist({
        guestId: "g1",
        date: "2026-09-20",
        minutes: 1200,
        partySize: 4,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.position).toBe(1);
        expect(result.entry.id).toBe("w1");
      }
    });

    it("rejette un doublon", async () => {
      vi.mocked(mockDb.waitlist.findUnique).mockResolvedValue({
        id: "existing",
        status: WaitlistStatus.WAITING,
      } as never);

      const result = await joinWaitlist({
        guestId: "g1",
        date: "2026-09-20",
        minutes: 1200,
        partySize: 4,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("ALREADY_JOINED");
      }
    });
  });

  describe("notifyWaitlist", () => {
    it("notifie le premier de la file", async () => {
      vi.mocked(mockDb.waitlist.findFirst).mockResolvedValue({
        id: "w1",
        guestId: "g1",
        guest: { name: "Test", phone: "+21620123456", locale: "fr" },
        date: "2026-09-20",
        minutes: 1200,
        partySize: 4,
        status: WaitlistStatus.WAITING,
        position: 1,
      } as never);
      vi.mocked(mockDb.waitlist.update).mockResolvedValue({} as never);

      const result = await notifyWaitlist("r1", "2026-09-20", 1200);

      expect(result.ok).toBe(true);
      expect(mockDb.waitlist.update).toHaveBeenCalledWith({
        where: { id: "w1" },
        data: expect.objectContaining({
          status: WaitlistStatus.NOTIFIED,
        }),
      });
    });

    it("retourne NO_ONE_WAITING si la file est vide", async () => {
      vi.mocked(mockDb.waitlist.findFirst).mockResolvedValue(null);

      const result = await notifyWaitlist("r1", "2026-09-20", 1200);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("NO_ONE_WAITING");
      }
    });
  });

  describe("processWaitlistResponse", () => {
    it("crée une réservation sur accept", async () => {
      vi.mocked(mockDb.waitlist.findUnique).mockResolvedValue({
        id: "w1",
        status: WaitlistStatus.NOTIFIED,
        expiresAt: new Date(Date.now() + 600_000),
        guest: { name: "Test", phone: "+21620123456", locale: "fr" },
        restaurant: { id: "r1" },
        restaurantId: "r1",
        date: "2026-09-20",
        minutes: 1200,
        partySize: 4,
      } as never);
      vi.mocked(mockDb.waitlist.update).mockResolvedValue({} as never);

      // Mock createReservation
      vi.mock("@/lib/reservations", () => ({
        createReservation: vi.fn().mockResolvedValue({
          ok: true,
          value: { id: "res1", reference: "ZL-TEST" },
        }),
      }));

      const result = await processWaitlistResponse("w1", "accept");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.reservationRef).toBe("ZL-TEST");
      }
    });

    it("refuse si déjà expiré", async () => {
      vi.mocked(mockDb.waitlist.findUnique).mockResolvedValue({
        id: "w1",
        status: WaitlistStatus.EXPIRED,
      } as never);

      const result = await processWaitlistResponse("w1", "accept");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("EXPIRED");
      }
    });
  });

  describe("cleanupExpiredWaitlist", () => {
    it("expire les notifications dépassées", async () => {
      vi.mocked(mockDb.waitlist.updateMany).mockResolvedValue({ count: 2 } as never);
      vi.mocked(mockDb.waitlist.findMany).mockResolvedValue([] as never);

      const count = await cleanupExpiredWaitlist();

      expect(count).toBe(2);
    });
  });

  describe("cancelWaitlistEntry", () => {
    it("annule une entrée en attente", async () => {
      vi.mocked(mockDb.waitlist.findUnique).mockResolvedValue({
        id: "w1",
        guestId: "g1",
        status: WaitlistStatus.WAITING,
        restaurantId: "r1",
        date: "2026-09-20",
        minutes: 1200,
      } as never);
      vi.mocked(mockDb.waitlist.update).mockResolvedValue({} as never);

      const result = await cancelWaitlistEntry("w1", "g1");

      expect(result.ok).toBe(true);
    });

    it("refuse si l'entrée n'appartient pas au guest", async () => {
      vi.mocked(mockDb.waitlist.findUnique).mockResolvedValue({
        id: "w1",
        guestId: "g2",
        status: WaitlistStatus.WAITING,
      } as never);

      const result = await cancelWaitlistEntry("w1", "g1");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("FORBIDDEN");
      }
    });
  });
});
