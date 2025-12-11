# Item Type Color Configuration

This document explains how to customize the colors for different travel item types in the application.

## Overview

The application uses a centralized color configuration system that allows you to update colors in one place and have those changes automatically applied throughout the entire application.

## Color Customization

### Where to Edit Colors

All colors are defined in a single file: **`config/itemColors.js`**

This file contains hex color codes for each item type:

```javascript
const ITEM_COLORS = {
  trip: {
    hex: '#28536b',        // Change this hex code
  },
  flight: {
    hex: '#f6d965',        // Change this hex code
  },
  hotel: {
    hex: '#c2a5df',        // Change this hex code
  },
  carRental: {
    hex: '#fea572',        // Change this hex code
  },
  transportation: {
    hex: '#67b3e0',        // Change this hex code
  },
  event: {
    hex: '#ff99c9',        // Change this hex code
  },
};
```

### How to Change Colors

1. Open `config/itemColors.js`
2. Find the item type you want to customize (e.g., `flight`, `hotel`, etc.)
3. Replace the hex code with your desired color
4. Save the file

**Example: Changing Flight Color**
```javascript
// Before
flight: {
  hex: '#f6d965',  // Yellow
},

// After
flight: {
  hex: '#FF6B6B',  // Red
},
```

### Where Colors Are Applied

Once you update a hex code in `config/itemColors.js`, it automatically affects:

- ✅ Form header icon backgrounds
- ✅ Form header icon colors
- ✅ Submit button colors (with hover darkening)
- ✅ Form input focus ring colors
- ✅ Form input focus shadows
- ✅ Dynamic styles throughout the application

## Current Color Scheme

| Item Type      | Color      | Hex Code |
|----------------|-----------|----------|
| Trip           | Dark Blue | #28536b  |
| Flight         | Yellow    | #f6d965  |
| Hotel          | Purple    | #c2a5df  |
| Car Rental     | Orange    | #fea572  |
| Transportation | Light Blue| #67b3e0  |
| Event          | Pink      | #ff99c9  |

## How It Works

The color system works through three main components:

### 1. Backend Configuration (`config/itemColors.js`)

- Centralized source of truth for all colors
- Provides utility functions to get colors by item type:
  - `getItemColor(itemType)` - Returns full color object
  - `getItemHexColor(itemType)` - Returns hex code
  - `getItemColorStyle(itemType, property)` - Returns inline style string

### 2. Server-Side Template Support (`server.js`)

- The color utilities are exposed to all EJS templates via `res.locals`
- Templates can call `getItemHexColor('flight')` to get the hex code
- Used for static styling in forms headers and buttons

### 3. Client-Side Dynamic Application (`public/js/item-colors.js`)

- JavaScript that runs in the browser
- Finds all forms with `data-item-type` attributes
- Dynamically applies colors to:
  - Form inputs (focus states)
  - Buttons (background and hover effects)
  - Icons and badges
- Automatically handles new forms loaded via AJAX

## Form Implementation

Each form includes the item type attribute:

```html
<div class="sidebar-form-container" data-item-type="flight">
  <!-- Form content -->

  <div data-icon-badge>
    <span class="material-symbols-outlined">flight</span>
  </div>

  <button type="submit">Submit</button>
</div>
```

The `data-item-type` attribute tells the client-side script which color scheme to apply.

## Code Examples

### Using Colors in Templates (Server-Side)

```html
<!-- Get hex color for use in inline styles -->
<% const flightColor = getItemHexColor('flight'); %>
<div style="background-color: <%= flightColor %>;">...</div>

<!-- Or use the style function -->
<span style="<%= getItemColorStyle('flight', 'color') %>;">Flight Info</span>
```

### Using Colors in JavaScript (Client-Side)

```javascript
// Colors are hardcoded in public/js/item-colors.js
const flightColor = '#f6d965';
const hotelColor = '#c2a5df';
```

## Common Use Cases

### Changing All Flight Colors
```javascript
// In config/itemColors.js
flight: {
  hex: '#1E40AF',  // Change from yellow to dark blue
},
```
Result: Flight form headers, icons, and buttons all turn dark blue

### Creating a Monochrome Scheme
```javascript
// In config/itemColors.js
trip: { hex: '#333333' },
flight: { hex: '#666666' },
hotel: { hex: '#999999' },
carRental: { hex: '#CCCCCC' },
transportation: { hex: '#DDDDDD' },
event: { hex: '#EEEEEE' },
```

### Using Brand Colors
```javascript
// In config/itemColors.js - Using company brand colors
trip: { hex: '#0D47A1' },      // Brand primary blue
flight: { hex: '#F57C00' },    // Brand accent orange
hotel: { hex: '#6A1B9A' },     // Brand secondary purple
carRental: { hex: '#00695C' }, // Brand green
transportation: { hex: '#D32F2F' }, // Brand red
event: { hex: '#1565C0' },     // Brand light blue
```

## Performance Notes

- Colors are loaded once when the server starts
- Client-side color application is lightweight (~2KB)
- Changes to `config/itemColors.js` require server restart
- No database queries needed for color styling

## Troubleshooting

### Colors Not Changing?

1. **Server Restart Required**: After editing `config/itemColors.js`, restart the server for changes to take effect
2. **Browser Cache**: Clear browser cache (Ctrl+Shift+Delete) to see changes
3. **Check Hex Format**: Ensure hex codes are valid (e.g., #RRGGBB with 6 characters)

### Form Not Getting Colors?

1. Ensure the form has the `data-item-type` attribute
2. Check that `public/js/item-colors.js` is being loaded
3. Verify the item type name matches config keys (lowercase)

### Syntax Error in config/itemColors.js?

- Ensure all hex values are strings in quotes: `'#f6d965'`
- Check for missing commas between properties
- Validate JSON syntax using a JSON linter

## Related Files

- `config/itemColors.js` - Color definitions and utility functions
- `server.js` - Exposes color functions to templates
- `public/js/item-colors.js` - Client-side color application
- `public/css/item-colors.css` - CSS variables for future use
- `views/partials/flight-form.ejs` - Example form implementation
- `views/partials/hotel-form.ejs` - Example form implementation
- `views/partials/transportation-form.ejs` - Example form implementation
- `views/partials/car-rental-form.ejs` - Example form implementation
- `views/partials/event-form.ejs` - Example form implementation

## Future Enhancements

- [ ] Admin UI for color picker
- [ ] Database storage of custom colors
- [ ] Color validation and contrast checking
- [ ] Preset color schemes
- [ ] Per-user color customization
