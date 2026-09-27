import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────

export type JourneyTrigger =
  | "reservation_confirmed"
  | "reservation_completed"
  | "reservation_cancelled"
  | "birthday"
  | "first_visit"
  | "inactive_30d"
  | "inactive_60d"
  | "loyalty_tier_up";

export type JourneyStepType =
  | "wait"
  | "send_email"
  | "send_sms"
  | "send_push"
  | "send_whatsapp"
  | "check_condition"
  | "tag_guest";

export type JourneyStep = {
  id: string;
  type: JourneyStepType;
  config: Record<string, unknown>;
  nextStepId?: string;
};

export type Journey = {
  id: string;
  restaurantId: string;
  name: string;
  trigger: JourneyTrigger;
  enabled: boolean;
  steps: JourneyStep[];
  createdAt: Date;
  updatedAt: Date;
};

// ─── Predefined journey templates ─────────────────────────────────────

export const JOURNEY_TEMPLATES: Record<
  JourneyTrigger,
  Omit<Journey, "id" | "restaurantId" | "createdAt" | "updatedAt">
> = {
  reservation_confirmed: {
    name: "Rappel J-1",
    trigger: "reservation_confirmed",
    enabled: true,
    steps: [
      {
        id: "wait",
        type: "wait",
        config: { duration: "23h", from: "reservation_date_minus_1" },
        nextStepId: "remind",
      },
      {
        id: "remind",
        type: "send_whatsapp",
        config: {
          template: "reservation_reminder",
          message:
            "Bonjour {{name}}! Votre réservation demain à {{time}} pour {{partySize}} personne(s). À bientôt ! 🍽️",
        },
        nextStepId: "tag",
      },
      {
        id: "tag",
        type: "tag_guest",
        config: { tag: "reminder_sent" },
      },
    ],
  },
  reservation_completed: {
    name: "Merci + Avis",
    trigger: "reservation_completed",
    enabled: true,
    steps: [
      {
        id: "wait",
        type: "wait",
        config: { duration: "2h" },
        nextStepId: "thank",
      },
      {
        id: "thank",
        type: "send_email",
        config: {
          subject: "Merci pour votre visite !",
          template: "thank_you",
          message:
            "Merci {{name}} pour votre visite! Pourriez-vous laisser un avis? {{reviewUrl}}",
        },
        nextStepId: "wait2",
      },
      {
        id: "wait2",
        type: "wait",
        config: { duration: "30d" },
        nextStepId: "return_offer",
      },
      {
        id: "return_offer",
        type: "send_sms",
        config: {
          message:
            "{{name}}, profitez de -10% sur votre prochain repas avec le code RETOUR10. Réservez: {{bookingUrl}}",
        },
      },
    ],
  },
  birthday: {
    name: "Anniversaire",
    trigger: "birthday",
    enabled: true,
    steps: [
      {
        id: "wait",
        type: "wait",
        config: { duration: "09:00" },
        nextStepId: "gift",
      },
      {
        id: "gift",
        type: "send_whatsapp",
        config: {
          template: "birthday_offer",
          message:
            "Joyeux anniversaire {{name}}! 🎂 Venez célébrer avec nous et recevez un dessert offert. Réservez: {{bookingUrl}}",
        },
        nextStepId: "tag",
      },
      {
        id: "tag",
        type: "tag_guest",
        config: { tag: "birthday_sent" },
      },
    ],
  },
  first_visit: {
    name: "Bienvenue",
    trigger: "first_visit",
    enabled: true,
    steps: [
      {
        id: "welcome",
        type: "send_email",
        config: {
          subject: "Bienvenue chez {{restaurantName}}!",
          template: "welcome",
          message:
            "Merci {{name}} pour votre première visite! Découvrez notre carte: {{menuUrl}}",
        },
      },
    ],
  },
  inactive_30d: {
    name: "Réactivation 30j",
    trigger: "inactive_30d",
    enabled: true,
    steps: [
      {
        id: "offer",
        type: "send_sms",
        config: {
          message:
            "{{name}}, on vous manque! Profitez de -15% avec le code REVIENT15. Réservez: {{bookingUrl}}",
        },
        nextStepId: "wait",
      },
      {
        id: "wait",
        type: "wait",
        config: { duration: "7d" },
        nextStepId: "check",
      },
      {
        id: "check",
        type: "check_condition",
        config: { condition: "has_reservation_since_last_step" },
        nextStepId: "tag",
      },
      {
        id: "tag",
        type: "tag_guest",
        config: { tag: "re-engaged" },
      },
    ],
  },
  inactive_60d: {
    name: "Réactivation 60j",
    trigger: "inactive_60d",
    enabled: true,
    steps: [
      {
        id: "offer",
        type: "send_email",
        config: {
          subject: "On vous attend !",
          template: "win_back",
          message:
            "{{name}}, ça fait longtemps! Voici une offre exclusive: -20% sur votre prochain dîner. Code: REVIENT20",
        },
      },
    ],
  },
  reservation_cancelled: {
    name: "Annulation - Récupération",
    trigger: "reservation_cancelled",
    enabled: true,
    steps: [
      {
        id: "wait",
        type: "wait",
        config: { duration: "1h" },
        nextStepId: "msg",
      },
      {
        id: "msg",
        type: "send_whatsapp",
        config: {
          template: "cancellation_recovery",
          message:
            "{{name}}, votre réservation a été annulée. N'hésitez pas à réserver à un autre moment: {{bookingUrl}}",
        },
      },
    ],
  },
  loyalty_tier_up: {
    name: "Promotion de palier",
    trigger: "loyalty_tier_up",
    enabled: true,
    steps: [
      {
        id: "congrats",
        type: "send_push",
        config: {
          title: "Félicitations ! 🎉",
          message:
            "Vous êtes maintenant {{tier}}! Profitez de vos avantages exclusifs.",
        },
        nextStepId: "email",
      },
      {
        id: "email",
        type: "send_email",
        config: {
          subject: "Vous êtes maintenant {{tier}} !",
          template: "loyalty_tier_up",
          message:
            "Félicitations {{name}}! Vous accédez au palier {{tier}}. Découvrez vos nouveaux avantages: {{loyaltyUrl}}",
        },
      },
    ],
  },
};

// ─── CRUD Operations ──────────────────────────────────────────────────

export async function getJourneys(restaurantId: string) {
  return db.marketingJourney.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJourneyById(journeyId: string) {
  return db.marketingJourney.findUnique({ where: { id: journeyId } });
}

export async function createJourney(
  restaurantId: string,
  data: { name: string; trigger: JourneyTrigger; steps: JourneyStep[] },
) {
  return db.marketingJourney.create({
    data: {
      restaurantId,
      name: data.name,
      trigger: data.trigger,
      steps: data.steps as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function updateJourney(
  journeyId: string,
  data: { name?: string; enabled?: boolean; steps?: JourneyStep[] },
) {
  return db.marketingJourney.update({
    where: { id: journeyId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.steps && { steps: data.steps as unknown as Prisma.InputJsonValue }),
    },
  });
}

export async function deleteJourney(journeyId: string) {
  return db.marketingJourney.delete({ where: { id: journeyId } });
}

// ─── Journey Execution ────────────────────────────────────────────────

export async function triggerJourney(
  restaurantId: string,
  trigger: JourneyTrigger,
  guestId: string,
  context: Record<string, unknown> = {},
) {
  const journeys = await db.marketingJourney.findMany({
    where: { restaurantId, trigger, enabled: true },
  });

  for (const journey of journeys) {
    const steps = (journey.steps as unknown as JourneyStep[]) ?? [];
    if (steps.length === 0) continue;

    // Create execution record
    await db.journeyExecution.create({
      data: {
        journeyId: journey.id,
        guestId,
        context: context as unknown as Prisma.InputJsonValue,
        currentStepId: steps[0].id,
        status: "active",
      },
    });
  }

  return { triggered: journeys.length };
}

export async function processJourneyStep(executionId: string) {
  const execution = await db.journeyExecution.findUnique({
    where: { id: executionId },
    include: { journey: true },
  });

  if (!execution || execution.status !== "active") return;

  const steps = (execution.journey.steps as unknown as JourneyStep[]) ?? [];
  const currentStep = steps.find((s) => s.id === execution.currentStepId);
  if (!currentStep) {
    await db.journeyExecution.update({
      where: { id: executionId },
      data: { status: "completed" },
    });
    return;
  }

  // Execute step based on type
  switch (currentStep.type) {
    case "send_email":
    case "send_sms":
    case "send_push":
    case "send_whatsapp":
      // Delegate to notifier
      break;
    case "wait":
      // Schedule next processing
      break;
    case "tag_guest":
      // Apply tag
      break;
    case "check_condition":
      // Evaluate condition
      break;
  }

  // Move to next step
  if (currentStep.nextStepId) {
    await db.journeyExecution.update({
      where: { id: executionId },
      data: { currentStepId: currentStep.nextStepId },
    });
  } else {
    await db.journeyExecution.update({
      where: { id: executionId },
      data: { status: "completed" },
    });
  }
}

// ─── Stats ────────────────────────────────────────────────────────────

export async function getJourneyStats(journeyId: string) {
  const executions = await db.journeyExecution.groupBy({
    by: ["status"],
    where: { journeyId },
    _count: true,
  });

  const statusCounts = Object.fromEntries(
    executions.map((e) => [e.status, e._count]),
  );

  return {
    total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    active: statusCounts["active"] ?? 0,
    completed: statusCounts["completed"] ?? 0,
    failed: statusCounts["failed"] ?? 0,
  };
}
