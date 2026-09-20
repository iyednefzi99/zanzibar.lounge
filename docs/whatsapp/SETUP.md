# WhatsApp Business API — Setup Guide

## Overview

Zanzibar.lounge uses WhatsApp Cloud API (Meta) for:
- AI concierge (24/7 reservations, modifications, FAQs)
- Automated reminders (24h before reservation)
- Waitlist notifications (table available)
- Marketing campaigns (promotions, events)

## Prerequisites

1. Meta Business Account (verified)
2. WhatsApp Business phone number (not linked to personal WhatsApp)
3. Phone number must be able to receive calls/SMS for verification

## Step 1: Create Meta Business App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Fill in app name: "Zanzibar Lounge"
5. Add WhatsApp product to your app

## Step 2: Configure WhatsApp Cloud API

1. In your app dashboard, go to "WhatsApp" → "Getting Started"
2. Add a phone number (or use test number for sandbox)
3. Note down:
   - `PHONE_NUMBER_ID` (from phone number settings)
   - `Temporary Access Token` (for testing)

## Step 3: Set Up Webhook

### Webhook URL
```
https://your-domain.vercel.app/api/webhooks/whatsapp
```

### Verification Token
Choose a secure token (min 16 characters). This must match `WHATSAPP_VERIFY_TOKEN` in your env vars.

### Configure in Meta Dashboard:
1. Go to WhatsApp → Configuration → Webhook
2. Enter your webhook URL
3. Enter your verification token
4. Subscribe to: `messages`, `messaging_postbacks`

## Step 4: Create Message Templates

### Template 1: reservation_confirmation
**Category:** TRANSACTIONAL
**Language:** Arabic (ar), French (fr), English (en)

**Arabic:**
```
تم تأكيد حجزك في {{1}}!
📅 التاريخ: {{2}}
⏰ الوقت: {{3}}
👥 الأشخاص: {{4}}
🔢 المرجع: {{5}}

لتعديل أو إلغاء الحجز، أرسل رسالة على هذا الرقم.
```

**French:**
```
Votre réservation chez {{1}} est confirmée !
📅 Date : {{2}}
⏰ Heure : {{3}}
👥 Personnes : {{4}}
🔢 Référence : {{5}}

Pour modifier ou annuler, envoyez un message sur ce numéro.
```

**English:**
```
Your reservation at {{1}} is confirmed!
📅 Date: {{2}}
⏰ Time: {{3}}
👥 Party size: {{4}}
🔢 Reference: {{5}}

To modify or cancel, send a message to this number.
```

### Template 2: reservation_reminder
**Category:** TRANSACTIONAL
**Language:** Arabic, French, English

**French:**
```
Rappel : Votre réservation demain à {{1}} pour {{2}} personne(s) chez {{3}}.
Répondez OUI pour confirmer ou NON pour annuler.
```

### Template 3: waitlist_notification
**Category:** TRANSACTIONAL
**Language:** Arabic, French, English

**French:**
```
Une table s'est libérée chez {{1}} !
📅 {{2}} à {{3}} pour {{4}} personne(s).
Vous avez 15 minutes pour confirmer.
Répondez OUI pour réserver.
```

### Template 4: promotional
**Category:** MARKETING
**Language:** Arabic, French, English

**French:**
```
🎉 Offre spéciale {{1}} !
{{2}}
Valable jusqu'au {{3}}.
Réservez maintenant : {{4}}
```

## Step 5: Submit Templates for Approval

1. Go to WhatsApp → Message Templates
2. Create each template with the content above
3. Submit for review (typically 24-48h approval)
4. Once approved, templates can be used for outbound messages

## Step 6: Configure Environment Variables

```bash
# In Vercel / .env.local
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_min_16_chars
WHATSAPP_APP_SECRET=your_app_secret_from_meta
WHATSAPP_REMINDER_TEMPLATE=reservation_reminder
```

## Step 7: Test

### Test Webhook Verification
```bash
curl "https://your-domain.vercel.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=YOUR_VERIFY_TOKEN"
```
Should return: `test123`

### Test Inbound Message
1. Send a WhatsApp message to your business number
2. Check Vercel function logs for the webhook event
3. Verify the AI concierge responds

### Test Outbound Message
```bash
curl -X POST "https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "216XXXXXXXX",
    "type": "text",
    "text": {"body": "Test from Zanzibar Lounge"}
  }'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not receiving | Check URL is HTTPS, verify token matches |
| Messages not sending | Verify access token is not expired, check phone number |
| Template rejected | Review Meta's commerce policy, adjust content |
| 403 error | App needs to be approved for WhatsApp Business API |
| No AI response | Check `ANTHROPIC_API_KEY` is set, check function logs |

## Rate Limits

- **Starting tier:** 1,000 conversation/business/24h
- **Quality rating affects limits:** Green = higher limits
- **Messaging limits increase** as you send more messages and maintain quality

## Costs

- **WhatsApp Cloud API:** Free for first 1,000 conversations/month
- **Beyond 1,000:** ~$0.005-0.025 per conversation (varies by country)
- **Templates:** Free for service conversations, charged for business-initiated
