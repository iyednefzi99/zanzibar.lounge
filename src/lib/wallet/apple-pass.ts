import { db } from "@/lib/db";

type PassData = {
  restaurantName: string;
  guestName: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  reference: string;
};

export async function generateAppleWalletPass(
  restaurantId: string,
  reservationId: string,
): Promise<PassData | null> {
  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: true, guest: true },
  });

  if (!reservation || reservation.restaurantId !== restaurantId) {
    return null;
  }

  const timeStr = reservation.startsAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    restaurantName: reservation.restaurant.name,
    guestName: reservation.guest?.name ?? "Client",
    reservationDate: reservation.serviceDate,
    reservationTime: timeStr,
    partySize: reservation.partySize,
    reference: reservation.reference,
  };
}

export function generatePassHtml(data: PassData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Pass - ${data.restaurantName}</title>
      <style>
        body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .pass { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .pass-header { background: #d4a843; padding: 24px; text-align: center; color: #0a0a0a; }
        .pass-header h1 { margin: 0; font-size: 20px; }
        .pass-body { padding: 24px; }
        .field { margin-bottom: 16px; }
        .field-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .field-value { font-size: 18px; font-weight: 600; margin-top: 4px; }
        .barcode { text-align: center; margin-top: 24px; font-family: monospace; font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="pass">
        <div class="pass-header">
          <h1>${data.restaurantName}</h1>
        </div>
        <div class="pass-body">
          <div class="field">
            <div class="field-label">Date</div>
            <div class="field-value">${data.reservationDate}</div>
          </div>
          <div class="field">
            <div class="field-label">Heure</div>
            <div class="field-value">${data.reservationTime}</div>
          </div>
          <div class="field">
            <div class="field-label">Convives</div>
            <div class="field-value">${data.partySize} personnes</div>
          </div>
          <div class="field">
            <div class="field-label">Client</div>
            <div class="field-value">${data.guestName}</div>
          </div>
          <div class="barcode">${data.reference}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
