# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fork of domdomegg's Airtable MCP Server, maintained as `@musicaftersex/airtable-mcp-server`. It provides a Model Context Protocol (MCP) server that enables LLMs to interact with Airtable databases (read/write records, inspect schemas, manage comments).

**Upstream:** https://github.com/domdomegg/airtable-mcp-server

## Common Commands

### Development
```bash
npm run build              # Build TypeScript to dist/
npm run build:watch        # Auto-rebuild on changes (useful during development)
npm test                   # Run all tests with vitest
npm run test:watch         # Run tests in watch mode
npm run lint               # Run ESLint
npm start                  # Start the MCP server
```

### Testing
```bash
npm test                           # Run all tests
npm test -- src/airtableService.test.ts  # Run specific test file
npm test -- -t "test name pattern"       # Run tests matching pattern
```

### Release
```bash
npm run build:mcpb         # Build MCP bundle (.mcpb file)
```

## Architecture

### Three-Layer Design

1. **Entry Point** (`src/index.ts`)
   - Initializes `AirtableService` with API key from args or env
   - Creates `AirtableMCPServer` instance
   - Sets up `StdioServerTransport` for MCP communication
   - Connects server to transport

2. **MCP Server Layer** (`src/mcpServer.ts`)
   - `AirtableMCPServer` class handles MCP protocol
   - Registers **Resources**: Table schemas via URI templates (`airtable://{baseId}/{tableId}/schema`)
   - Registers **Tools**: All Airtable operations (list_records, create_record, etc.)
   - Delegates actual Airtable operations to `AirtableService`

3. **Airtable Service Layer** (`src/airtableService.ts`)
   - `AirtableService` class handles all Airtable API interactions
   - All API calls go through `fetchFromAPI()` method with Zod schema validation
   - Handles pagination client-side (see `listRecords` - accumulates pages until offset is undefined)
   - Error enhancement via `enhanceAirtableError()`

### Type Safety

All types and Zod schemas live in `src/types.ts`:
- Response schemas validate API responses at runtime
- Tool argument schemas validate MCP tool inputs
- Interface definitions (`IAirtableService`, `IAirtableMCPServer`) for dependency injection

### Fork-Specific Customizations

This fork includes custom JavaScript files that are excluded from TypeScript compilation:

- **`src/claude.js`**: Claude API integration (`askClaude` function)
- **`src/vertor.js`**: Vector memory storage using ChromaDB (`storeMemory`, `retrieveMemory`)

**Important:** `tsconfig.build.json` excludes `**/*.js` files to prevent TypeScript errors on these custom additions. Do not remove this exclusion.

## Key Patterns

### Adding a New Tool

1. Define Zod schema in `src/types.ts` (e.g., `MyToolArgsSchema`)
2. Add method to `IAirtableService` interface if needed
3. Implement method in `AirtableService` class
4. Register tool in `AirtableMCPServer.registerTools()`
5. Add tests in `src/mcpServer.test.ts` and `src/airtableService.test.ts`

### API Request Pattern

All Airtable API calls follow this pattern:
```typescript
async someMethod(): Promise<SomeType> {
  return this.fetchFromAPI('/v0/endpoint', SomeResponseSchema);
}
```

The `fetchFromAPI` method:
- Adds authentication headers
- Validates responses with Zod
- Enhances errors with `enhanceAirtableError()`

### Pagination

Client-side pagination is used for `listRecords`:
- Do NOT send `maxRecords` to Airtable API
- Loop through pages using `offset` until API stops returning one
- If caller provides `maxRecords`, enforce it client-side by slicing results

Debug logging is enabled for `filterByFormula` (console.error statements in airtableService.ts:64-67, 95).

## Testing

- Test framework: Vitest
- Tests are colocated: `*.test.ts` files alongside source
- End-to-end tests in `src/e2e.test.ts` (require `RUN_MCPB_TEST` and `RUN_DOCKER_TEST` env vars)
- All tests excluded from build via `tsconfig.build.json`

## MCP Server Configuration

The server identifies as `io.github.musicaftersex/airtable-mcp-server` in the MCP protocol (see `mcpServer.ts:30`).

Required environment variable or CLI argument:
- `AIRTABLE_API_KEY`: Personal access token from Airtable

## Syncing with Upstream

When syncing with upstream domdomegg/airtable-mcp-server:
1. Add upstream remote: `git remote add upstream https://github.com/domdomegg/airtable-mcp-server.git`
2. Fetch changes: `git fetch upstream master`
3. Merge: `git merge upstream/master`
4. Resolve conflicts in `package.json` (keep scoped name `@musicaftersex/airtable-mcp-server`, use upstream version)
5. Regenerate `package-lock.json`: `npm install`
6. Ensure `tsconfig.build.json` still excludes `**/*.js` files
