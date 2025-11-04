# Getting Started with Travel Companions

## Quick Navigation

### 1. Manage Travel Companions
Go to **Account Settings** → **Manage Travel Companions** card

This is where you can:
- ✅ View all your active companions
- ✅ See pending requests (incoming & outgoing)
- ✅ Manage unlinked companions
- ✅ Change permission levels
- ✅ Accept/decline requests

**Screenshot path**: Account Settings page, bottom section

---

### 2. Notifications (Real-time)
Look for the **bell icon** (🔔) in the top navigation bar

Click it to:
- ✅ View your latest notifications
- ✅ See unread count badge
- ✅ Accept/decline requests inline
- ✅ Join/decline trips directly
- ✅ Mark as read or delete

**Auto-updates**: Every 30 seconds when panel is open

---

## What You Can Do

### Send Companion Requests
1. Go to `/companions` (Companions link in nav)
2. Find or create a new companion
3. Send them a companion request

### Invite to Trips
When creating a trip, you can:
1. Add existing companions to the trip
2. They'll receive a trip invitation notification
3. They can accept to join your trip

### Manage Permissions
Two levels of permission:
- **View Travel**: Can view your trips but not edit
- **Manage Travel**: Can edit and add items to your trips

---

## API Endpoints Reference

### Companion Relationships
```
GET    /companion-relationships/mutual      # Get all active companions
GET    /companion-relationships/pending     # Get pending requests
POST   /companion-relationships/request     # Send new request
PUT    /companion-relationships/:id/accept  # Accept request
PUT    /companion-relationships/:id/decline # Decline request
PUT    /companion-relationships/:id/permission  # Change permission
DELETE /companion-relationships/:id         # Revoke relationship
```

### Trip Invitations
```
POST   /trip-invitations/trips/:tripId/invite  # Invite to trip
GET    /trip-invitations/pending              # Get pending invitations
PUT    /trip-invitations/:id/respond          # Accept/decline invitation
```

### Notifications
```
GET    /notifications              # Get notifications (up to 10)
GET    /notifications/count/unread # Get unread count
PUT    /notifications/:id/read     # Mark as read
DELETE /notifications/:id          # Delete notification
```

---

## Features at a Glance

| Feature | Location | Status |
|---------|----------|--------|
| Send Companion Requests | `/companions` | ✅ Ready |
| Manage Companions | `/account` | ✅ Ready |
| Real-time Notifications | Top navigation bar | ✅ Ready |
| Trip Invitations | Dashboard & `/trips` | ✅ Ready |
| Permission Management | Account Settings | ✅ Ready |
| Unlinked Companions | Account Settings | ✅ Ready |

---

## Troubleshooting

**Q: I don't see the Companions section in Account Settings**
- A: Make sure you're logged in and visiting `/account` page
- A: Clear browser cache and refresh the page

**Q: Notifications aren't showing**
- A: Click the bell icon to open the notification panel
- A: Check browser console (F12) for any errors
- A: Notifications update every 30 seconds

**Q: Can't find a user to add as companion**
- A: Go to `/companions` to create a new companion profile
- A: You can add companions by email or name

**Q: Permission changes not working**
- A: Make sure the relationship is "accepted" first
- A: Try clicking the refresh button in your browser

---

## Files Modified in This Release

- `views/partials/companions-manage.ejs` - Fixed API response mappings
- `views/partials/nav.ejs` - Notification system (already working)
- `controllers/companionRelationshipController.js` - API endpoints (working correctly)
- `controllers/notificationController.js` - Notification API (working correctly)

---

## Database Schema

### companion_relationships table
```
id              UUID (primary key)
userId          UUID (who sent the request)
companionUserId UUID (who received the request)
status          ENUM: pending, accepted, declined
permissionLevel ENUM: view_travel, manage_travel
createdAt       TIMESTAMP
respondedAt     TIMESTAMP (when accepted/declined)
updatedAt       TIMESTAMP
```

### notifications table
```
id              UUID (primary key)
userId          UUID (who receives the notification)
type            VARCHAR (companion_request, trip_invitation, etc.)
message         TEXT (human-readable message)
relatedId       UUID (links to relationship or invitation)
relatedType     VARCHAR (companion_relationship, trip_invitation)
read            BOOLEAN
actionRequired  BOOLEAN
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

### trip_invitations table
```
id              UUID (primary key)
tripId          UUID (foreign key to trip)
invitedUserId   UUID (who is invited)
invitedByUserId UUID (who sent the invitation)
status          ENUM: pending, joined, declined
createdAt       TIMESTAMP
respondedAt     TIMESTAMP (when responded)
updatedAt       TIMESTAMP
```

---

## Performance Tips

1. **Notification polling**: Currently set to 30 seconds
   - Edit line 183 in `nav.ejs` to change interval
   - Shorter = more real-time but more load
   - Longer = less load but slower updates

2. **Database indexing**: Already optimized for:
   - Status lookups
   - User ID lookups
   - Timestamp queries

3. **Frontend optimization**:
   - Notifications only load when bell is clicked
   - Paginated responses (10 notifications per page)
   - Lazy loading of modals

---

## Next Steps

1. ✅ Test creating a companion profile
2. ✅ Test sending a companion request
3. ✅ Test accepting/declining requests
4. ✅ Test changing permission levels
5. ✅ Test creating a trip with companions
6. ✅ Test trip invitations and notifications
7. ✅ Check database for created records

---

## Support Resources

- **API Documentation**: See `API_ENDPOINTS.md`
- **Architecture Details**: See `IMPLEMENTATION_GUIDE.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Bug Reports**: See `FRONTEND_INTEGRATION_REPORT.md` for recent fixes

---

**Status**: ✅ Ready for Testing and Production Deployment
