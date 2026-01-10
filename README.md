# Consensus

A Next.js + Convex application that compares AI responses and helps users find consensus across multiple AI models.

## Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router for modern, performant web applications
- **React 18+** - UI library for building interactive components
- **TypeScript** - Type-safe development experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **ShadCN/UI** - High-quality, accessible React components (optional)

### Backend & Database
- **Convex** - Backend-as-a-Service platform providing:
  - Real-time database with automatic synchronization
  - Serverless functions for business logic
  - Built-in authentication
  - Automatic scaling and reliability
- **Node.js Runtime** - For server-side logic via Convex functions

### AI Integration
- **Multiple AI Provider APIs** - Integration with various AI models (OpenAI, Anthropic, etc.)
- **LLM Response Aggregation** - Logic to fetch and compare responses from different models

### Development Tools
- **ESLint** - Code linting for code quality
- **Prettier** - Code formatting for consistency
- **npm/yarn** - Package management

## Architecture

### Overview
```
Client (Next.js App Router)
    ↓
Convex Backend
    ↓
AI Provider APIs
```

### Directory Structure
```
project-root/
├── app/                      # Next.js App Router pages and layouts
│   ├── page.tsx             # Home page
│   ├── layout.tsx           # Root layout
│   └── [feature]/           # Feature-specific routes
├── components/              # Reusable React components
│   ├── ui/                  # Shared UI components
│   └── features/            # Feature-specific components
├── convex/                  # Convex backend configuration
│   ├── _generated/          # Auto-generated Convex files
│   ├── functions.ts         # HTTP endpoint handlers
│   ├── mutations.ts         # Data modification functions
│   ├── queries.ts           # Data fetching functions
│   ├── schema.ts            # Database schema definition
│   └── config.ts            # Convex configuration
├── lib/                     # Utility functions and helpers
│   ├── api/                 # API client helpers
│   ├── utils/               # General utilities
│   └── hooks/               # Custom React hooks
├── styles/                  # Global styles
├── public/                  # Static assets
├── .env.local               # Environment variables
├── next.config.js           # Next.js configuration
├── convex.json              # Convex project configuration
└── package.json             # Project dependencies
```

### Key Features

#### 1. **AI Response Comparison**
   - Submit prompts to multiple AI providers simultaneously
   - Fetch and aggregate responses in real-time
   - Display side-by-side comparison interface

#### 2. **Real-time Updates**
   - Convex real-time subscriptions for live response streaming
   - WebSocket connections for instant UI updates
   - Reactive state management with Convex hooks

#### 3. **Data Persistence**
   - Store comparison history in Convex database
   - Track user preferences and settings
   - Maintain conversation context for future references

#### 4. **User Experience**
   - Responsive design with Tailwind CSS
   - Fast page loads with Next.js optimization
   - Smooth interactions with React components

### Data Flow

1. **User Input**: User enters a prompt in the UI
2. **Request**: Next.js client sends request to Convex mutation
3. **Processing**: Convex function:
   - Stores the prompt in database
   - Calls multiple AI provider APIs in parallel
   - Aggregates responses
4. **Response**: Sends aggregated results back to client
5. **Display**: Next.js component renders comparison view with real-time updates

### Authentication & Security
- **Convex Authentication**: Built-in user management and auth
- **Environment Variables**: Secure API keys storage
- **Database Access Control**: Convex provides automatic query validation

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Convex account (free tier available)
- API keys for AI providers (OpenAI, Anthropic, etc.)

### Installation

1. Clone the repository
```bash
git clone https://github.com/lcondliffe/Consensus.git
cd Consensus
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Configure in `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=your_convex_url
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
# Add other AI provider keys as needed
```

4. Set up Convex
```bash
npm run convex dev
```

5. Run the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm run start
```

### Convex Development
- Dashboard: `npm run convex dev`
- Deploy: `npm run convex deploy`

## Deployment

### Vercel (Recommended for Next.js)
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Convex Deployment
- Deploy backend: `npm run convex deploy`
- Convex hosting is included in the free tier

## Project Structure Details

### Convex Functions
- **Queries**: Read-only operations, called directly from components
- **Mutations**: Data modification operations (create, update, delete)
- **Actions**: Long-running tasks, AI API calls with error handling

### Next.js App Router
- Server Components for data fetching
- Client Components for interactivity
- API routes via Convex integration (no additional `/pages/api` needed)

## Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: Open an issue in the repository
- Convex Documentation: https://docs.convex.dev
- Next.js Documentation: https://nextjs.org/docs

---

**Last Updated**: 2026-01-10
