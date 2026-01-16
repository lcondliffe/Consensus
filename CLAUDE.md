# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Consensus is an AI model comparison and evaluation tool. Users submit prompts to multiple LLMs simultaneously via OpenRouter, see streamed responses in real-time, and have responses judged/compared by configurable judge models.

## Development Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build for production
npm run lint         # ESLint check (REQUIRED before commit)
npm run typecheck    # TypeScript check (REQUIRED before commit)
npx convex dev       # Start Convex backend in development
npx convex deploy    # Deploy Convex functions to production
```

**Pre-commit requirement**: Both `npm run lint` and `npm run typecheck` must pass with no errors.

## Architecture

### Data Flow
1. User submits prompt with selected committee models
2. `POST /api/committee` streams responses from OpenRouter in parallel
3. SSE-formatted responses displayed in real-time
4. `POST /api/judge` evaluates all responses and determines winner
5. Convex mutations persist session, responses, and verdict

### Key Files

- `src/app/page.tsx` - Main orchestration hub (~900 lines), manages state, streaming, and UI layout
- `src/app/api/committee/route.ts` - Parallel streaming via TransformStream, aggregates multiple model responses
- `src/app/api/judge/route.ts` - Three judging modes: single judge, committee voting, executive judges
- `src/app/api/models/route.ts` - Fetches available models from OpenRouter
- `convex/schema.ts` - Database schema (sessions table with userId indexes)
- `convex/sessions.ts` - Mutations/queries for session persistence
- `src/lib/types.ts` - Core TypeScript interfaces (CommitteeModel, ModelResponse, Verdict)
- `src/lib/criteria.ts` - Evaluation criteria presets and utilities

### Streaming Pattern
The `/api/committee` route uses Web Streams API with TransformStream to:
- Make concurrent requests to OpenRouter for each selected model
- Parse SSE responses line-by-line with buffering
- Aggregate and forward to client as unified SSE stream
- Individual model failures don't block other responses

### Judging Modes
- **Single Judge**: One model (default: Claude Sonnet 4) evaluates all responses
- **Committee**: All responding models evaluate each other (excluding their own)
- **Executive**: User-selected subset of models act as judges

## Tech Stack

- Next.js 15 (App Router) + React 19
- Convex for real-time database and backend
- Clerk for authentication
- OpenRouter API for multi-provider LLM access
- Tailwind CSS for styling
- TypeScript in strict mode

## Environment Variables

Required in `.env.local`:
```
OPENROUTER_API_KEY
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```
