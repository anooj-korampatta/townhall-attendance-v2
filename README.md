# GWC Townhall Attendance — Supabase Edition

Responsive React/Vite attendance app for GitHub Pages with Supabase PostgreSQL + Realtime.

## Source workbook reviewed

`TownHall Attendance V1.xlsx`

Sheets:
- Staff — 186 rows
- Attendance — 38 rows
- AttendanceLog — 50 rows

The `Staff` sheet is the primary invitee source.

### Staff columns found

- `EmployeeID ` (trailing space in the Excel header)
- `Name`
- `Department`
- ` Mobile` (leading space in the Excel header)
- `Email`
- `Status`
- `LastCheckIn`
- `LastCheckOut`

The import should trim the two header spaces.

## Stack

- React
- Vite
- Supabase PostgreSQL
- Supabase Realtime
- GitHub Pages

## Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Import the cleaned Staff sheet into `attendees`.
5. Create `.env` from `.env.example`.
6. Add your Supabase project URL and anon key.
7. Run:

```bash
npm install
npm run dev
```

Dashboard:

`/#dashboard`

## GitHub Pages

Add these GitHub repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then enable GitHub Pages using GitHub Actions.

## Important security note

The starter RLS policies are intentionally simple for event testing. Before production, I recommend moving check-in/check-out mutations behind a Supabase Edge Function/RPC and tightening RLS so the browser cannot arbitrarily update attendee records.

Keep the existing Google Apps Script/Sheets version as the fallback until the Supabase version is tested with the real event flow.

## Historical logs

The workbook has both `Attendance` and `AttendanceLog`, with overlapping historical activity and slightly different columns. Do not blindly merge them. Decide which historical sheet should be retained before importing historical logs.
