# Pastebin Lite

A lightweight pastebin application that allows users to create and share text pastes with optional time-to-live (TTL) and view count limits.

## Features

- Create text pastes with shareable URLs
- Optional time-based expiry (TTL)
- Optional view count limits
- Automatic cleanup of expired/exhausted pastes
- Safe HTML rendering (no script execution)
- Deterministic time testing support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Persistence**: Vercel KV (Redis)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

## Running Locally

### Prerequisites

- Node.js 18+ installed
- A Vercel account (for KV database)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pastebin-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with your Vercel KV credentials:
   ```env
   KV_URL="your_kv_url"
   KV_REST_API_URL="your_kv_rest_api_url"
   KV_REST_API_TOKEN="your_kv_rest_api_token"
   KV_REST_API_READ_ONLY_TOKEN="your_kv_rest_api_read_only_token"
   ```

   To get these credentials:
   - Go to [vercel.com](https://vercel.com)
   - Create a KV database in your project
   - Copy the environment variables from the database settings

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add the KV database to your project
4. Vercel will automatically set the environment variables
5. Deploy!

## Persistence Layer

**Vercel KV (Redis)** is used as the persistence layer.

- **Why**: Vercel KV provides a serverless-compatible Redis instance that persists data across function invocations
- **Storage**: Pastes are stored as JSON strings with keys in the format `paste:{id}`
- **TTL Support**: Redis native TTL is used for time-based expiry
- **View Counting**: Each paste tracks its view count in the stored data structure

## API Endpoints

### Health Check
- **GET** `/api/healthz` - Returns service health status

### Create Paste
- **POST** `/api/pastes` - Creates a new paste
  - Body: `{ content: string, ttl_seconds?: number, max_views?: number }`
  - Returns: `{ id: string, url: string }`

### Get Paste (API)
- **GET** `/api/pastes/:id` - Retrieves a paste (counts as a view)
  - Returns: `{ content: string, remaining_views: number | null, expires_at: string | null }`
  - Returns 404 if paste is not found, expired, or view limit exceeded

### View Paste (HTML)
- **GET** `/p/:id` - Displays paste content in HTML

## Test Mode

The application supports deterministic time testing via the `TEST_MODE=1` environment variable.

When enabled, the `x-test-now-ms` header can be used to override the current time for expiry calculations:

```bash
curl -H "x-test-now-ms: 1609459200000" https://your-app.vercel.app/api/pastes/:id
```

## Design Decisions

1. **Next.js App Router**: Chosen for its modern approach to server-side rendering and API routes
2. **Vercel KV**: Selected for seamless serverless compatibility and Redis-based TTL support
3. **View Count in Data**: Each fetch increments the view count atomically before checking limits
4. **Safe Delete**: Expired or exhausted pastes are deleted immediately upon access attempt
5. **No Global State**: All state is stored in the database to support serverless environments

## License

MIT