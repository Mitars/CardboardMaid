<h1 align="center">Cardboard Maid</h1>


<p align="center">
  <a href="https://cardboardmaid.com">
    <img src="public/logo.png" alt="Cardboard Maid Logo" width="300" height="300">
  </a>
  <br />
<a href="https://cardboardmaid.com" style="display: block" target="_blank" rel="noopener noreferrer">cardboardmaid.com</a>

</p>

<p align="center">
  A board game collection manager powered by BoardGameGeek (BGG)
</p>

## Features

- Browse and search your BoardGameGeek board game collection
- View detailed game information including descriptions, ratings, and player counts
- Filter and sort your collection
- Dark mode support

## Tech Stack

- Vite
- TypeScript
- React
- Tailwind CSS
- shadcn/ui

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone https://github.com/Mitars/CardboardMaid.git

# Navigate to the project directory
cd CardboardMaid

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Build for Production

**Note**: This app requires a backend proxy to function in production. The BoardGameGeek API has CORS restrictions, so API calls must go through a proxy server.

```sh
npm run build
```

#### Deployment Options

1. **Vercel (Recommended)**: The app includes a Vercel Edge Function at `/api/bgg` that proxies requests to BoardGameGeek. Simply deploy to Vercel and the Edge Function will be automatically included.

2. **Other Hosting**: You'll need to set up your own proxy server to handle `/api/bgg` requests and forward them to `https://boardgamegeek.com/xmlapi2` with proper authentication headers.

3. **Development Only**: Use `npm run dev` - the Vite development server includes a built-in proxy that handles API calls without requiring a separate backend.

## Environment Variables

Create a `.env` file in the root directory (see `.env.example` for reference).

## Acknowledgments

This project is based on [CardboardButler](https://github.com/PhilipK/CardboardButler) by PhilipK. The original project is no longer maintained. This version has been updated to support the new BGG API authentication.

## License

MIT
