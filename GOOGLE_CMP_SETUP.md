# Google CMP (Funding Choices) Setup

Use this guide to enable Google-certified consent collection for users in EEA, UK, and Switzerland while keeping AdSense eligible.

## 1) Configure Funding Choices in AdSense

1. Open AdSense: **Privacy & messaging**.
2. Create a **GDPR** message.
3. Choose a message layout with:
   - **Consent** button
   - **Manage options** button
4. Region targeting: **EEA, UK, Switzerland**.
5. Publish the message.

If AdSense shows an additional site/message identifier, set it as:

- `NEXT_PUBLIC_GOOGLE_FC_SITE_ID`

## 2) Environment variables

Set these in production:

- `NEXT_PUBLIC_ADSENSE_PUB_ID` (example: `ca-pub-4731703376366094`)
- `NEXT_PUBLIC_GOOGLE_CMP_ENABLED=true`
- `NEXT_PUBLIC_GOOGLE_FC_SITE_ID` (optional, if provided by Funding Choices)

## 3) Integration behavior

The app now loads scripts in this order:

1. Funding Choices bootstrap
2. `googlefcPresent` iframe marker
3. AdSense script

This ensures consent UI can appear before ad requests where required.

## 4) Validation checklist

### Geo/consent checks
- Test with EEA/UK/CH IP (VPN):
  - Consent message appears.
  - **Manage options** opens preferences.
  - Consent state persists after refresh.

### Technical checks
- Browser console has no duplicate-script errors.
- Network tab shows:
  - `fundingchoicesmessages.google.com` loaded
  - `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` loaded

### AdSense checks
- In AdSense diagnostics/privacy messages:
  - Site shows active privacy message.
  - No policy warning about missing consent collection for required regions.

## 5) Future-site rollout

For each new site:

1. Add domain in AdSense.
2. Create/publish Funding Choices GDPR message for that domain.
3. Set env vars on that deployment.
4. Run the validation checklist above before driving paid/SEO traffic.

