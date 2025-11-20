# Development Backlog

This file tracks features, improvements, and known issues for the Bluebonnet travel planner application.

## Open Items

### Features to Implement

#### Voucher Edit Functionality

**Status:** Not Implemented
**Priority:** Medium
**Location:** `views/account/vouchers.ejs:380`

**Description:**
The voucher management page has an "Edit" button for each voucher, but the functionality is currently stubbed out with an alert. Need to implement a proper edit modal that:

1. Fetches current voucher data from the server
2. Pre-populates a modal form with voucher details
3. Allows editing of:
   - Voucher type
   - Issuer
   - Voucher number
   - Total value
   - Expiration date
   - Notes
4. Validates input
5. Submits changes to the server via AJAX
6. Updates the voucher list without page reload

**Technical Notes:**

- Backend endpoint already exists: `PUT /vouchers/:id`
- Can reuse the existing voucher creation modal as a template
- Should follow the same pattern as other edit modals in the application

**Files to Update:**

- `views/account/vouchers.ejs` - Add edit modal HTML
- `public/js/voucher-sidebar-manager.js` or create new handler - Add edit functionality

---

## Completed Items

### Code Quality Improvements

- ✅ Removed unused/duplicate JavaScript files (trip-view-map.js, item-companions-loader.js, companion-selector.js, companions-manager.js)
- ✅ Removed backup files (.backup files)
- ✅ Externalized database pool timeouts as environment variables
- ✅ Externalized WebSocket timeouts as environment variables
- ✅ Made map tile URL configurable via environment variable (MAP_TILE_URL)
- ✅ Documented all environment variables in CLAUDE.md

---

## Future Considerations

### Performance

- Consider implementing service worker for offline support
- Evaluate need for GraphQL API as alternative to REST
- Consider implementing Redis pub/sub for real-time notifications

### Features

- Email notifications for trip reminders
- Calendar integration (iCal/Google Calendar export)
- PDF export for trip itineraries
- Mobile app (React Native or Flutter)

---

**Last Updated:** 2025-11-20
