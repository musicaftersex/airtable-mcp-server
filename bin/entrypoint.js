#!/usr/bin/env node
import("../dist/index.js").catch(err => {
  console.error("Failed to start Airtable MCP server:", err);
  process.exit(1);
});
