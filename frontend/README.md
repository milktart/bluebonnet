# Bluebonnet - Travel Trip Planner

A modern, full-featured travel planning application built with SvelteKit, TypeScript, and Tailwind CSS. Plan your trips with comprehensive management of flights, hotels, events, transportation, car rentals, and travel companions.

## ✨ Features

### Core Functionality
- 🔐 **User Authentication** - Secure login and registration
- 🗺️ **Interactive Map** - Leaflet-based visualization
- 📊 **Dashboard** - Trip overview with filtering
- 📅 **Trip Planning** - Complete trip management

### Travel Items (Full CRUD)
- ✈️ **Flights** - Airlines, seats, times
- 🏨 **Hotels** - Accommodations with dates
- 🎭 **Events** - Activities and attractions
- 🚗 **Transportation** - Local transit options
- 🚙 **Car Rentals** - Vehicle management
- 🎫 **Vouchers** - Discount codes

### Collaboration & UX
- 👥 **Travel Companions** - Invite with permissions
- 🎨 **Responsive Design** - Mobile, tablet, desktop
- ⚡ **Loading States** - Visual feedback
- 🎯 **Form Validation** - Data integrity
- 💬 **Error Handling** - User-friendly messages
- 📅 **Timeline View** - Calendar visualization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone <repo-url>
cd bluebonnet-svelte
npm install
npm run dev
```

Visit `http://localhost:5173`

## 🛠️ Available Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run preview       # Preview build
npm test              # Run tests
npm run test:ui       # UI test dashboard
npm run test:coverage # Coverage report
npm run lint          # Code check
npm run format        # Format code
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/    # Reusable components
│   ├── services/      # API client
│   ├── stores/        # State management
│   └── tests/         # Unit tests
├── routes/            # Pages and layouts
└── app.css            # Global styles
```

## 🧪 Testing

```bash
npm test              # Watch mode
npm run test:ui       # UI dashboard
npm run test:coverage # Coverage report
```

Test coverage includes:
- ✓ API error handling
- ✓ Form validation
- ✓ Component rendering
- ✓ State management

## 🔐 Error Handling

User-friendly messages for:
- 401: Session expired
- 403: Permission denied
- 404: Not found
- 409: Conflict
- 5xx: Server error
- Network errors

## 📝 Form Validation

All forms include:
- Required field checks
- Data type validation
- Format validation
- Custom error messages

## 📱 Responsive Design

- Desktop (1024px+)
- Tablet (600-1023px)
- Mobile (<600px)

## ♿ Accessibility

- ✓ Keyboard navigation
- ✓ ARIA labels
- ✓ Color contrast (WCAG AA)
- ✓ Semantic HTML
- ✓ Focus management

## 🔧 Tech Stack

- **SvelteKit** - Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Leaflet** - Maps
- **Vitest** - Testing
- **Vite** - Build tool

## 📚 Documentation

- [API Reference](./docs/API_REFERENCE.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 📄 License

MIT - See LICENSE file

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

---

**Version**: 1.0.0
**Status**: Phase 1 Complete
**Updated**: December 18, 2025
