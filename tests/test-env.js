#!/usr/bin/env node

// Simple Node.js script to test .env parsing
const fs = require('fs');
const path = require('path');

console.log("Testing .env file parsing...");

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log("✗ .env file not found at:", envPath);
  Deno.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
console.log("✓ .env file found, size:", envContent.length, "bytes");

// Parse AVAILABLE_MODELS
const lines = envContent.split('\n');
const modelsLine = lines.find(line => line.startsWith('AVAILABLE_MODELS='));

if (!modelsLine) {
  console.log("✗ AVAILABLE_MODELS not found in .env file");
  Deno.exit(1);
}

const modelsJson = modelsLine.substring('AVAILABLE_MODELS='.length);
console.log("Raw AVAILABLE_MODELS length:", modelsJson.length);

try {
  const models = JSON.parse(modelsJson);
  console.log("✓ Successfully parsed AVAILABLE_MODELS");
  console.log("Number of models:", models.length);
  console.log("Expected: 84 models");
  
  if (models.length === 84) {
    console.log("✓ Correct number of models found!");
  } else {
    console.log("✗ Expected 84 models, found:", models.length);
  }
  
  // Check agent types
  const agentTypes = ['Default', 'Writer', 'Researcher', 'Study', 'Developer', 'SEO Mode', 'Cybersecurity Mode'];
  const baseModels = ['ChatGPT 4.1 Mini', 'ChatGPT 4.1', 'o4', 'Gemini 2.5 Flash 05-20', 'Gemini 2.5 Pro 06-05', 'Claude 3.5 Sonnet', 'Claude 4', 'DeepSeek R1', 'DeepSeek V3', 'Grok 3 Mini', 'Grok 3', 'Grok 4'];
  
  console.log("\nValidating model structure:");
  let validCount = 0;
  
  for (const baseModel of baseModels) {
    for (const agentType of agentTypes) {
      const expectedModel = `${baseModel}-${agentType}`;
      if (models.includes(expectedModel)) {
        validCount++;
      } else {
        console.log("✗ Missing model:", expectedModel);
      }
    }
  }
  
  console.log(`✓ Found ${validCount} valid models out of expected 84`);
  
  if (validCount === 84) {
    console.log("✓ All models are correctly configured!");
  }
  
} catch (error) {
  console.log("✗ Failed to parse AVAILABLE_MODELS JSON:", error.message);
  console.log("First 200 chars:", modelsJson.substring(0, 200));
}
