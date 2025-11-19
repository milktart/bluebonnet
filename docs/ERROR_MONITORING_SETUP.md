# Error Monitoring Setup Guide

This guide covers setting up error monitoring for production environments using Sentry or alternative services.

## Option 1: Sentry (Recommended)

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project for Node.js/Express
3. Copy your DSN (Data Source Name)

### 2. Install Sentry SDK

```bash
npm install @sentry/node @sentry/profiling-node
```

### 3. Add Sentry DSN to Environment Variables

Add to your `.env` file:

```bash
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # Sample 10% of transactions
```

### 4. Initialize Sentry in server.js

Add this code **at the very top** of `server.js` (before any other imports):

```javascript
// Initialize Sentry first (before any other code)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  const { ProfilingIntegration } = require('@sentry/profiling-node');

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    profilesSampleRate: 0.1,
    integrations: [
      new ProfilingIntegration(),
    ],
  });

  // Export for use in error handlers
  module.exports.Sentry = Sentry;
}
```

### 5. Add Sentry Error Handler

Add Sentry error handlers **after all routes but before your custom error handler**:

```javascript
// After all routes
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Your routes here...

// Before custom error handler
app.use(Sentry.Handlers.errorHandler());

// Your custom error handler
app.use(errorHandler);
```

### 6. Test the Integration

```javascript
// Add a test route (remove after testing)
app.get('/debug/sentry', (req, res) => {
  throw new Error('Test Sentry error tracking');
});
```

Visit `/debug/sentry` and check your Sentry dashboard for the error.

## Option 2: New Relic

### 1. Create New Relic Account

1. Go to [newrelic.com](https://newrelic.com) and sign up
2. Add a new Node.js application
3. Copy your license key

### 2. Install New Relic Agent

```bash
npm install newrelic
```

### 3. Configure New Relic

Create `newrelic.js` in project root:

```javascript
'use strict';

exports.config = {
  app_name: ['Travel Planner'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
};
```

### 4. Initialize New Relic

Add to the **very first line** of `server.js`:

```javascript
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}
```

### 5. Add to Environment Variables

```bash
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=Travel Planner
NEW_RELIC_LOG_LEVEL=info
```

## Option 3: Self-Hosted Alternatives

### Sentry Self-Hosted

Follow the [Sentry self-hosted documentation](https://develop.sentry.dev/self-hosted/) to run your own Sentry instance.

### Grafana Loki + Promtail

Use Grafana Loki for log aggregation and error tracking:

```yaml
# docker-compose.monitoring.yml
version: '3'

services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      - loki-data:/loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  loki-data:
  grafana-data:
```

## CI/CD Integration

### GitHub Actions

The CI workflow already includes error monitoring placeholders. Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - `SENTRY_DSN` (if using Sentry)
   - `SENTRY_AUTH_TOKEN` (for release tracking)
   - `NEW_RELIC_LICENSE_KEY` (if using New Relic)

### Sentry Release Tracking

Add to your deployment workflow:

```yaml
- name: Create Sentry release
  uses: getsentry/action-release@v1
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: your-org
    SENTRY_PROJECT: your-project
  with:
    environment: production
```

## Best Practices

1. **Filter Sensitive Data**: Never send passwords, tokens, or PII to error monitoring
2. **Set Sample Rates**: Don't track 100% of transactions in production (too expensive)
3. **Tag Errors**: Add user IDs, request IDs for better debugging
4. **Set Up Alerts**: Configure alerts for critical errors
5. **Monitor Performance**: Use transaction tracing to find slow endpoints
6. **Review Regularly**: Check error dashboard weekly

## Custom Error Context

Add custom context to errors:

```javascript
// In your error handler
if (process.env.SENTRY_DSN && req.user) {
  Sentry.setUser({
    id: req.user.id,
    email: req.user.email,
  });

  Sentry.setTag('path', req.path);
  Sentry.setTag('method', req.method);
}
```

## Testing

Test error monitoring in staging before production:

```bash
# Set staging environment
SENTRY_ENVIRONMENT=staging npm start

# Trigger test error
curl http://localhost:3000/debug/sentry
```

Check your Sentry/New Relic dashboard to verify the error was captured.
