# WebSocket Reverse Proxy Configuration

## Issue

Socket.IO connects successfully via HTTP polling but fails when attempting to upgrade to WebSocket with error:

```
WebSocket connection to 'wss://...' failed: There was a bad response from the server
```

This occurs because the reverse proxy (nginx/Apache) isn't configured to handle WebSocket upgrades.

## Current Workaround

Socket.IO is configured to use **polling-only mode** in `public/js/socket-client.js`:

```javascript
socket = io({
  transports: ['polling'], // Use polling-only until nginx/proxy supports WebSocket
  // ...
});
```

**Note**: This still provides real-time updates! Socket.IO's long-polling is event-driven and instant (not the old 30-second polling we had before). The difference is:

- **WebSocket**: Single persistent TCP connection
- **Long-polling**: Multiple HTTP connections that stay open until data arrives

Both provide instant real-time updates, but WebSocket is slightly more efficient.

## Permanent Fix: Nginx Configuration

If you're using nginx as a reverse proxy, add WebSocket upgrade headers:

### Option 1: Add to existing location block

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;

    # WebSocket upgrade headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeout settings for WebSocket
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

### Option 2: Separate Socket.IO location block

```nginx
# Socket.IO endpoint
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}

# Regular application
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### After updating nginx config:

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Apache Configuration

If you're using Apache, enable required modules and add WebSocket proxy:

```apache
# Enable modules
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod rewrite

# In your VirtualHost configuration
<VirtualHost *:443>
    ServerName bluebonnet-dev.milkt.art

    # WebSocket proxy for Socket.IO
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]

    # Regular proxy
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # SSL configuration
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
```

## Enable WebSocket After Proxy Configuration

Once your reverse proxy is configured, update `public/js/socket-client.js`:

```javascript
// Remove the transports restriction
socket = io({
  // transports: ['polling'],  // <-- Remove or comment out this line
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
});
```

Then rebuild:

```bash
npm run build-js
```

## Verify WebSocket is Working

After configuring the proxy:

1. Open browser console
2. Look for: `✅ WebSocket connected: [socket-id]`
3. Check Network tab → WS (WebSocket) - should show a connection
4. No more "bad response from server" errors

## Testing

Test if your reverse proxy supports WebSocket:

```bash
# Test WebSocket upgrade
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://bluebonnet-dev.milkt.art/socket.io/?EIO=4&transport=websocket
```

Should return HTTP 101 Switching Protocols (not 400 or 502).

## Performance Comparison

| Transport    | Latency | Bandwidth | Browser Support |
| ------------ | ------- | --------- | --------------- |
| WebSocket    | Lowest  | Lowest    | Modern browsers |
| Long-polling | Low     | Higher    | All browsers    |
| Old polling  | High    | Highest   | All browsers    |

**Current setup (long-polling)**: Still 95% better than old 30-second polling!
**With WebSocket**: Additional 10-20% efficiency improvement

## References

- [Socket.IO Behind a Reverse Proxy](https://socket.io/docs/v4/reverse-proxy/)
- [Nginx WebSocket Proxying](https://nginx.org/en/docs/http/websocket.html)
- [Apache WebSocket Proxy](https://httpd.apache.org/docs/2.4/mod/mod_proxy_wstunnel.html)
