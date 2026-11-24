# HPDC Production Monitoring Dashboard

Build the requested factory-supervisor dashboard in the existing supported project framework. The uploaded brief asks for a different MERN/MongoDB stack, which this project cannot run; real cloud storage is held until the user chooses it over demo-only mode.

## Build
- Establish an industrial, light-theme design system and responsive shell with collapsible navigation and a compact top bar.
- Replace the placeholder home screen with an Overview containing date/shift/machine filters, production KPIs, hourly target-vs-actual chart, and machine comparison.
- Add working Production, Machines and machine detail, Downtime, Quality, Operators, and Reports screens with searchable/sortable tables, shared filters, and CSV export.
- Keep sample records clearly identified as demo data; provide loading, empty, and error states where data is read or imported.
- Add spreadsheet upload validation and a review step; use actual factory headings when the user supplies a workbook. Do not claim imported data is persisted until the storage choice is resolved.
- Add route-specific page metadata and update the route test for the new home screen.

## Technical details
- Preserve TanStack Start, React, TypeScript, Tailwind v4, and the existing route conventions; do not install Express, MongoDB, or React Router DOM.
- Use existing Recharts/Lucide packages and the existing shadcn controls; add only the spreadsheet reader needed for Excel imports.
- Do not create database schema or server persistence until the user selects built-in storage; no factory workbook or photos are currently available.
