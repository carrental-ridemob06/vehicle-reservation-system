Vehicle Reservation System
This repository manages the vehicle calendar reservation system for our customers.

Setup
Clone this repository.
Create .env.local and add your environment variables:
GOOGLE_APPLICATION_CREDENTIALS
SHEETS_SPREADSHEET_ID
Setup your Google Cloud project and service account.
Share your Google Sheets to the service account email.
Deploy to Vercel or your preferred server.
Structure
app/api/ : API routes for FreeBusy check and reservation.
app/ : Main Next.js frontend.
Notes
Do not commit service-account.json or .env.local.