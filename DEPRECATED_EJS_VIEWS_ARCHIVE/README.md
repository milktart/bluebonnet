# Deprecated EJS Views Archive

**Status:** ARCHIVED - No longer in use as of December 28, 2025

This directory contains the original EJS (Embedded JavaScript) templating views that were used in the bluebonnet-dev environment before migration to SvelteKit.

## Why This Archive Exists

The application has been migrated from:
- **Old:** Express.js backend + EJS templating engine
- **New:** Express.js backend + SvelteKit frontend (TypeScript + Svelte)

The EJS views have been preserved in this archive to:
1. Maintain git history and full rollback capability
2. Reference the original styling and structure during migration
3. Serve as documentation of the legacy UI implementation

## Directory Structure

```
views/
├── index.ejs              # Landing page
├── login.ejs              # Login form
├── register.ejs           # Registration form
├── account/
│   ├── dashboard.ejs      # Main dashboard
│   ├── profile.ejs        # User profile
│   ├── settings.ejs       # Settings page
│   └── vouchers.ejs       # Voucher management
├── trips/
│   ├── index.ejs          # Trips listing
│   ├── trip.ejs           # Trip detail view
│   └── new-trip.ejs       # New trip form
├── partials/
│   ├── footer.ejs         # Footer component
│   ├── flash.ejs          # Alert/notification messages
│   ├── navigation.ejs     # Navigation bar
│   └── ...                # Other reusable components
└── layouts/
    └── main.ejs           # Main layout wrapper
```

## How to Restore

If you need to restore the EJS views to active use:

```bash
# Copy views back to the main directory
cp -r /bluebonnet-dev/DEPRECATED_EJS_VIEWS_ARCHIVE/views /bluebonnet-dev/views

# Verify restore
ls /bluebonnet-dev/views/
```

## Svelte Equivalents

The following pages have been migrated to Svelte (located in `/bluebonnet-dev/frontend/src/routes/`):

| EJS Original | Svelte Location | Status |
|---|---|---|
| `index.ejs` | `+page.svelte` | ✅ Migrated |
| `login.ejs` | `login/+page.svelte` | ✅ Migrated |
| `register.ejs` | `register/+page.svelte` | ✅ Migrated |
| `account/dashboard.ejs` | `dashboard/+page.svelte` | ✅ Migrated |
| `trips/trip.ejs` | `trips/[tripId]/+page.svelte` | ✅ Migrated |
| Others | `src/routes/` | ✅ Migrated |

## Backend Configuration

The Express backend configuration for EJS has been removed:

```javascript
// REMOVED from server.js:
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
```

The frontend is now served via:
1. Vite dev server on `http://localhost:5173` (development)
2. Built SvelteKit app in Docker (production)

## Dependencies No Longer Used

The following npm dependencies may be removed in future cleanup (currently still present):

- `ejs` - Server-side templating engine
- `preline` - UI component library (CSS was inlined in EJS templates)

The backend no longer depends on these for serving the UI.

## Git History

Full git history for all EJS files is preserved. To view the history of a specific view:

```bash
# View history of the landing page (when it was moved here)
git log --follow -- views/index.ejs

# See the last commit that modified the views directory
git log --oneline -- views/
```

## Questions?

- **What happened?** - The application was modernized by replacing server-side EJS templating with client-side SvelteKit
- **Why?** - Benefits include: better performance, type safety (TypeScript), component reusability, easier testing
- **Can I still use EJS?** - Not recommended. All functionality exists in the Svelte version
- **Will this be deleted?** - Not in the near future. Safe to keep for reference and rollback

---

**Archive Created:** December 28, 2025
**Version:** 3.0 (Svelte Migration)
**Last EJS Update:** December 27, 2025 (before migration)
