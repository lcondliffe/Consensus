# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Consensus is an AI model comparison and evaluation tool. Users submit prompts to multiple LLMs simultaneously via OpenRouter, see streamed responses in real-time, and have responses judged/compared by configurable judge models. The application supports session history, persistent user preferences, and AI-powered custom evaluation criteria.

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
1. User loads app, preferences and session history loaded from Convex
2. User submits prompt with selected committee models
3. `POST /api/committee` streams responses from OpenRouter in parallel
4. SSE-formatted responses displayed in real-time
5. `POST /api/judge` evaluates all responses (4 modes available)
6. Convex mutations persist session, responses, and verdict
7. User can reload past sessions, modify settings, re-evaluate

### Key Files

#### Core Application Files
- `src/app/page.tsx` - Main orchestration hub (928 lines), manages state, streaming, UI layout, session persistence
- `src/app/layout.tsx` - Root layout with Clerk/Convex providers, auth middleware
- `src/app/ConvexClientProvider.tsx` - Convex provider wrapper component
- `src/middleware.ts` - Clerk authentication middleware

#### API Routes
- `src/app/api/committee/route.ts` - Parallel streaming via TransformStream, aggregates multiple model responses
- `src/app/api/judge/route.ts` - Four judging modes: single judge, committee voting, executive judges, consensus synthesis
- `src/app/api/models/route.ts` - Fetches available models from OpenRouter (5-minute cache)
- `src/app/api/generate-criteria/route.ts` - AI-powered custom evaluation criteria generator

#### Database & Backend (Convex)
- `convex/schema.ts` - Database schema (sessions, userPreferences tables with indexes)
- `convex/sessions.ts` - Session CRUD mutations/queries, ownership verification
- `convex/userPreferences.ts` - User settings persistence (upsert pattern)
- `convex/auth.config.ts` - Clerk authentication configuration

#### Core Libraries
- `src/lib/types.ts` - Core TypeScript interfaces (CommitteeModel, ModelResponse, Verdict, Consensus)
- `src/lib/criteria.ts` - 7 built-in evaluation criteria presets + utilities
- `src/lib/models.ts` - Available models list, defaults, provider groupings
- `src/lib/version.ts` - App version from environment (GitVersion integration)

#### UI Components (11 total)
- `src/components/ResponsePanel.tsx` - Individual model response card with latency, error states
- `src/components/VerdictPanel.tsx` - Verdict display with scorecard, vote breakdown, consensus synthesis
- `src/components/CriteriaSelector.tsx` - Built-in presets + custom criteria editor + AI generation UI
- `src/components/JudgingModeSelector.tsx` - Four judging mode selector (judge/committee/executive/consensus)
- `src/components/CommitteeDisplay.tsx` - Model tiles with role badges (committee/judge/executive/synthesizer)
- `src/components/ModelPicker.tsx` - Multi/single select with search, provider filtering
- `src/components/ModelSelector.tsx` - Committee model selection wrapper
- `src/components/PromptInput.tsx` - Prompt textarea input with validation
- `src/components/MarkdownRenderer.tsx` - Markdown rendering with syntax highlighting (Prism)
- `src/components/ProviderLogo.tsx` - SVG logos + brand colors for 7+ providers
- `src/components/SessionHistory.tsx` - Past sessions list with reload functionality

### Streaming Pattern
The `/api/committee` route uses Web Streams API with TransformStream to:
- Make concurrent requests to OpenRouter for each selected model
- Parse SSE responses line-by-line with buffering for incomplete chunks
- Aggregate and forward to client as unified SSE stream
- Handle individual model failures gracefully (errors don't block other responses)
- Track response latency per model

**SSE Message Format**:
```typescript
data: {modelId: string, content: string, done: boolean, error?: string}
```

### Judging Modes

The application supports four distinct judging modes:

1. **Single Judge Mode**: One model (default: Claude Sonnet 4) evaluates all responses
   - Returns: Winner ID, reasoning, per-model scores with strengths/weaknesses

2. **Committee Mode**: All responding models evaluate each other (excluding their own)
   - Each model scores others based on criteria
   - Returns: Winner by majority vote, vote breakdown, aggregated scores

3. **Executive Mode**: User-selected subset of models act as judges
   - Allows selecting arbitrary judges independent of committee
   - Returns: Winner by executive vote, vote breakdown, aggregated scores

4. **Consensus Mode**: Synthesizes responses into unified answer
   - No winner declared, instead creates hybrid response
   - Tracks model attributions and key points with sources
   - Returns: Synthesized text, contribution breakdown, attributed key points

### Database Schema (Convex)

#### sessions table
- `userId` (indexed) - Session owner
- `prompt` - User input
- `responses[]` - Array of {modelId, modelName, content, error, latencyMs}
- `verdict` - {winnerModelId, winnerModelName, reasoning, scores, votes?, consensusResult?}
- `committeeModelIds[]` - Selected committee models
- `judgeModelId` - Single judge (if mode = "judge")
- `judgingMode` - "judge" | "committee" | "executive" | "consensus"
- `executiveJudgeIds[]` - Executive judges (if mode = "executive")
- `judgingCriteria` - Selected criteria for evaluation
- `isComplete` - Session completion flag
- `createdAt`, `updatedAt` - Timestamps
- **Indexes**: by_user, by_user_created

#### userPreferences table
- `userId` (indexed) - Preference owner
- `committeeModelIds[]` - Default committee models
- `judgeModelId` - Default judge model
- `judgingMode` - Default judging mode
- `executiveJudgeIds[]` - Default executive judges
- `criteriaId` - Default criteria preset ID
- `customCriteria` - Custom evaluation criteria object
- `createdAt`, `updatedAt` - Timestamps

### Component Architecture

#### State Management (in page.tsx)
- **User Input**: `prompt` (string)
- **Responses**: `Map<modelId, ModelResponse>` - Streaming response state
- **Verdict**: `Verdict | null` - Evaluation result
- **UI State**: `showSettings`, `showHistory`, `viewMode` (grid/stacked), `maximizedModelId`
- **Config State**: `selectedCommittee`, `judgeModelId`, `judgingMode`, `executiveJudgeIds`, `judgingCriteria`
- **Refs**: `responsesRef` (streaming updates), `abortControllerRef` (cancellation)

#### Component Hierarchy
```
App (page.tsx)
├── Header (SessionHistory toggle, Settings toggle, UserButton)
├── SessionHistory (sidebar, conditional)
├── Settings Panel (conditional)
│   ├── ModelSelector (committee)
│   ├── JudgingModeSelector
│   │   └── ModelPicker (executive judges, conditional)
│   ├── CriteriaSelector
│   │   ├── Preset dropdown
│   │   └── AI criteria generator (modal)
│   └── Save Preferences button
└── Main Content Area
    ├── PromptInput
    ├── CommitteeDisplay (model tiles with roles)
    ├── ResponsePanel[] (grid or stacked layout)
    │   ├── Model header with provider logo
    │   ├── MarkdownRenderer (response content)
    │   ├── Latency indicator
    │   └── Error state (if failed)
    ├── VerdictPanel
    │   ├── Winner announcement (judge/committee/executive)
    │   ├── Scorecard (per-model scores with strengths/weaknesses)
    │   ├── Vote breakdown (committee/executive modes)
    │   └── Consensus synthesis (consensus mode)
    └── Footer (loading state, reset button)
```

### Custom Criteria Generation

The `/api/generate-criteria` route uses AI to generate structured evaluation criteria:
- **Input**: Natural language description (max 1000 chars), generator model ID
- **Process**: Prompts LLM to create JSON with name, description, 3-7 criteria items
- **Validation**: Ensures valid JSON structure, criteria array length
- **Output**: Ready-to-use custom criteria object

Example flow:
1. User describes desired criteria: "Focus on creativity and originality"
2. AI generates structured criteria with name, description, weighted items
3. User saves to preferences or uses for current session

### Session History

- All sessions saved to Convex (if authenticated)
- SessionHistory component displays past sessions with:
  - Prompt preview (truncated)
  - Committee model names
  - Judging mode badge
  - Created timestamp
- Click to reload: Restores prompt, responses, verdict, settings
- Sessions ordered by creation date (newest first)

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5.x (strict mode)
- **Database**: Convex (real-time serverless database)
- **Authentication**: Clerk (OAuth + sessions)
- **LLM Provider**: OpenRouter API (multi-provider aggregator)
- **Styling**: Tailwind CSS 3.4 with custom CSS variables
- **Icons**: Lucide React
- **Markdown**: react-markdown + react-syntax-highlighter
- **Code Quality**: ESLint (flat config), TypeScript compiler
- **Container**: Docker (multi-stage, Alpine-based)
- **CI/CD**: GitHub Actions + GitVersion (semantic versioning)
- **Node**: 18+ (development), 20 (production Docker)

### Design System

**Custom CSS Variables** (in `globals.css`):
- `--background` - Main background color (RGB)
- `--surface-1`, `--surface-2`, `--surface-3` - Layered surfaces
- `--foreground`, `--foreground-muted` - Text colors
- `--border`, `--border-hover` - Border colors
- `--accent`, `--accent-hover`, `--accent-glow` - Primary accent colors

**Design Patterns**:
- Glassmorphism: `backdrop-blur-sm` + `bg-*/40` opacity
- Ring effects: `ring-1 ring-white/5` for subtle borders
- Win state: Green glow `ring-green-500/50`
- Error state: Red tint `bg-red-900/5`
- Animations: `pulse-slow` (3s cycle) for loading states

## Environment Variables

Required in `.env.local`:
```bash
OPENROUTER_API_KEY                      # OpenRouter API authentication
NEXT_PUBLIC_CONVEX_URL                  # Convex backend URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY       # Clerk public key
CLERK_SECRET_KEY                        # Clerk secret key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in  # Sign-in page route
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up  # Sign-up page route
APP_URL=http://localhost:3000           # Optional, app base URL
```

## Build & Deployment

### Docker Build
Multi-stage Dockerfile for production:
- **Builder stage**: npm ci, Next.js build (standalone output)
- **Runner stage**: Node 20-Alpine, non-root user (nextjs), port 3001
- **Build args**: NEXT_PUBLIC_* env vars injected at build time
- **Security**: Minimal Alpine image, non-root user, no unnecessary packages

### CI/CD Pipeline
`.github/workflows/ci.yml`:
1. **Version**: GitVersion calculates semantic version from git tags
2. **Lint & Type Check**: npm run lint && npm run typecheck
3. **Build**: Next.js production build
4. **Docker Build**: Multi-stage build, push to GitHub Container Registry

### Deployment Checklist
- [ ] All environment variables configured
- [ ] Convex functions deployed (`npx convex deploy`)
- [ ] Clerk production instance configured
- [ ] OpenRouter API key with sufficient credits
- [ ] Docker image built and pushed
- [ ] Container deployed with correct env vars

## Development Guidelines

### Code Style
- **Functional components** with React hooks (useState, useEffect, useCallback, useMemo)
- **useCallback** for event handlers (proper dependency arrays)
- **useQuery/useMutation** for Convex operations
- **Error boundaries** for graceful API failure handling
- **Maps for state** (faster lookups, better immutability patterns)
- **TypeScript strict mode** (no implicit any, null checks)

### Common Patterns

#### Streaming Response Handling
```typescript
const responsesRef = useRef(responses);
responsesRef.current = responses; // Keep ref updated for streaming

const reader = response.body.getReader();
while (true) {
  const {done, value} = await reader.read();
  // Update via ref to avoid stale closures
  setResponses(new Map(responsesRef.current));
}
```

#### Convex Mutations with Auth
```typescript
export const createSession = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.db.insert("sessions", {
      userId: identity.subject,
      ...args
    });
  }
});
```

#### Error Handling
```typescript
// Individual model errors don't block other responses
responses.set(modelId, {
  modelId,
  modelName,
  content: "",
  error: error.message,
  latencyMs: Date.now() - startTime
});
```

### Testing Checklist
Before committing:
- [ ] `npm run lint` passes with no errors
- [ ] `npm run typecheck` passes with no errors
- [ ] Test basic flow: prompt → streaming → verdict
- [ ] Test all 4 judging modes
- [ ] Test session save/load (if authenticated)
- [ ] Test custom criteria generation
- [ ] Check error states (network failure, model failure)
- [ ] Verify responsive layout (mobile, tablet, desktop)

## Known Patterns & Conventions

1. **Optimistic Updates**: UI updates immediately, Convex persists in background
2. **Graceful Degradation**: One model failure doesn't break entire evaluation
3. **Ref Pattern**: Use refs for values accessed in closures (streaming callbacks)
4. **Immutable Updates**: Always create new Map/Array instead of mutating
5. **Auth Checks**: All Convex mutations verify user identity
6. **Session Ownership**: Users can only access their own sessions
7. **Model Caching**: OpenRouter models cached 5 minutes to reduce API calls
8. **Proper Cleanup**: AbortController cancels in-flight requests on unmount
9. **TypeScript Strictness**: Explicit return types, no any, null checks
10. **Component Composition**: Small, focused components with clear props

## Troubleshooting

### Common Issues

**Streaming doesn't work**:
- Check OPENROUTER_API_KEY is valid
- Verify models are available on OpenRouter
- Check browser console for network errors

**Verdict fails**:
- Ensure at least 2 models completed successfully
- Check judge model is available
- Verify judging criteria is properly formatted

**Session not saving**:
- Check user is authenticated (Clerk)
- Verify CONVEX_URL is correct
- Check Convex dashboard for errors

**Build fails**:
- Run `npm run typecheck` to see TypeScript errors
- Run `npm run lint` to see ESLint errors
- Check all environment variables are set

### Debug Mode
Add to `.env.local` for verbose logging:
```bash
NEXT_PUBLIC_DEBUG=true
```

## Additional Resources

- **README.md** - Public documentation, setup instructions
- **AGENTS.md** - AI agent-specific guidance
- **spec.md** - Feature specifications and requirements
- **docs/screenshots/** - Product screenshots for reference
