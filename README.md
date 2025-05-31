# 🪝 CF-Webhook

A modern webhook management platform built on Cloudflare Workers and Next.js, providing real-time webhook receiving, monitoring, and management capabilities.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yingca1/cf-webhook)

## 🚀 One-Click Deployment

Click the **"Deploy to Cloudflare Workers"** button above for instant deployment! 

### What happens when you click deploy:

1. **Fork Repository** - Cloudflare will automatically fork this repository to your GitHub account
2. **Connect GitHub** - Link your GitHub account with Cloudflare Workers if not already connected
3. **Configure Settings** - Set up environment variables and deployment settings
4. **Auto Deploy** - The platform automatically builds and deploys your webhook service
5. **Get Your URL** - Receive your live webhook endpoint URL immediately

### Prerequisites for One-Click Deploy:

- ✅ **Cloudflare Account** (free tier works perfectly)
- ✅ **GitHub Account** for repository access
- ✅ **2 minutes** of your time!

### After Deployment:

Your webhook service will be live at: `https://your-app-name.your-subdomain.workers.dev`

No complex setup, no local environment required - just click and go! 🎉

## ✨ Key Features

- **🚀 Real-time Webhook Reception** - Supports all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **📊 Real-time Request Monitoring** - Polling-based real-time request display and monitoring
- **🔍 Smart Search & Filtering** - Multi-dimensional filtering: method type, content type, IP address, etc.
- **📱 Responsive Design** - Perfect adaptation for desktop and mobile devices
- **🔔 Real-time Notifications** - Browser notifications, sound alerts, Toast messages
- **💾 Local Storage** - Data persistence based on localStorage
- **⚡ High Performance** - Global distributed deployment based on Cloudflare Workers

## 🛠️ Manual Setup (Optional)

> 💡 **Recommended**: Use the one-click deployment above for the easiest setup!

For developers who want local development or custom modifications:

### Prerequisites

- Node.js 18+
- pnpm 8+
- Cloudflare Account
- Wrangler CLI

### Local Development

```bash
# Clone the repository (or your fork)
git clone https://github.com/yingca1/cf-webhook.git
cd cf-webhook

# Install dependencies
pnpm install

# Login to Cloudflare
wrangler login

# Start local development
pnpm run dev
```

### Manual Deployment

```bash
# Deploy to production
pnpm run deploy

# Deploy to preview environment
pnpm run deploy:preview
```

## 📖 Usage Guide

### Creating a Webhook

Visit the application homepage, and the system will automatically create a new webhook and redirect to the monitoring page. Each webhook has a unique URL format:

```
https://your-domain.workers.dev/w/{webhookId}
```

### Monitoring Requests

- Enter the webhook monitoring page to view real-time requests
- Supports auto-polling (default 5-second interval)
- Click any request to view detailed information
- Use search and filter functions to quickly locate specific requests

### Data Management

- All data is stored locally in the browser (localStorage)
- Export data in JSON format
- Import data from JSON files
- Set automatic data cleanup policies

## 🔧 Configuration Options

### Environment Variables

Configure in `wrangler.jsonc`:

```json
{
  "vars": {
    "POLL_INTERVAL": "5000",
    "MAX_REQUESTS_PER_WEBHOOK": "100",
    "REQUEST_RETENTION_HOURS": "24",
    "RATE_LIMIT_ENABLED": "true",
    "RATE_LIMIT_REQUESTS": "60",
    "RATE_LIMIT_WINDOW": "60000",
    "ENABLE_NOTIFICATIONS": "true"
  }
}
```

### Polling Configuration

- **Default Interval**: 5000ms (5 seconds)
- **Adjustable Range**: 1-60 seconds
- **Pause/Resume Support**: Manual polling state control
- **Countdown Display**: Real-time display of next polling time

## 📡 API Endpoints

### Webhook Reception

```
ALL /{baseUrl}/w/{webhookId}
```

Supports all HTTP methods and automatically records request information.

### Polling Interface

```
GET /api/poll/{webhookId}
```

Gets the latest request data for the specified webhook.

## 🛠️ Project Structure

```
cf-webhook/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── poll/       # Polling endpoints
│   │   │   └── webhook/    # Webhook endpoints
│   │   ├── w/[id]/         # Webhook monitoring pages
│   │   └── components/     # Shared components
│   ├── hooks/              # React Hooks
│   │   └── usePolling.ts   # Polling logic
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── wrangler.jsonc          # Cloudflare Workers configuration
└── package.json
```

## 🔥 Core Features

### usePolling Hook

Efficient polling management hook with support for:

- Automatic polling and manual refresh
- Configurable polling intervals
- Pause/resume functionality
- Error handling and retry logic
- Local storage integration
- Real-time countdown

### Storage Strategy

- **Primary Storage**: localStorage (client-side persistence)
- **Data Sync**: Server-side temporary storage + client-side merging
- **Performance Optimization**: Incremental updates and deduplication

## 🚀 Why One-Click Deployment?

The **Deploy to Cloudflare Workers** button is the fastest way to get started:

- ⚡ **Instant Setup** - No local environment needed
- 🔄 **Auto Updates** - Connected to this repository for easy updates
- 🌍 **Global CDN** - Deployed to Cloudflare's edge network automatically
- 💰 **Free Tier** - Works perfectly on Cloudflare's generous free plan
- 🔒 **Secure** - HTTPS and DDoS protection included by default

### When to Use Manual Setup:

- 🛠️ **Custom Development** - When you want to modify the code
- 🔧 **Local Testing** - For testing changes before deployment
- 🎛️ **Advanced Configuration** - Custom environment variables or settings

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!
