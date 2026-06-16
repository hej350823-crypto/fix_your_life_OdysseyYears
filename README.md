# Fix Your Life

Fix Your Life is an independent AI web app for personal transformation through guided dialogue and future-self visualization.

It no longer depends on Google AI Studio. The frontend is a Vite + React app, and AI text requests are handled by a server-side API route so the API key is not exposed in the browser bundle.

## Tech Stack

- React 19
- Vite
- TypeScript
- DeepSeek on Volcengine Ark for chat and letters
- Volcengine Ark / Doubao image API for future-self portraits
- Vercel-style serverless API route at `api/gemini.js`

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-v4-flash

ARK_API_KEY=your_volcengine_ark_api_key_here
ARK_TEXT_MODEL=your_ark_deepseek_text_model_here
ARK_TEXT_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_IMAGE_MODEL=your_seedream_or_doubao_image_model_here
ARK_IMAGE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_IMAGE_SIZE=1024x1536

RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL="Fix Your Life <onboarding@resend.dev>"
RESEND_REPLY_TO=hello@example.com
```

Run the frontend:

```bash
npm run dev
```

Local Vite development includes a lightweight `/api/gemini` middleware, so `npm run dev` can test the frontend and DeepSeek text API together.

## Deployment

Deploy this project as a standalone web app. On Vercel:

1. Import this repository.
2. Set the project root to this folder if it lives inside a larger repo.
3. Add the environment variables `DEEPSEEK_API_KEY`, `ARK_IMAGE_MODEL` or `DOUBAO_IMAGE_MODEL`, and `RESEND_API_KEY` if you want real time-capsule email delivery.
4. Deploy.

The production frontend calls `/api/gemini`. That server-side function prefers the direct DeepSeek API for text generation when `DEEPSEEK_API_KEY` is configured. If DeepSeek is not configured, it can fall back to Volcengine Ark for text generation when `ARK_API_KEY` and `ARK_TEXT_MODEL` are present. Portrait images still use the Volcengine Ark / Doubao image API.

## Environment Variables


| Name                 | Required                        | Where Used                                             |
| -------------------- | ------------------------------- | ------------------------------------------------------ |
| `DEEPSEEK_API_KEY`   | Yes for DeepSeek text and letters | Direct DeepSeek chat completions                      |
| `DEEPSEEK_MODEL`     | Optional                        | Defaults to `deepseek-v4-flash` for direct DeepSeek    |
| `ARK_API_KEY`        | Optional for Ark text fallback  | Server-side API route only                             |
| `ARK_TEXT_MODEL`     | Optional for Ark text fallback  | Your Ark DeepSeek model ID                             |
| `ARK_TEXT_BASE_URL`  | Optional                        | Defaults to `https://ark.cn-beijing.volces.com/api/v3` |
| `ARK_IMAGE_MODEL` / `DOUBAO_IMAGE_MODEL` | Yes for real AI portrait images | Your Volcengine Ark / Doubao image model ID            |
| `ARK_IMAGE_BASE_URL` | Optional                        | Defaults to `https://ark.cn-beijing.volces.com/api/v3` |
| `ARK_IMAGE_SIZE`     | Optional                        | Defaults to `2K`                                       |
| `ARK_IMAGE_OUTPUT_FORMAT` | Optional                    | Defaults to `png`                                      |
| `RESEND_API_KEY`     | Optional for real time-capsule email | Schedules the email through Resend                |
| `RESEND_FROM_EMAIL`  | Optional                        | Sender used for scheduled time-capsule email           |
| `RESEND_REPLY_TO`    | Optional                        | Reply-to header for scheduled time-capsule email       |

## Time Capsule Email

The time capsule flow can schedule a real email through Resend without adding any extra database or cron job.

- It uses Resend's `scheduledAt` API field.
- The current UI intentionally limits choices to `3 days`, `7 days`, `14 days`, and `30 days`.
- Resend's official scheduled-send limit is 30 days in advance, so longer delays need a different architecture later.


## Scripts

```bash
npm run dev
npm run build
npm run preview
```
