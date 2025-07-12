#!/usr/bin/env -S deno run --allow-env --allow-read

import { load } from "@std/dotenv";

// Test .env loading
console.log("Testing .env loading...");

try {
  // Try to load from current directory
  await load({ envPath: ".env", export: true, allowEmptyValues: true });
  console.log("✓ Loaded .env from current directory");
} catch (error) {
  console.log("✗ Failed to load .env from current directory:", error.message);
  
  try {
    // Try to load from parent directory
    await load({ envPath: "../.env", export: true, allowEmptyValues: true });
    console.log("✓ Loaded .env from parent directory");
  } catch (error2) {
    console.log("✗ Failed to load .env from parent directory:", error2.message);
  }
}

// Test environment variables
console.log("\nTesting environment variables:");
console.log("APP_NAME:", Deno.env.get("APP_NAME"));
console.log("PORT:", Deno.env.get("PORT"));
console.log("DEBUG:", Deno.env.get("DEBUG"));

// Test AVAILABLE_MODELS parsing
const availableModelsStr = Deno.env.get("AVAILABLE_MODELS");
console.log("\nTesting AVAILABLE_MODELS:");
console.log("Raw value length:", availableModelsStr?.length || 0);

if (availableModelsStr) {
  try {
    const models = JSON.parse(availableModelsStr);
    console.log("✓ Successfully parsed AVAILABLE_MODELS");
    console.log("Number of models:", models.length);
    console.log("First few models:", models.slice(0, 3));
    console.log("Last few models:", models.slice(-3));
  } catch (error) {
    console.log("✗ Failed to parse AVAILABLE_MODELS:", error.message);
    console.log("First 100 chars:", availableModelsStr.substring(0, 100));
  }
} else {
  console.log("✗ AVAILABLE_MODELS not found in environment");
}