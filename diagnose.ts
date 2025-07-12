#!/usr/bin/env -S deno run --allow-env --allow-read --allow-net

/**
 * Deno Configuration Diagnostic Tool
 * 用于诊断deno版本的配置加载问题
 */

import { load } from "@std/dotenv";

console.log("🔍 Deno Configuration Diagnostic Tool");
console.log("=====================================\n");

// Step 1: Check Deno version
console.log("1. Deno Environment Check:");
console.log("   Deno version:", Deno.version.deno);
console.log("   V8 version:", Deno.version.v8);
console.log("   TypeScript version:", Deno.version.typescript);
console.log("   Working directory:", Deno.cwd());
console.log("");

// Step 2: Check .env file existence
console.log("2. .env File Check:");
const envPaths = [".env", "../.env"];
let envLoaded = false;
let loadedFrom = "";

for (const envPath of envPaths) {
  try {
    const stat = await Deno.stat(envPath);
    console.log(`   ✓ Found ${envPath} (${stat.size} bytes)`);
    
    if (!envLoaded) {
      try {
        await load({ envPath, export: true, allowEmptyValues: true });
        envLoaded = true;
        loadedFrom = envPath;
        console.log(`   ✓ Successfully loaded from ${envPath}`);
      } catch (error) {
        console.log(`   ✗ Failed to load from ${envPath}:`, error.message);
      }
    }
  } catch {
    console.log(`   ✗ ${envPath} not found`);
  }
}

console.log("");

// Step 3: Check environment variables
console.log("3. Environment Variables Check:");
const requiredVars = [
  "APP_NAME",
  "PORT", 
  "HOST",
  "TARGET_API_URL",
  "API_KEYS",
  "TOKEN_POOL",
  "AVAILABLE_MODELS"
];

for (const varName of requiredVars) {
  const value = Deno.env.get(varName);
  if (value) {
    if (varName === "AVAILABLE_MODELS") {
      console.log(`   ✓ ${varName}: ${value.length} chars`);
    } else if (varName === "API_KEYS" || varName === "TOKEN_POOL") {
      console.log(`   ✓ ${varName}: ${value.length} chars (JSON array)`);
    } else {
      console.log(`   ✓ ${varName}: ${value}`);
    }
  } else {
    console.log(`   ✗ ${varName}: not set`);
  }
}

console.log("");

// Step 4: Parse and validate AVAILABLE_MODELS
console.log("4. AVAILABLE_MODELS Validation:");
const availableModelsStr = Deno.env.get("AVAILABLE_MODELS");

if (availableModelsStr) {
  try {
    const models = JSON.parse(availableModelsStr);
    console.log(`   ✓ Successfully parsed JSON (${models.length} models)`);
    
    // Expected configuration
    const expectedAgentTypes = ['Default', 'Writer', 'Researcher', 'Study', 'Developer', 'SEO Mode', 'Cybersecurity Mode'];
    const expectedBaseModels = [
      'ChatGPT 4.1 Mini', 'ChatGPT 4.1', 'o4', 
      'Gemini 2.5 Flash 05-20', 'Gemini 2.5 Pro 06-05', 
      'Claude 3.5 Sonnet', 'Claude 4', 
      'DeepSeek R1', 'DeepSeek V3', 
      'Grok 3 Mini', 'Grok 3', 'Grok 4'
    ];
    
    const expectedTotal = expectedBaseModels.length * expectedAgentTypes.length;
    console.log(`   Expected: ${expectedTotal} models (${expectedBaseModels.length} base × ${expectedAgentTypes.length} agent types)`);
    
    if (models.length === expectedTotal) {
      console.log("   ✓ Model count matches expected configuration");
    } else {
      console.log(`   ⚠️  Model count mismatch: expected ${expectedTotal}, got ${models.length}`);
    }
    
    // Sample models
    console.log("   Sample models:");
    models.slice(0, 3).forEach(model => console.log(`     - ${model}`));
    console.log("     ...");
    models.slice(-3).forEach(model => console.log(`     - ${model}`));
    
  } catch (error) {
    console.log(`   ✗ Failed to parse JSON: ${error.message}`);
    console.log(`   Raw value preview: ${availableModelsStr.substring(0, 100)}...`);
  }
} else {
  console.log("   ✗ AVAILABLE_MODELS not found in environment");
}

console.log("");

// Step 5: Test configuration loading (simulate config.ts)
console.log("5. Configuration Loading Simulation:");

function parseJsonEnv(envVar: string, defaultValue: string[] = []): string[] {
  const value = Deno.env.get(envVar);
  if (!value) return defaultValue;
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch {
    console.log(`   ⚠️  Failed to parse ${envVar} as JSON, using default value`);
    return defaultValue;
  }
}

const testConfig = {
  appName: Deno.env.get("APP_NAME") || "LLM Proxy API (Deno)",
  port: parseInt(Deno.env.get("PORT") || "3333"),
  availableModels: parseJsonEnv("AVAILABLE_MODELS", [
    "ChatGPT 4.1 Mini-Default",
    "ChatGPT 4.1-Default", 
    "o4-Default"
  ]),
  apiKeys: parseJsonEnv("API_KEYS"),
  tokenPool: parseJsonEnv("TOKEN_POOL")
};

console.log("   Simulated config:");
console.log(`     App Name: ${testConfig.appName}`);
console.log(`     Port: ${testConfig.port}`);
console.log(`     Available Models: ${testConfig.availableModels.length} models`);
console.log(`     API Keys: ${testConfig.apiKeys.length} keys`);
console.log(`     Token Pool: ${testConfig.tokenPool.length} tokens`);

console.log("");

// Step 6: Summary and recommendations
console.log("6. Summary and Recommendations:");

if (envLoaded) {
  console.log(`   ✅ Configuration loaded successfully from ${loadedFrom}`);
  
  if (testConfig.availableModels.length === 84) {
    console.log("   ✅ All 84 agent type models are properly configured");
  } else {
    console.log(`   ⚠️  Expected 84 models, but got ${testConfig.availableModels.length}`);
  }
  
  if (testConfig.tokenPool.length > 0) {
    console.log("   ✅ Token pool is configured");
  } else {
    console.log("   ⚠️  Token pool is empty - API calls may fail");
  }
  
  console.log("");
  console.log("   🚀 Deno version should work correctly!");
  console.log("   To start the server, run:");
  console.log("     cd deno && deno run --allow-net --allow-env --allow-read main.ts");
  
} else {
  console.log("   ❌ Configuration loading failed");
  console.log("   Recommendations:");
  console.log("     1. Ensure .env file exists in deno directory or parent directory");
  console.log("     2. Check .env file format and syntax");
  console.log("     3. Verify file permissions");
}

console.log("");
console.log("🔧 Diagnostic complete!");