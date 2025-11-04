# Travel Companions System - API Endpoints Reference

This document provides detailed API endpoint documentation for the travel companions feature. Use this as a reference when testing or debugging.

---

## Companion Relationships Endpoints

### POST /companion-relationships/request
**Purpose**: Create and send a new companion request

**Authentication**: Required (Passport session)

**Request Body**:
```json
{
  "companionId": "uuid-of-companion"
}
```

**Response - Success (201)**:
```json
{
  "success": true,
  "message": "Companion request sent successfully",
  "relationship": {
    "id": "uuid",
    "userId": "user-uuid",
    "companionUserId": "companion-uuid",
    "status": "pending",
    "permissionLevel": null,
    "createdAt": "2024-11-04T12:00:00Z"
  }
}
```

**Response - Error (400)**:
```json
{
  "success": false,
  "message": "Companion request already exists"
}
```

---

### GET /companion-relationships/pending
**Purpose**: Get all pending companion requests (incoming and outgoing)

**Authentication**: Required

**Query Parameters**: None

**Response - Success (200)**:
```json
{
  "success": true,
  "incoming": [
    {
      "id": "uuid",
      "userId": "sender-id",
      "companionUserId": "receiver-id",
      "status": "pending",
      "permissionLevel": null,
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    }
  ],
  "outgoing": [
    {
      "id": "uuid",
      "userId": "sender-id",
      "companionUserId": "receiver-id",
      "status": "pending",
      "permissionLevel": null,
      "user": {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      }
    }
  ]
}
```

---

### PUT /companion-relationships/:relationshipId/accept
**Purpose**: Accept a pending companion request

**Authentication**: Required

**URL Parameters**:
- `relationshipId`: UUID of the relationship to accept

**Request Body**:
```json
{
  "permissionLevel": "view_travel"
}
```

**Valid Permission Levels**:
- `view_travel`: Basic viewing of trips and items
- `manage_travel`: Full control including trip creation
- `explicit`: Trip-by-trip permissions (default)

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Companion request accepted",
  "relationship": {
    "id": "uuid",
    "status": "accepted",
    "permissionLevel": "view_travel",
    "updatedAt": "2024-11-04T12:05:00Z"
  }
}
```

---

### PUT /companion-relationships/:relationshipId/decline
**Purpose**: Decline a pending companion request

**Authentication**: Required

**URL Parameters**:
- `relationshipId`: UUID of the relationship to decline

**Request Body**: Empty or null

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Companion request declined",
  "relationship": {
    "id": "uuid",
    "status": "declined",
    "updatedAt": "2024-11-04T12:05:00Z"
  }
}
```

---

### DELETE /companion-relationships/:relationshipId
**Purpose**: Revoke/delete a companion relationship

**Authentication**: Required

**URL Parameters**:
- `relationshipId`: UUID of the relationship to revoke

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Companion relationship revoked"
}
```

**Response - Error (403)**:
```json
{
  "success": false,
  "message": "You can only revoke relationships you created"
}
```

---

### PUT /companion-relationships/:relationshipId/permission
**Purpose**: Update permission level for an accepted relationship

**Authentication**: Required

**URL Parameters**:
- `relationshipId`: UUID of the relationship

**Request Body**:
```json
{
  "permissionLevel": "manage_travel"
}
```

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Permission level updated",
  "relationship": {
    "id": "uuid",
    "permissionLevel": "manage_travel",
    "updatedAt": "2024-11-04T12:05:00Z"
  }
}
```

---

### GET /companion-relationships/mutual
**Purpose**: Get all mutual (accepted) companion relationships

**Authentication**: Required

**Response - Success (200)**:
```json
{
  "success": true,
  "companions": [
    {
      "id": "uuid",
      "companionId": "companion-uuid",
      "status": "accepted",
      "permissionLevel": "view_travel",
      "companion": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "555-0123"
      }
    }
  ]
}
```

---

### POST /companion-relationships/:relationshipId/resend
**Purpose**: Resend a declined companion request

**Authentication**: Required

**URL Parameters**:
- `relationshipId`: UUID of the declined relationship

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Request resent successfully"
}
```

---

## Trip Invitations Endpoints

### POST /trip-invitations/trips/:tripId/invite
**Purpose**: Invite a companion to a trip

**Authentication**: Required

**URL Parameters**:
- `tripId`: UUID of the trip

**Request Body**:
```json
{
  "companionId": "companion-uuid",
  "permissionLevel": "view_travel"
}
```

**Response - Success (201)**:
```json
{
  "success": true,
  "message": "Companion invited to trip",
  "invitation": {
    "id": "uuid",
    "tripId": "trip-uuid",
    "companionId": "companion-uuid",
    "companionEmail": "user@example.com",
    "status": "pending",
    "createdAt": "2024-11-04T12:00:00Z"
  }
}
```

---

### GET /trip-invitations/pending
**Purpose**: Get all pending trip invitations for current user

**Authentication**: Required

**Response - Success (200)**:
```json
{
  "success": true,
  "invitations": [
    {
      "id": "uuid",
      "tripId": "trip-uuid",
      "status": "pending",
      "trip": {
        "id": "uuid",
        "name": "Europe Trip",
        "departureDate": "2024-12-01",
        "returnDate": "2024-12-15",
        "owner": {
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      "createdAt": "2024-11-04T12:00:00Z"
    }
  ]
}
```

---

### PUT /trip-invitations/:invitationId/respond
**Purpose**: Accept or decline a trip invitation

**Authentication**: Required

**URL Parameters**:
- `invitationId`: UUID of the invitation

**Request Body**:
```json
{
  "response": "join"  // or "decline"
}
```

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "invitation": {
    "id": "uuid",
    "status": "accepted",
    "updatedAt": "2024-11-04T12:05:00Z"
  }
}
```

---

## Notifications Endpoints

### GET /notifications
**Purpose**: Get notifications for current user

**Authentication**: Required

**Query Parameters**:
- `limit`: Number of notifications to return (default: 10, max: 100)
- `offset`: Number of notifications to skip (default: 0)

**Response - Success (200)**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "type": "companion_request_received",
      "message": "John Doe sent you a companion request",
      "relatedId": "relationship-uuid",
      "read": false,
      "createdAt": "2024-11-04T12:00:00Z"
    },
    {
      "id": "uuid",
      "userId": "user-uuid",
      "type": "trip_invitation_received",
      "message": "You've been invited to Europe Trip",
      "relatedId": "invitation-uuid",
      "read": false,
      "createdAt": "2024-11-04T11:55:00Z"
    }
  ]
}
```

---

### GET /notifications/count/unread
**Purpose**: Get count of unread notifications

**Authentication**: Required

**Response - Success (200)**:
```json
{
  "success": true,
  "unreadCount": 3
}
```

---

### GET /notifications/companions
**Purpose**: Get only companion request notifications

**Authentication**: Required

**Response - Success (200)**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "companion_request_received",
      "message": "Jane Smith sent you a companion request",
      "relatedId": "relationship-uuid",
      "read": false,
      "createdAt": "2024-11-04T12:00:00Z"
    }
  ]
}
```

---

### GET /notifications/trips
**Purpose**: Get only trip invitation notifications

**Authentication**: Required

**Response - Success (200)**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "trip_invitation_received",
      "message": "You've been invited to Japan Trip",
      "relatedId": "invitation-uuid",
      "read": false,
      "createdAt": "2024-11-04T12:00:00Z"
    }
  ]
}
```

---

### PUT /notifications/:notificationId/read
**Purpose**: Mark a single notification as read

**Authentication**: Required

**URL Parameters**:
- `notificationId`: UUID of the notification

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### PUT /notifications/read-all
**Purpose**: Mark all notifications as read

**Authentication**: Required

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "count": 5
}
```

---

### DELETE /notifications/:notificationId
**Purpose**: Delete a notification

**Authentication**: Required

**URL Parameters**:
- `notificationId`: UUID of the notification

**Response - Success (200)**:
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## Item Companions Endpoints

These endpoints are used internally but documented for reference.

### GET /items/:itemType/:itemId/companions
**Purpose**: Get companions for a specific item

**Authentication**: Required

**URL Parameters**:
- `itemType`: Type of item (flight, hotel, transportation, event, car_rental)
- `itemId`: UUID of the item

**Response - Success (200)**:
```json
{
  "success": true,
  "companions": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "inherited": true,
      "status": "attending"
    }
  ]
}
```

---

## Error Response Codes

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Not authenticated/session expired |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate) |
| 500 | Server Error | Internal server error |

---

## Testing Tips

### Using cURL

**Send Companion Request**:
```bash
curl -X POST http://localhost:3000/companion-relationships/request \
  -H "Content-Type: application/json" \
  -d '{"companionId": "uuid-here"}' \
  --cookie "session=session-cookie"
```

**Accept Companion Request**:
```bash
curl -X PUT http://localhost:3000/companion-relationships/uuid/accept \
  -H "Content-Type: application/json" \
  -d '{"permissionLevel": "view_travel"}' \
  --cookie "session=session-cookie"
```

**Get Notifications**:
```bash
curl -X GET "http://localhost:3000/notifications?limit=10" \
  --cookie "session=session-cookie"
```

---

### Using Postman

1. Import the API endpoints into Postman
2. Create a collection for "Travel Companions"
3. Set up environment variables for:
   - `base_url`: `http://localhost:3000`
   - `user_id`: UUID of test user
   - `relationship_id`: UUID of created relationship
   - `trip_id`: UUID of created trip

4. Use Pre-request Scripts to handle authentication (session cookies)

---

## Database Queries for Verification

### Check Companion Relationships
```sql
SELECT
  cr.id,
  cr.status,
  cr."permissionLevel",
  u1."firstName" || ' ' || u1."lastName" as "From User",
  u2."firstName" || ' ' || u2."lastName" as "To User",
  cr."createdAt"
FROM "CompanionRelationship" cr
JOIN "User" u1 ON cr."userId" = u1.id
LEFT JOIN "User" u2 ON cr."companionUserId" = u2.id
ORDER BY cr."createdAt" DESC;
```

### Check Trip Invitations
```sql
SELECT
  ti.id,
  ti.status,
  t.name,
  ti."companionEmail",
  ti."createdAt"
FROM "TripInvitation" ti
JOIN "Trip" t ON ti."tripId" = t.id
ORDER BY ti."createdAt" DESC;
```

### Check Item Companions
```sql
SELECT
  ic.id,
  ic."itemType",
  ic."itemId",
  ic.inherited,
  tc.name as companion_name,
  ic."createdAt"
FROM "ItemCompanion" ic
JOIN "TravelCompanion" tc ON ic."companionId" = tc.id
ORDER BY ic."createdAt" DESC;
```

### Check Notifications
```sql
SELECT
  n.id,
  n.type,
  n.message,
  n.read,
  n."createdAt"
FROM "Notification" n
ORDER BY n."createdAt" DESC;
```

---

## Troubleshooting

### Notifications Not Appearing
1. Check that polling is enabled: browser console should show fetch calls to `/notifications`
2. Verify notification center is open (bell icon clicked)
3. Check database: `SELECT * FROM "Notification" WHERE "userId" = 'your-user-id';`
4. Verify relationship/invitation was created with `createdAt` timestamp recent

### Companions Not Showing on Items
1. Check that companion was added to trip (TripInvitation.status = 'accepted')
2. Verify ItemCompanion records exist: `SELECT * FROM "ItemCompanion" WHERE "itemId" = 'item-uuid';`
3. Clear browser cache and refresh page
4. Check browser console for JavaScript errors

### Permission Denials
1. Verify relationship status is 'accepted': `SELECT * FROM "CompanionRelationship" WHERE id = 'uuid';`
2. Check TripCompanion.canEdit flag: `SELECT * FROM "TripCompanion" WHERE "companionId" = 'uuid';`
3. Verify user is authenticated: check session cookie in Developer Tools
4. Check server logs for 403 Forbidden error messages

### Database Constraint Errors
1. Ensure user accounts exist before creating relationships
2. Verify trip exists before creating invitations
3. Check that cascade delete isn't removing needed records
4. Run: `PRAGMA foreign_keys;` (SQLite) or check foreign key constraints (PostgreSQL)

