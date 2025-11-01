# airtable-mcp-server

A Model Context Protocol server that provides read and write access to Airtable databases. This server enables LLMs to inspect database schemas, then read and write records.

https://github.com/user-attachments/assets/c8285e76-d0ed-4018-94c7-20535db6c944

## Installation

**Step 1**: [Create an Airtable personal access token by clicking here](https://airtable.com/create/tokens/new). Details:
- Name: Anything you want e.g. 'Airtable MCP Server Token'.
- Scopes: `schema.bases:read`, `data.records:read`, and optionally `schema.bases:write` and `data.records:write`.
- Access: The bases you want to access. If you're not sure, select 'Add all resources'.

Keep the token handy, you'll need it in the next step. It should look something like `pat123.abc123` (but longer).

**Step 2**: Follow the instructions below for your preferred client:

- [Claude Desktop](#claude-desktop)
- [Cursor](#cursor)
- [Cline](#cline)

### Claude Desktop

#### (Recommended) Via the extensions browser

1. Open Claude Desktop and go to Settings → Extensions
2. Click 'Browse Extensions' and find 'Airtable MCP Server'
3. Click 'Install' and paste in your API key

#### (Advanced) Alternative: Via manual .mcpb installation

1. Find the latest mcpb build in [the GitHub Actions history](https://github.com/domdomegg/airtable-mcp-server/actions/workflows/mcpb.yaml?query=branch%3Amaster) (the top one)
2. In the 'Artifacts' section, download the `airtable-mcp-server-mcpb` file
3. Rename the `.zip` file to `.mcpb`
4. Double-click the `.mcpb` file to open with Claude Desktop
5. Click "Install" and configure with your API key

#### (Advanced) Alternative: Via JSON configuration

1. Install [Node.js](https://nodejs.org/en/download)
2. Open Claude Desktop and go to Settings → Developer
3. Click "Edit Config" to open your `claude_desktop_config.json` file
4. Add the following configuration to the "mcpServers" section, replacing `pat123.abc123` with your API key:

```json
{
  "mcpServers": {
    "airtable": {
      "command": "npx",
      "args": [
        "-y",
        "airtable-mcp-server"
      ],
      "env": {
        "AIRTABLE_API_KEY": "pat123.abc123",
      }
    }
  }
}
```

5. Save the file and restart Claude Desktop

### Cursor

#### (Recommended) Via one-click install

1. Click [![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=airtable&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwYWlydGFibGUtbWNwLXNlcnZlciUyMiUyQyUyMmVudiUyMiUzQSU3QiUyMkFJUlRBQkxFX0FQSV9LRVklMjIlM0ElMjJwYXQxMjMuYWJjMTIzJTIyJTdEJTdE)
2. Edit your `mcp.json` file to insert your API key

#### (Advanced) Alternative: Via JSON configuration

Create either a global (`~/.cursor/mcp.json`) or project-specific (`.cursor/mcp.json`) configuration file, replacing `pat123.abc123` with your API key:

```json
{
  "mcpServers": {
    "airtable": {
      "command": "npx",
      "args": ["-y", "airtable-mcp-server"],
      "env": {
        "AIRTABLE_API_KEY": "pat123.abc123"
      }
    }
  }
}
```

### Cline

#### (Recommended) Via marketplace

1. Click the "MCP Servers" icon in the Cline extension
2. Search for "Airtable" and click "Install"
3. Follow the prompts to install the server

#### (Advanced) Alternative: Via JSON configuration

1. Click the "MCP Servers" icon in the Cline extension
2. Click on the "Installed" tab, then the "Configure MCP Servers" button at the bottom
3. Add the following configuration to the "mcpServers" section, replacing `pat123.abc123` with your API key:

```json
{
  "mcpServers": {
    "airtable": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "airtable-mcp-server"],
      "env": {
        "AIRTABLE_API_KEY": "pat123.abc123"
      }
    }
  }
}
```

## Components

### Tools

- **list_records**
  - Lists records from a specified Airtable table
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table to query
    - `maxRecords` (number, optional): Maximum number of records to return. Defaults to 100.
    - `filterByFormula` (string, optional): Airtable formula to filter records

- **search_records**
  - Search for records containing specific text
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table to query
    - `searchTerm` (string, required): Text to search for in records
    - `fieldIds` (array, optional): Specific field IDs to search in. If not provided, searches all text-based fields.
    - `maxRecords` (number, optional): Maximum number of records to return. Defaults to 100.

- **list_bases**
  - Lists all accessible Airtable bases
  - No input parameters required
  - Returns base ID, name, and permission level

- **list_tables**
  - Lists all tables in a specific base
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `detailLevel` (string, optional): The amount of detail to get about the tables (`tableIdentifiersOnly`, `identifiersOnly`, or `full`)
    - `offset` (number, optional): Starting index for pagination (0-based)
    - `limit` (number, optional): Maximum number of tables to return
    - `tableIds` (array, optional): Filter to only return tables with these IDs
  - Returns an object with:
    - `tables`: Array of table data (to the given `detailLevel`)
    - `totalCount`: Total number of tables matching the filter
    - `offset`: The offset used
    - `limit`: The limit used

- **describe_table**
  - Gets detailed information about a specific table
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table to describe
    - `detailLevel` (string, optional): The amount of detail to get about the table (`tableIdentifiersOnly`, `identifiersOnly`, or `full`)
  - Returns the same format as list_tables but for a single table
  - Useful for getting details about a specific table without fetching information about all tables in the base

- **get_record**
  - Gets a specific record by ID
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table
    - `recordId` (string, required): The ID of the record to retrieve

- **create_record**
  - Creates a new record in a table
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table
    - `fields` (object, required): The fields and values for the new record

- **update_records**
  - Updates one or more records in a table
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table
    - `records` (array, required): Array of objects containing record ID and fields to update

- **delete_records**
  - Deletes one or more records from a table
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table
    - `recordIds` (array, required): Array of record IDs to delete

- **create_table**
  - Creates a new table in a base
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `name` (string, required): Name of the new table
    - `description` (string, optional): Description of the table
    - `fields` (array, required): Array of field definitions (name, type, description, options)

- **update_table**
  - Updates a table's name or description
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table
    - `name` (string, optional): New name for the table
    - `description` (string, optional): New description for the table

- **create_field**
  - Creates a new field in a table
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table
    - `name` (string, required): Name of the new field
    - `type` (string, required): Type of the field
    - `description` (string, optional): Description of the field
    - `options` (object, optional): Field-specific options

- **update_field**
  - Updates a field's name or description
  - Input parameters:
    - `baseId` (string, required): The ID of the Airtable base
    - `tableId` (string, required): The ID of the table
    - `fieldId` (string, required): The ID of the field
    - `name` (string, optional): New name for the field
    - `description` (string, optional): New description for the field

### Resources

The server provides schema information for Airtable bases and tables:

- **Table Schemas** (`airtable://<baseId>/<tableId>/schema`)
  - JSON schema information for each table
  - Includes:
    - Base id and table id
    - Table name and description
    - Primary field ID
    - Field definitions (ID, name, type, description, options)
    - View definitions (ID, name, type)
  - Automatically discovered from Airtable's metadata API

## Contributing

Pull requests are welcomed on GitHub! To get started:

1. Install Git and Node.js
2. Clone the repository
3. Install dependencies with `npm install`
4. Run `npm run test` to run tests
5. Build with `npm run build`
  - You can use `npm run build:watch` to automatically build after editing [`src/index.ts`](./src/index.ts). This means you can hit save, reload Claude Desktop (with Ctrl/Cmd+R), and the changes apply.

## Releases

Versions follow the [semantic versioning spec](https://semver.org/).

To release:

1. Use `npm version <major | minor | patch>` to bump the version
2. Run `git push --follow-tags` to push with tags
3. Wait for GitHub Actions to publish to the NPM registry.
