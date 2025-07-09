#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

console.log('🚀 Installing tscircuit MCP integration for Claude Desktop...\n');

const configDir = join(homedir(), 'Library', 'Application Support', 'Claude');
const configPath = join(configDir, 'claude_desktop_config.json');
const currentDir = process.cwd();

// Create config directory if it doesn't exist
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true });
  console.log('✅ Created Claude config directory');
}

// Read existing config or create new one
let config = {};
if (existsSync(configPath)) {
  try {
    const configContent = readFileSync(configPath, 'utf8');
    config = JSON.parse(configContent);
    console.log('📖 Found existing Claude config');
  } catch (error) {
    console.log('⚠️  Could not parse existing config, creating new one');
    config = {};
  }
}

// Add tscircuit MCP server
if (!config.mcpServers) {
  config.mcpServers = {};
}

config.mcpServers.tscircuit = {
  command: 'bun',
  args: [join(currentDir, 'build', 'index.js')]
};

// Write config
writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ Added tscircuit MCP server to Claude Desktop config');

console.log('\n📝 Next steps:');
console.log('1. Restart Claude Desktop (Cmd+Q then reopen)');
console.log('2. Look for the hammer icon (🔨) in the input area');
console.log('3. Try asking: "Find me some LED components"');
console.log('\n🎉 Installation complete!');