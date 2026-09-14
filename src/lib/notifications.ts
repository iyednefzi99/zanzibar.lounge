import { NotificationType } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────

export type NotificationTypeValue =
  | "RESERVATION_REMINDER"
  | "ORDER_READY"
  | "FLASH_OFFER"
  | "BIRTHDAY"
  | "SYSTEM"
  | "ANNOUNCEMENT";

export type NotificationTarget =
  | { kind: "guest"; guestId: string }
  | { kind: "staff"; staffId: string }
  | { kind: "broadcast" };

export type CreateNotificationData = {
  type: NotificationTypeValue;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  target: NotificationTarget;
};

export type NotificationWithMeta = {
  id: string;
  restaurantId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  read: boolean;
  actionUrl: string | null;
  createdAt: Date;
  readAt: Date | null;
  guestId: string | null;
  staffId: string | null;
  broadcast: boolean;
};

export type PaginatedNotifications = {
  notifications: NotificationWithMeta[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
};

// ─── Create ───────────────────────────────────────────────────────────

export async function createNotification(
  restaurantId: string,
  data: CreateNotificationData,
): Promise<NotificationWithMeta> {
  const notification = await db.notification.create({
    data: {
      restaurantId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data as Record<string, string> | undefined,
      actionUrl: data.actionUrl ?? null,
      guestId: data.target.kind === "guest" ? data.target.guestId : null,
      staffId: data.target.kind === "staff" ? data.target.staffId : null,
      broadcast: data.target.kind === "broadcast",
    },
  });

  logger.info("notification.created", {
    notificationId: notification.id,
    type: data.type,
    target: data.target.kind,
  });

  return notification;
}

// ─── Read ─────────────────────────────────────────────────────────────

export async function getNotifications(
  restaurantId: string,
  options: {
    page?: number;
    limit?: number;
    type?: NotificationTypeValue;
    unreadOnly?: boolean;
    guestId?: string;
    staffId?: string;
  } = {},
): Promise<PaginatedNotifications> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { restaurantId };

  if (options.type) {
    where.type = options.type;
  }

  if (options.unreadOnly) {
    where.read = false;
  }

  // Filter by target: guest, staff, or broadcast
  if (options.guestId) {
    where.OR = [
      { guestId: options.guestId },
      { broadcast: true },
    ];
  } else if (options.staffId) {
    where.OR = [
      { staffId: options.staffId },
      { broadcast: true },
    ];
  } else {
    // Default: only broadcast notifications
    where.broadcast = true;
  }

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.notification.count({ where }),
  ]);

  const unreadWhere = { ...where, read: false };
  const unreadCount = await db.notification.count({ where: unreadWhere });

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
  };
}

// ─── Mark as read ─────────────────────────────────────────────────────

export async function markAsRead(
  notificationId: string,
): Promise<NotificationWithMeta | null> {
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) return null;

  if (notification.read) return notification;

  return db.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(
  restaurantId: string,
  target: NotificationTarget,
): Promise<number> {
  const where: Record<string, unknown> = {
    restaurantId,
    read: false,
  };

  if (target.kind === "guest") {
    where.OR = [{ guestId: target.guestId }, { broadcast: true }];
  } else if (target.kind === "staff") {
    where.OR = [{ staffId: target.staffId }, { broadcast: true }];
  } else {
    where.broadcast = true;
  }

  const result = await db.notification.updateMany({
    where,
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  logger.info("notification.markAllRead", {
    restaurantId,
    target: target.kind,
    count: result.count,
  });

  return result.count;
}

// ─── Unread count ─────────────────────────────────────────────────────

export async function getUnreadCount(
  restaurantId: string,
  target: NotificationTarget,
): Promise<number> {
  const where: Record<string, unknown> = {
    restaurantId,
    read: false,
  };

  if (target.kind === "guest") {
    where.OR = [{ guestId: target.guestId }, { broadcast: true }];
  } else if (target.kind === "staff") {
    where.OR = [{ staffId: target.staffId }, { broadcast: true }];
  } else {
    where.broadcast = true;
  }

  return db.notification.count({ where });
}

// ─── Cleanup ──────────────────────────────────────────────────────────

export async function deleteOldNotifications(
  restaurantId: string,
  days: number = 90,
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await db.notification.deleteMany({
    where: {
      restaurantId,
      createdAt: { lt: cutoff },
    },
  });

  logger.info("notification.cleanup", {
    restaurantId,
    days,
    deleted: result.count,
  });

  return result.count;
}
