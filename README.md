# tscircuit MCP Server

A Model Context Protocol (MCP) server that provides Claude with access to the tscircuit electronics component registry. This enables Claude to search, browse, and analyze electronic components and circuit packages from the tscircuit ecosystem.

## Features

- **Component Search**: Search for electronic components by name, type, or description
- **Package Details**: Get comprehensive information about tscircuit packages
- **Source Code Access**: Retrieve component source code and implementation details
- **Component Analysis**: Analyze electrical specifications, footprints, and compatibility
- **Caching**: Built-in response caching for improved performance
- **Error Handling**: Robust error handling with meaningful error messages

## Installation

### Prerequisites

- Bun 1.0.0 or higher
- Alternatively, Node.js 18.0.0 or higher with npm

### Setup

1. Clone or download this repository
2. Install dependencies:

```bash
bun install
```

3. Build the project:

```bash
bun run build
```

4. Test the server:

```bash
bun start
```

### Development

For development with hot reload:

```bash
bun run dev
```

For type checking:

```bash
bun run typecheck
```

## Usage with Claude Desktop

### Configuration

Add the following to your Claude Desktop MCP configuration file:

**On macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tscircuit": {
      "command": "bun",
      "args": ["/path/to/tscircuit-mcp/build/index.js"]
    }
  }
}
```

Or if you prefer to use Node.js:

```json
{
  "mcpServers": {
    "tscircuit": {
      "command": "node",
      "args": ["/path/to/tscircuit-mcp/build/index.js"]
    }
  }
}
```

Replace `/path/to/tscircuit-mcp` with the actual path to your installation.

### Available Resources

The MCP server provides these resources that Claude can read:

#### Search Components
- **URI**: `tscircuit://packages/search?q={query}&limit={limit}&category={category}`
- **Description**: Search results from tscircuit registry
- **Parameters**:
  - `q` (required): Search query
  - `limit` (optional): Maximum results (default: 10)
  - `category` (optional): Component category filter

#### Package Details
- **URI**: `tscircuit://packages/{packageName}`
- **Description**: Detailed package information
- **Example**: `tscircuit://packages/seveibar/red-led`

#### Package Source Code
- **URI**: `tscircuit://packages/{packageName}/code?version={version}`
- **Description**: Component source code
- **Parameters**:
  - `version` (optional): Specific version (defaults to latest)

### Available Tools

Claude can use these tools to interact with the tscircuit registry:

#### `search_components`
Search for electronic components in the tscircuit registry.

**Parameters**:
- `query` (string, required): Search terms
- `limit` (number, optional): Maximum results (default: 10)
- `category` (string, optional): Component category filter

**Example**:
```json
{
  "query": "3.3V voltage regulator",
  "limit": 5,
  "category": "ic"
}
```

#### `get_package_details`
Get detailed information about a specific tscircuit package.

**Parameters**:
- `packageName` (string, required): Full package name

**Example**:
```json
{
  "packageName": "seveibar/red-led"
}
```

#### `get_package_code`
Retrieve the source code for a tscircuit component.

**Parameters**:
- `packageName` (string, required): Package name
- `version` (string, optional): Specific version

**Example**:
```json
{
  "packageName": "seveibar/red-led",
  "version": "1.0.0"
}
```

#### `analyze_component`
Analyze a component's electrical specifications and footprint.

**Parameters**:
- `packageName` (string, required): Package to analyze

**Example**:
```json
{
  "packageName": "seveibar/red-led"
}
```

## Example Usage Scenarios

### 1. Component Search
**Claude Query**: "Find me a 3.3V voltage regulator in SOT-23 package"

Claude will use the `search_components` tool:
```json
{
  "query": "3.3V voltage regulator SOT-23",
  "category": "ic"
}
```

### 2. Package Analysis
**Claude Query**: "What are the specifications of the ESP32 module package?"

Claude will use the `get_package_details` tool:
```json
{
  "packageName": "AnasSarkiz/ESP32_module"
}
```

### 3. Code Review
**Claude Query**: "Show me the implementation of the red LED component"

Claude will use the `get_package_code` tool:
```json
{
  "packageName": "seveibar/red-led"
}
```

### 4. Component Comparison
**Claude Query**: "Compare the specifications of these two resistor packages"

Claude will use multiple `analyze_component` calls to compare components.

## API Reference

### tscircuit Registry API

The server integrates with the official tscircuit registry at `https://registry-api.tscircuit.com`:

- **Search**: `POST /packages/search` with body `{"query": "search term"}`
- **Package Info**: Retrieved via search (no direct endpoint yet)
- **Package Code**: Accessed via npm package links

Package names follow the format `author/package-name` (e.g., `seveibar/usb-c-flashlight`) and are published to npm as `@tsci/author.package-name`.

### Component Categories

Supported component categories for filtering:
- `resistor` - Resistors
- `capacitor` - Capacitors
- `inductor` - Inductors
- `diode` - Diodes
- `transistor` - Transistors
- `ic` - Integrated circuits
- `connector` - Connectors
- `led` - LEDs
- `switch` - Switches
- `sensor` - Sensors
- `crystal` - Crystals and oscillators
- `relay` - Relays
- `transformer` - Transformers
- `fuse` - Fuses
- `battery` - Batteries
- `motor` - Motors
- `display` - Displays
- `antenna` - Antennas
- `other` - Other components

## Development

### Scripts

- `bun run build` - Build TypeScript to JavaScript
- `bun start` - Start the MCP server
- `bun run dev` - Development mode with hot reload
- `bun test` - Run tests
- `bun run typecheck` - Type checking without compilation

### Project Structure

```
tscircuit-mcp/
├── src/
│   ├── index.ts           # Main entry point
│   ├── server.ts          # MCP server implementation
│   ├── types.ts           # TypeScript type definitions
│   └── tscircuit-api.ts   # Registry API client
├── build/                 # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

### Error Handling

The server includes comprehensive error handling:
- Network timeouts and registry downtime
- Invalid package names (404 errors)
- Malformed requests
- API rate limiting
- Cache management

### Performance Features

- **Response Caching**: 5-minute TTL for registry responses
- **Request Timeouts**: 10-second timeout for API calls
- **Concurrent Requests**: Efficient handling of multiple simultaneous requests
- **Cache Statistics**: Built-in cache monitoring

## Troubleshooting

### Common Issues

1. **Server won't start**: Check Node.js version (requires 18.0.0+)
2. **Connection errors**: Verify network connectivity to registry.tscircuit.com
3. **Package not found**: Ensure package name is correct and exists in registry
4. **Slow responses**: Check network connection and registry status

### Debug Mode

Set the `DEBUG` environment variable to enable detailed logging:

```bash
DEBUG=tscircuit-mcp npm start
```

### Cache Management

Clear the cache programmatically:
```javascript
// Access through the server instance
server.getAPI().clearCache();

// Get cache statistics
const stats = server.getAPI().getCacheStats();
console.log(`Cache size: ${stats.size} entries`);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the tscircuit documentation
- Open an issue on the project repository