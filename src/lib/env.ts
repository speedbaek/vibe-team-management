// Load .env.local with override for local development only
// On Vercel, env vars are set via the dashboard so this is not needed
async function loadEnv() {
  if (process.env.NODE_ENV === "development") {
    try {
      const dotenv = await import("dotenv");
      const { resolve } = await import("path");
      dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });
    } catch {
      // dotenv not installed (e.g., in production), skip
    }
  }
}
loadEnv();
