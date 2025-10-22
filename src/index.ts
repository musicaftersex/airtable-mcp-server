#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AirtableService } from './airtableService.js';
import { AirtableMCPServer } from './mcpServer.js';

const main = async () => {
  const apiKey = process.argv.slice(2)[0];

  const airtableService = new AirtableService(apiKey);
  const server = new AirtableMCPServer(airtableService);
  const transport = new StdioServerTransport();

await this.server.connect(transport);

// Debug: log all incoming/outgoing messages (safe)
(transport as any).input.on('data', (chunk: Buffer) => {
  console.error('⬅️  From AgentX:', chunk.toString());
});
(transport as any).output.on('data', (chunk: Buffer) => {
  console.error('➡️  To AgentX:', chunk.toString());
});
  
  await transport.start();
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
