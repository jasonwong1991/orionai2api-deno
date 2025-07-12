/**
 * Application configuration management
 */

export interface AppConfig {
  // Basic configuration
  appName: string;
  debug: boolean;
  host: string;
  port: number;

  // Target API configuration
  targetApiUrl: string;
  conversationApiUrl: string;
  projectApiUrl: string;
  messageApiUrl: string;
  
  // OrionAI management token and project settings
  orionToken: string;
  autoCleanConversations: boolean;

  // API Key configuration
  apiKeys: string[];
  requireApiKey: boolean;

  // Token pool configuration
  tokenPool: string[];

  // Model configuration
  availableModels: string[];

  // Request configuration
  timeout: number;
  maxRetries: number;
  retryDelay: number;

  // Default headers
  defaultHeaders: Record<string, string>;
}

function parseJsonEnv(envVar: string, defaultValue: string[] = []): string[] {
  const value = Deno.env.get(envVar);
  if (!value) return defaultValue;
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse ${envVar} as JSON:`, error.message);
    console.warn(`Raw value was:`, value);
    return defaultValue;
  }
}

function createConfig(): AppConfig {
  return {
    // Basic configuration
    appName: Deno.env.get("APP_NAME") || "LLM Proxy API (Deno)",
    debug: Deno.env.get("DEBUG")?.toLowerCase() === "true",
    host: Deno.env.get("HOST") || "0.0.0.0",
    port: parseInt(Deno.env.get("PORT") || "3333"),

    // Target API configuration
    targetApiUrl: Deno.env.get("TARGET_API_URL") || "https://api.orionai.asia/chat",
    conversationApiUrl: Deno.env.get("CONVERSATION_API_URL") || "https://api.orionai.asia/conversation",
    projectApiUrl: Deno.env.get("PROJECT_API_URL") || "https://api.orionai.asia/project",
    messageApiUrl: Deno.env.get("MESSAGE_API_URL") || "https://api.orionai.asia/conversation",

    // OrionAI management token and project settings
    orionToken: Deno.env.get("ORION_TOKEN") || "",
    autoCleanConversations: Deno.env.get("AUTO_CLEAN_CONVERSATIONS")?.toLowerCase() !== "false",

    // API Key configuration
    apiKeys: parseJsonEnv("API_KEYS"),
    requireApiKey: Deno.env.get("REQUIRE_API_KEY")?.toLowerCase() !== "false",

    // Token pool configuration
    tokenPool: parseJsonEnv("TOKEN_POOL"),

    // Model configuration
    availableModels: parseJsonEnv("AVAILABLE_MODELS", [
      "ChatGPT 4.1 Mini-Default",
      "ChatGPT 4.1-Default",
      "o4-Default",
      "Gemini 2.5 Flash 05-20-Default",
      "Gemini 2.5 Pro 06-05-Default",
      "Claude 3.5 Sonnet-Default",
      "Claude 4-Default",
      "DeepSeek R1-Default",
      "DeepSeek V3-Default",
      "Grok 3 Mini-Default",
      "Grok 3-Default",
      "Grok 4-Default"
    ]),

    // Request configuration
    timeout: parseInt(Deno.env.get("TIMEOUT") || "30000"),
    maxRetries: parseInt(Deno.env.get("MAX_RETRIES") || "3"),
    retryDelay: parseFloat(Deno.env.get("RETRY_DELAY") || "1.0") * 1000,

    // Default headers
    defaultHeaders: {
      "accept": "*/*",
      "accept-language": "en,zh;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7",
      "cache-control": "no-cache",
      "content-type": "application/json",
      "origin": "https://www.orionai.asia",
      "pragma": "no-cache",
      "priority": "u=1, i",
      "referer": "https://www.orionai.asia/",
      "sec-ch-ua": '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
    }
  };
}

export let config = createConfig();

export function reloadConfig(): void {
  config = createConfig();
  console.log("🔄 Config reloaded after environment setup");
}