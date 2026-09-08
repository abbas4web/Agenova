# Agentora

> **One Platform. Many AI Agents.**

Agentora is a multi-agent AI platform where users can access specialised AI agents from a single web application. An AI Orchestrator automatically routes requests to the right agent — or users can pick one directly from the sidebar.

---

## Agents

| Agent | Focus |
|---|---|
| ✨ Ask Anything | General-purpose assistant — the default and fallback |
| 🛍️ Shopping | Product discovery, comparisons, buying advice |
| ✨ Skin Care | Routines, ingredient analysis, product recommendations |
| 💪 Fitness | Workout plans, exercise guidance, nutrition |
| ✈️ Travel | Itineraries, destination info, travel tips |
| 💻 Technology | Tech products, troubleshooting, concepts |
| 🚗 Automobile | Car buying, comparisons, maintenance |
| 💼 Career | Resumes, interviews, job search, salary |
| 🎓 Education | Tutoring, learning roadmaps, course recommendations |
| 🍽️ Food | Recipes, meal planning, nutrition |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router v6 |
| State | Zustand |
| HTTP Client | Axios |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| AI (primary) | Google Gemini (`gemini-1.5-flash`) |
| AI (fallback) | Groq (`llama-3.1-70b-versatile`) |
| Auth | JWT (jsonwebtoken + bcryptjs) |

---

## Project Structure

```
agentora/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── chat/        # ChatWindow, MessageBubble, InputBar, AgentCard
│       │   ├── common/      # Button, Spinner, Avatar
│       │   └── layout/      # AppShell, Sidebar, TopBar
│       ├── pages/           # Home, AgentChat, Settings, AuthPage, NotFound
│       ├── services/        # Axios API layer
│       ├── store/           # Zustand stores (auth, agents, chat)
│       ├── types/           # Shared TypeScript interfaces
│       └── utils/           # cn, agentColors, uuid
│
└── server/          # Node.js + Express backend
    └── src/
        ├── agents/          # 10 agent config files (self-registering)
        ├── config/          # env, db, logger
        ├── controllers/     # Auth, Chat, Agents, Conversations, Users
        ├── core/            # AgentRegistry, ToolRegistry, AgentRunner, Orchestrator
        │   └── AIProvider/  # Interface, GeminiProvider, GroqProvider, Factory
        ├── db/              # Migrations + migrate runner
        ├── middleware/       # auth, errorHandler, validate
        ├── routes/          # REST routes
        ├── services/        # AuthService, UserService, ConversationService
        ├── tools/           # 9 tool implementations (self-registering)
        └── types/           # Shared server types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Gemini API key ([get one here](https://aistudio.google.com/)) or a Groq API key

### 1. Clone & install

```bash
git clone https://github.com/your-username/agentora.git
cd agentora

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/agentora
JWT_SECRET=a-long-random-secret-string-here
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set up the database

Create the database first:

```sql
CREATE DATABASE agentora;
```

Then run migrations:

```bash
cd server
npm run migrate
```

### 4. Start the servers

**Backend** (terminal 1):
```bash
cd server
npm run dev
# Runs on http://localhost:3001
```

**Frontend** (terminal 2):
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173), create an account, and start chatting.

---

## Adding a New Agent

1. Create `server/src/agents/myAgent.agent.ts`:

```typescript
import type { AgentConfig } from '../types';
import { AgentRegistry } from '../core/AgentRegistry';

const config: AgentConfig = {
  id: 'myAgent',
  name: 'My Agent',
  description: 'What this agent does — used by the Orchestrator for routing.',
  icon: '🔧',
  color: 'blue',
  systemPrompt: `You are Agentora's My Agent. Your expertise is...`,
  allowedTools: ['webSearch'],
  maxTurns: 5,
};

AgentRegistry.register(config);
export default config;
```

2. Add one import line to `server/src/agents/index.ts`:

```typescript
import './myAgent.agent';
```

That's it. The agent appears in the UI automatically on next restart.

---

## Adding a New Tool

1. Create `server/src/tools/myTool.tool.ts`:

```typescript
import type { ToolImplementation } from '../types';
import { ToolRegistry } from '../core/ToolRegistry';

const myTool: ToolImplementation = {
  definition: {
    name: 'myTool',
    description: 'What this tool does.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Input for the tool' },
      },
      required: ['query'],
    },
  },
  async execute(args) {
    // Call an external API here
    return `Result for: ${args.query}`;
  },
};

ToolRegistry.register(myTool);
export default myTool;
```

2. Add one import to `server/src/tools/index.ts`.
3. Add the tool name to the relevant agent's `allowedTools` array.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/auth/me` | ✓ | Get current user |
| POST | `/api/chat` | ✓ | Send a message |
| GET | `/api/agents` | ✓ | List all agents |
| GET | `/api/agents/:id` | ✓ | Get agent by ID |
| GET | `/api/conversations` | ✓ | List conversations |
| GET | `/api/conversations/:id/messages` | ✓ | Get messages |
| PATCH | `/api/conversations/:id` | ✓ | Update title |
| DELETE | `/api/conversations/:id` | ✓ | Delete conversation |
| PATCH | `/api/users/me/preferences` | ✓ | Update preferences |
| PATCH | `/api/users/me/display-name` | ✓ | Update display name |
| PATCH | `/api/users/me/password` | ✓ | Change password |

---

## Switching AI Provider

Change `AI_PROVIDER` in `server/.env`:

```env
# Use Gemini (default)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Or use Groq
AI_PROVIDER=groq
GROQ_API_KEY=your_key
```

No code changes needed.

---

## License

MIT
