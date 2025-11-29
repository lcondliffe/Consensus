# LLM Committee

Compare AI responses from multiple models simultaneously and let a judge model declare a winner.

## Features

- **Multi-Model Comparison**: Send prompts to multiple LLM models in parallel
- **Real-time Streaming**: Watch responses stream in side-by-side
- **AI Judge**: An impartial judge model evaluates all responses and picks a winner
- **Configurable Models**: Choose which models participate and which judges
- **Graceful Error Handling**: Individual model failures don't block other responses

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for local development)
- [Docker](https://www.docker.com/) (for containerized deployment)
- [OpenRouter API Key](https://openrouter.ai/keys)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd llm-committee

# Create environment file
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Start with Docker Compose
docker-compose up -d

# Open http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Start development server
npm run dev

# Open http://localhost:3000
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `APP_URL` | No | Application URL (default: `http://localhost:3000`) |

### Default Models

**Committee (default):**
- Claude Sonnet 4 (Anthropic)
- GPT-4o (OpenAI)
- Gemini 2.0 Flash (Google)

**Judge (default):**
- Claude Sonnet 4 (Anthropic)

You can change these in the settings panel (gear icon).

## Usage

1. **Configure Models** (optional): Click the settings icon to select committee members and judge
2. **Enter Prompt**: Type your question or task in the input area
3. **Submit**: Click "Submit to Committee" or press Enter
4. **Watch Responses**: See all models respond in real-time, side by side
5. **View Verdict**: After all responses complete, the judge evaluates and declares a winner

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Prompt  │  │ Response │  │ Response │  │ Verdict │ │
│  │  Input   │  │ Panel 1  │  │ Panel N  │  │  Panel  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ /api/committee  │         │   /api/judge    │
│ (SSE streaming) │         │  (JSON response)│
└─────────────────┘         └─────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│                    OpenRouter API                        │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│   │ Claude  │  │  GPT-4  │  │ Gemini  │  │  Llama  │   │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
```

## API Routes

### POST `/api/committee`

Streams responses from multiple models in parallel.

**Request:**
```json
{
  "prompt": "Your question here",
  "models": ["anthropic/claude-sonnet-4", "openai/gpt-4o"]
}
```

**Response:** Server-Sent Events stream with chunks:
```json
{"modelId": "anthropic/claude-sonnet-4", "content": "Hello", "done": false}
{"modelId": "openai/gpt-4o", "content": "Hi", "done": false}
{"modelId": "anthropic/claude-sonnet-4", "content": "", "done": true}
```

### POST `/api/judge`

Evaluates responses and returns a verdict.

**Request:**
```json
{
  "prompt": "Original prompt",
  "responses": [
    {"modelId": "...", "modelName": "...", "content": "..."}
  ],
  "judgeModelId": "anthropic/claude-sonnet-4"
}
```

**Response:**
```json
{
  "winnerModelId": "anthropic/claude-sonnet-4",
  "winnerModelName": "Claude Sonnet 4",
  "reasoning": "Claude's response was more comprehensive...",
  "scores": [
    {"modelId": "...", "score": 85, "strengths": [...], "weaknesses": [...]}
  ]
}
```

## License

MIT
