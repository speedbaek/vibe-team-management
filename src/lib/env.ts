import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local with override to handle system env var conflicts
// (e.g., when system has ANTHROPIC_API_KEY="" which blocks Next.js's default loading)
config({ path: resolve(process.cwd(), ".env.local"), override: true });
