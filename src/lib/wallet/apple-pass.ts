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

/**
 * Generate a .pkpass file for Apple Wallet.
 *
 * NOTE: This requires Apple Developer certificates to produce a valid .pkpass.
 * Without the certificates (passkit.pem, wwdr.pem, signature.p12), this
 * returns null and falls back to the HTML pass.
 *
 * To enable real .pkpass generation, set these env vars:
 *   APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT, APPLE_PASS_KEY, APPLE_WWDR_CERT
 */
export async function generatePkpass(
  restaurantId: string,
  reservationId: string,
): Promise<Buffer | null> {
  const passData = await generateAppleWalletPass(restaurantId, reservationId);
  if (!passData) return null;

  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const certPem = process.env.APPLE_PASS_CERT;
  const keyPem = process.env.APPLE_PASS_KEY;
  const wwdrPem = process.env.APPLE_WWDR_CERT;

  if (!passTypeId || !teamId || !certPem || !keyPem || !wwdrPem) {
    // Certificates not configured — return null for HTML fallback
    return null;
  }

  // Real .pkpass generation would require:
  // 1. Build pass.json structure
  // 2. Create manifest (SHA-1 hash of all files)
  // 3. Sign manifest with Apple WWDR certificate
  // 4. Package as .zip → .pkpass
  //
  // This needs the `@peculiar/asn1-x509` and `node-forge` or
  // a dedicated passkit library. For now, return null.
  return null;
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif;
          padding: 16px;
          background: #0a0a0a;
        }
        .pass {
          background: #1a1a1a;
          border-radius: 16px;
          overflow: hidden;
          max-width: 375px;
          margin: 0 auto;
          border: 1px solid rgba(201,169,110,0.2);
        }
        .pass-header {
          background: linear-gradient(135deg, #C9A96E, #a8893e);
          padding: 24px 20px;
          text-align: center;
        }
        .pass-header h1 {
          font-size: 18px;
          font-weight: 600;
          color: #0a0a0a;
          letter-spacing: 0.5px;
        }
        .pass-header .subtitle {
          font-size: 11px;
          color: rgba(10,10,10,0.6);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .pass-body {
          padding: 20px;
        }
        .field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .field:last-child { border-bottom: none; }
        .field-label {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .field-value {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }
        .barcode {
          margin-top: 20px;
          padding: 16px;
          text-align: center;
          background: rgba(201,169,110,0.08);
          border-radius: 8px;
        }
        .barcode-text {
          font-family: 'SF Mono', 'Menlo', monospace;
          font-size: 14px;
          letter-spacing: 3px;
          color: #C9A96E;
        }
        .barcode-label {
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          margin-top: 6px;
          text-transform: uppercase;
        }
        .pass-footer {
          padding: 12px 20px;
          text-align: center;
          font-size: 10px;
          color: rgba(255,255,255,0.2);
        }
      </style>
    </head>
    <body>
      <div class="pass">
        <div class="pass-header">
          <h1>${data.restaurantName}</h1>
          <div class="subtitle">Réservation</div>
        </div>
        <div class="pass-body">
          <div class="field">
            <span class="field-label">Date</span>
            <span class="field-value">${data.reservationDate}</span>
          </div>
          <div class="field">
            <span class="field-label">Heure</span>
            <span class="field-value">${data.reservationTime}</span>
          </div>
          <div class="field">
            <span class="field-label">Convives</span>
            <span class="field-value">${data.partySize} personnes</span>
          </div>
          <div class="field">
            <span class="field-label">Client</span>
            <span class="field-value">${data.guestName}</span>
          </div>
          <div class="barcode">
            <div class="barcode-text">${data.reference}</div>
            <div class="barcode-label">Référence</div>
          </div>
        </div>
        <div class="pass-footer">
          ${data.restaurantName} — E-Coffee Node
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePkpassStructure(data: PassData): Record<string, unknown> {
  return {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID ?? "pass.com.e-coffee.reservation",
    serialNumber: data.reference,
    teamIdentifier: process.env.APPLE_TEAM_ID ?? "TEAMID",
    organizationName: data.restaurantName,
    description: `Réservation ${data.restaurantName}`,
    boardingPass: {
      transitType: "PKTransitTypeGeneric",
      headerFields: [
        { key: "restaurant", label: "RESTAURANT", value: data.restaurantName },
      ],
      primaryFields: [
        { key: "date", label: "DATE", value: data.reservationDate },
        { key: "time", label: "HEURE", value: data.reservationTime },
      ],
      secondaryFields: [
        { key: "guest", label: "CLIENT", value: data.guestName },
        { key: "party", label: "CONVIVES", value: `${data.partySize}` },
      ],
      auxiliaryFields: [
        { key: "ref", label: "RÉFÉRENCE", value: data.reference },
      ],
    },
    barcode: {
      format: "PKBarcodeFormatQR",
      message: data.reference,
      messageEncoding: "iso-8859-1",
    },
    colors: {
      foreground: { red: 0.04, green: 0.04, blue: 0.04 },
      background: { red: 0.79, green: 0.66, blue: 0.43 },
    },
  };
}
