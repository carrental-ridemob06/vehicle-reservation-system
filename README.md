# Vehicle Reservation System

This repository manages the vehicle calendar reservation system for our customers.

## Setup

1. Clone this repository.
2. Create `.env.local` and add your environment variables:
   - `GOOGLE_APPLICATION_CREDENTIALS`
   - `SHEETS_SPREADSHEET_ID`
3. Setup your Google Cloud project and service account.
4. Share your Google Sheets to the service account email.
5. Deploy to Vercel or your preferred server.

## Structure

- `app/api/` : API routes for FreeBusy check and reservation.
- `app/` : Main Next.js frontend.

## Notes

- Do not commit `service-account.json` or `.env.local`.
