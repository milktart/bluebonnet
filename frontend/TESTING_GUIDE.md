# Bluebonnet Svelte Frontend - Testing Guide

## Quick Start

### 1. Start the Development Server

```bash
# Navigate to the project directory
cd /home/home/bluebonnet-dev/frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3001` (or next available port)

### 2. Start the Express Backend

In another terminal:

```bash
# Navigate to the backend directory
cd /home/home/bluebonnet

# Ensure PostgreSQL is running, then:
npm run dev
```

Backend API will be at `http://localhost:3000`

## Manual Testing Workflow

### Phase 1: Authentication Flow

#### 1.1 Register a New Account

**Steps**:

1. Go to `http://localhost:3001`
2. Click "Get Started Free" or navigate to `/register`
3. Fill in the form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
   - Check "I agree to Terms"
4. Click "Create Account"

**Expected Results**:

- ✅ Form validates required fields
- ✅ Password confirmation matches checked
- ✅ Account created successfully
- ✅ Redirected to dashboard
- ✅ User name appears in navigation

**Troubleshooting**:

- If registration fails, check browser console for errors
- Verify Express backend is running
- Check that API_BASE in `src/lib/services/api.ts` is correct

#### 1.2 Login

**Steps**:

1. Navigate to `/login`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Click "Sign In"

**Expected Results**:

- ✅ Form validates inputs
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ User session maintained (refresh page - still logged in)

**Troubleshooting**:

- Check browser DevTools Network tab for API responses
- Verify token is stored in localStorage

#### 1.3 Logout

**Steps**:

1. Click user name in top-right navbar
2. Click "Logout"

**Expected Results**:

- ✅ Logged out successfully
- ✅ Redirected to login page
- ✅ Session cleared (refresh shows login)

### Phase 2: Dashboard Testing

#### 2.1 Dashboard Navigation

**Steps**:

1. Login to the app
2. Verify dashboard loads with trip list
3. Click on "Upcoming", "Past", "All" tabs

**Expected Results**:

- ✅ Dashboard displays correctly
- ✅ Trip list shows all trips
- ✅ Tabs filter correctly
- ✅ Trip counts update in tabs

#### 2.2 Create Trip

**Steps**:

1. Click "+ New Trip" button on dashboard
2. Fill in the form:
   - Trip Name: `Paris Adventure 2025`
   - Destination: `Paris, France`
   - Description: `Summer vacation in Paris`
   - Start Date: `2025-06-15`
   - End Date: `2025-06-22`
   - Budget: `5000`
   - Status: `Planning`
3. Click "Create Trip"

**Expected Results**:

- ✅ Form validates all required fields
- ✅ Trip created successfully
- ✅ Redirected to trip detail page
- ✅ Trip appears in dashboard list

#### 2.3 Delete Trip

**Steps**:

1. Go to dashboard
2. Find a trip card
3. Click "Delete" button

**Expected Results**:

- ✅ Trip deleted without confirmation (per architecture)
- ✅ Dashboard updates automatically
- ✅ Trip no longer appears in list

### Phase 3: Trip Detail Testing

#### 3.1 View Trip Details

**Steps**:

1. Click on a trip from dashboard
2. Verify all tabs load correctly

**Expected Results**:

- ✅ Trip name, destination, dates display
- ✅ All tabs (Flights, Hotels, Events, Companions) load
- ✅ Summary sidebar shows trip metrics
- ✅ Back button navigates to dashboard

#### 3.2 Edit Trip

**Steps**:

1. Go to trip detail page
2. Click "Edit Trip" button
3. Modify a field (e.g., change destination)
4. Click "Update Trip"

**Expected Results**:

- ✅ Edit form loads with current trip data
- ✅ Changes saved successfully
- ✅ Redirected back to trip detail
- ✅ Updated data displays

### Phase 4: Travel Items Testing

#### 4.1 Add Flight

**Steps**:

1. Go to trip detail page
2. Click "Flights" tab
3. Click "+ Add Flight" button
4. Fill in the form:
   - Origin: `JFK`
   - Destination: `CDG`
   - Airline: `Air France`
   - Flight Number: `AF001`
   - Departure: `2025-06-15 10:00`
   - Arrival: `2025-06-15 22:30`
   - Seat: `12A`
   - Class: `Economy`
5. Click "Add Flight"

**Expected Results**:

- ✅ Form validates required fields
- ✅ Date/time picker works correctly
- ✅ Flight created successfully
- ✅ Flight appears in Flights tab
- ✅ Summary shows flight count updated

#### 4.2 Edit Flight

**Steps**:

1. Go to trip detail, Flights tab
2. Click "Edit" on a flight
3. Modify a field (e.g., seat number)
4. Click "Update Flight"

**Expected Results**:

- ✅ Edit form shows current flight data
- ✅ Changes saved successfully
- ✅ Sidebar refreshes automatically

#### 4.3 Delete Flight

**Steps**:

1. Go to trip detail, Flights tab
2. Click "Delete" on a flight

**Expected Results**:

- ✅ Flight deleted immediately
- ✅ Flight list updates
- ✅ Summary shows updated count

#### 4.4 Add Hotel

**Steps**:

1. Go to trip detail page
2. Click "Hotels" tab
3. Click "+ Add Hotel"
4. Fill in:
   - Hotel Name: `Hotel le Marais`
   - Location: `Paris, France`
   - Address: `123 Rue des Vosges`
   - Check-in: `2025-06-15`
   - Check-out: `2025-06-20`
   - Room Type: `Deluxe`
   - Confirmation #: `HLM123456`
5. Click "Add Hotel"

**Expected Results**:

- ✅ Hotel form validates
- ✅ Hotel created and appears in list
- ✅ Trip summary updated

#### 4.5 Add Event

**Steps**:

1. Click "Events" tab
2. Click "+ Add Event"
3. Fill in:
   - Event Name: `Eiffel Tower Visit`
   - Category: `Tour`
   - Location: `Eiffel Tower, Paris`
   - Date: `2025-06-17 14:00`
   - Cost: `25.50`
   - Description: `Guided tour of Eiffel Tower`
4. Click "Add Event"

**Expected Results**:

- ✅ Event created
- ✅ Appears in Events tab
- ✅ Calendar timeline includes new event

#### 4.6 Add Companions

**Steps**:

1. Click "Companions" tab
2. Click "+ Add Companion"
3. Fill in:
   - Name: `Sarah Smith`
   - Email: `sarah@example.com`
   - Phone: `+1 (555) 123-4567`
4. Click "Add Companion"

**Expected Results**:

- ✅ Companion form validates
- ✅ Companion added to trip
- ✅ Appears in Companions tab
- ✅ Summary shows updated companion count

### Phase 5: Component Testing

#### 5.1 Form Components

**Test Each Input Type**:

1. **TextInput**
   - Type text and verify display
   - Leave empty and verify required message
   - Try invalid email format

2. **Textarea**
   - Type multi-line text
   - Verify line wrapping
   - Test with special characters

3. **Select Dropdown**
   - Click to open
   - Select different options
   - Verify selection displays

4. **DateTimePicker**
   - Click date input
   - Select date from picker
   - Verify time input accepts HH:MM format
   - Test ISO format output

5. **Checkbox**
   - Click to toggle
   - Verify checked/unchecked state

6. **Radio**
   - Select different radio options
   - Verify only one can be selected

#### 5.2 Display Components

1. **Alert**
   - Create trip with invalid data
   - Verify error alert displays
   - Try dismissible alert

2. **Modal**
   - Test modal open/close
   - Verify backdrop click closes
   - Test ESC key closes

3. **Loading**
   - Simulate slow API call
   - Verify loading spinner displays
   - Test loading message

4. **Grid**
   - View trip cards on different screen sizes
   - Verify responsive column adjustment

### Phase 6: Responsive Design Testing

#### 6.1 Desktop (1200px+)

```bash
# Open browser DevTools
# Keep device toolbar off
# Test at full width
```

**Verify**:

- ✅ 2-column layouts display correctly
- ✅ Sidebars visible
- ✅ Navigation fully expanded
- ✅ All content readable

#### 6.2 Tablet (768px - 1024px)

```bash
# DevTools > Toggle device toolbar
# Select "iPad" or set width 768px
```

**Verify**:

- ✅ 1-column layouts
- ✅ Touch targets large enough
- ✅ Forms stack vertically
- ✅ Navigation adapts

#### 6.3 Mobile (< 768px)

```bash
# DevTools > Toggle device toolbar
# Select "iPhone" or set width 375px
```

**Verify**:

- ✅ Hamburger menu displays
- ✅ Single column layout
- ✅ Buttons/links tappable (44px minimum)
- ✅ Form inputs keyboard-friendly
- ✅ No horizontal scroll

### Phase 7: API Integration Testing

#### 7.1 Network Monitoring

**Steps**:

1. Open DevTools > Network tab
2. Create a new trip
3. Watch network requests

**Verify**:

- ✅ POST request sent to correct endpoint
- ✅ Request includes all form data
- ✅ Response status 200/201
- ✅ Response contains new trip data
- ✅ No 4xx/5xx errors

#### 7.2 Error Handling

**Test Network Errors**:

1. Disconnect internet or block API
2. Try to create a trip
3. Verify error message displays

**Verify**:

- ✅ Error alert displays
- ✅ Form doesn't submit
- ✅ User can retry

#### 7.3 Data Persistence

**Steps**:

1. Create a trip
2. Refresh the page (F5)
3. Navigate to dashboard

**Verify**:

- ✅ Trip still visible (loaded from API)
- ✅ All trip data preserved
- ✅ No data loss on refresh

### Phase 8: Browser DevTools Inspection

#### 8.1 Console (F12 > Console)

**Check for**:

- ✅ No JavaScript errors (red messages)
- ✅ No warnings that block functionality
- ✅ Clean console on load

**Common Issues**:

- Missing API endpoints
- CORS errors
- TypeScript compilation errors

#### 8.2 Network (F12 > Network)

**Check**:

- ✅ All API calls successful (200/201)
- ✅ No 404s or 500s
- ✅ API response times < 1 second
- ✅ No failed requests

#### 8.3 Storage (F12 > Application > Storage)

**Check localStorage**:

- ✅ `authToken` stored on login
- ✅ `user` object stored
- ✅ Data cleared on logout

#### 8.4 Elements (F12 > Inspector)

**Verify**:

- ✅ Semantic HTML structure
- ✅ Proper label associations
- ✅ ARIA attributes present
- ✅ CSS classes applied correctly

## Automated Testing Setup

### Unit Tests with Vitest

```bash
# Install test dependencies
npm install -D vitest @testing-library/svelte @testing-library/user-event

# Create test file: src/lib/stores/tripStore.test.ts
# Run tests
npm run test
```

### E2E Tests with Playwright

```bash
# Install Playwright
npm install -D @playwright/test

# Create test file: tests/e2e/login.spec.ts
# Run tests
npm run test:e2e
```

## Test Checklist

### Functionality

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Create trip works
- [ ] Edit trip works
- [ ] Delete trip works
- [ ] Add flight works
- [ ] Add hotel works
- [ ] Add event works
- [ ] Add companion works
- [ ] Edit items works
- [ ] Delete items works

### Forms

- [ ] All required fields validated
- [ ] Error messages display
- [ ] Date picker works
- [ ] Time picker works
- [ ] Select dropdowns work
- [ ] Loading states display
- [ ] Form submission successful

### UI/UX

- [ ] All buttons clickable
- [ ] All links navigate correctly
- [ ] Error messages user-friendly
- [ ] Loading spinners show
- [ ] Navigation responsive
- [ ] Modals work correctly
- [ ] Alerts dismissible

### Performance

- [ ] Page loads in < 2 seconds
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] No jank/stuttering
- [ ] Images optimized

### Accessibility

- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Labels associated with inputs
- [ ] ARIA attributes present
- [ ] Color contrast sufficient
- [ ] Focus visible

### Browser Compatibility

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Troubleshooting Common Issues

### "API Connection Failed"

**Solution**:

```bash
# Check Express backend is running
# Verify API_BASE in src/lib/services/api.ts matches backend URL
# Check CORS is enabled on backend
# Verify no firewall blocking localhost:3000
```

### "Form not submitting"

**Solution**:

```javascript
// Open browser console and check for errors
// Check Network tab for failed requests
// Verify form field names match API expectations
// Check validation isn't blocking submission
```

### "Data not persisting"

**Solution**:

```bash
# Verify PostgreSQL is running
# Check database tables were created
# Verify API responses include data
# Check localStorage for auth token
```

### "Responsive layout broken"

**Solution**:

```bash
# Check viewport meta tag in src/app.html
# Verify CSS media queries are correct
# Test at exact breakpoints (768px, 1024px)
# Clear browser cache (Ctrl+Shift+Delete)
```

## Performance Testing

### Lighthouse Audit

```bash
# Open DevTools > Lighthouse
# Select "Generate report"
# Target scores:
#   Performance: 80+
#   Accessibility: 90+
#   Best Practices: 90+
#   SEO: 90+
```

### Bundle Size

```bash
# Analyze bundle size
npm run build
# Check dist/ folder size

# Expected:
#   HTML: < 50 KB
#   CSS: < 30 KB
#   JS: < 100 KB
#   Total: < 180 KB
```

## Testing Different Scenarios

### Empty States

- Dashboard with no trips
- Trip with no flights
- Trip with no companions
- No search results

### Edge Cases

- Very long trip names
- International characters in form fields
- Past dates for trips
- Duplicate trip names
- Maximum companions limit

### Data Validation

- Email format validation
- Phone number format
- Number field boundaries
- Date range validation (end > start)
- Required field checking

## Reporting Issues

### Template for Bug Reports

```markdown
## Bug Title

### Description

What happened

### Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

### Expected Behavior

What should happen

### Actual Behavior

What actually happens

### Screenshots

[Attach screenshot]

### System Info

- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop
```

## Next Steps

1. ✅ Manual testing complete - Check all test items above
2. ✅ Performance profiling - Run Lighthouse
3. ✅ Accessibility audit - Run browser tools
4. ✅ Fix any issues found
5. ⏭️ Set up automated tests (Vitest + Playwright)
6. ⏭️ Deploy to staging environment
7. ⏭️ User acceptance testing (UAT)
8. ⏭️ Production deployment

---

**Start testing**: `npm run dev` and navigate to `http://localhost:3001`
