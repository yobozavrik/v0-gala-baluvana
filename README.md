# Gala Baluvana

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/dmitriytovstitsky-gmailcoms-projects/v0-gala-baluvana)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/92toykOAfti)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

The app will be available at the URL printed in the terminal (Next.js default is `http://localhost:3000`).

## Deployment

Your project is live at:

**[https://vercel.com/dmitriytovstitsky-gmailcoms-projects/v0-gala-baluvana](https://vercel.com/dmitriytovstitsky-gmailcoms-projects/v0-gala-baluvana)**

## Configuration

Set the following environment variables to connect the UI with your n8n workflows:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_VITE_N8N_SHIFT` | Endpoint that handles starting and ending shifts. |
| `NEXT_PUBLIC_VITE_N8N_OPS` | Endpoint for operations/production updates submitted from the operations section. |
| `NEXT_PUBLIC_VITE_N8N_QC` | Endpoint for sending quality control checks. |
| `NEXT_PUBLIC_VITE_N8N_WH` | Endpoint that records warehouse movements. |

You can set them in a local `.env.local` file or through your deployment platform's environment settings.

## Demo Mode

If none of the endpoints above are configured, the interface runs in a demo mode:

- Actions are stored locally in the browser (via `localStorage`) instead of being sent to an API.
- Shift and production records are still displayed so you can explore the workflow without a backend.
- Toast notifications remind you to configure the API endpoints when you are ready to connect to n8n.

Add the environment variables at any time to switch from demo mode to the fully connected experience.

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/92toykOAfti](https://v0.app/chat/projects/92toykOAfti)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
