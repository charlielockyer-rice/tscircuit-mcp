import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import TscircuitAPI from './tscircuit-api.js';
import { ComponentCategory } from './types.js';

export class TscircuitMCPServer {
  private server: McpServer;
  private api: TscircuitAPI;

  constructor() {
    this.server = new McpServer({
      name: 'tscircuit-mcp',
      version: '1.0.0',
    });

    this.api = new TscircuitAPI();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Register resources
    this.server.resource(
      'ai-context',
      'tscircuit://ai-context',
      { description: 'AI context for working with tscircuit - comprehensive documentation and usage patterns' },
      async (uri: URL) => {
        try {
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          const aiContextPath = join(__dirname, '..', 'docs', 'ai.txt');
          const aiContext = readFileSync(aiContextPath, 'utf8');
          
          return {
            contents: [{
              uri: uri.toString(),
              mimeType: 'text/plain',
              text: aiContext,
            }],
          };
        } catch (error) {
          throw new Error(`Failed to load AI context: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    );

    this.server.resource(
      'search',
      'tscircuit://packages/search',
      { description: 'Search for tscircuit packages' },
      async (uri: URL) => {
        const query = uri.searchParams.get('q') || '';
        const limit = parseInt(uri.searchParams.get('limit') || '10');
        const category = uri.searchParams.get('category') || undefined;

        if (!query) {
          throw new Error('Search query parameter "q" is required');
        }

        const results = await this.api.searchPackages({ query, limit, category });
        
        return {
          contents: [{
            uri: uri.toString(),
            mimeType: 'application/json',
            text: JSON.stringify(results, null, 2),
          }],
        };
      }
    );

    this.server.resource(
      'package-details',
      new ResourceTemplate('tscircuit://packages/{packageName}', {
        list: undefined,
      }),
      { description: 'Get detailed information about a tscircuit package' },
      async (uri: URL, variables: any) => {
        const packageName = variables.packageName;
        const details = await this.api.getPackageDetails({ packageName });
        
        return {
          contents: [{
            uri: uri.toString(),
            mimeType: 'application/json',
            text: JSON.stringify(details, null, 2),
          }],
        };
      }
    );

    this.server.resource(
      'package-code',
      new ResourceTemplate('tscircuit://packages/{packageName}/code', {
        list: undefined,
      }),
      { description: 'Get the source code for a tscircuit package' },
      async (uri: URL, variables: any) => {
        const packageName = variables.packageName;
        const version = uri.searchParams.get('version') || undefined;
        const code = await this.api.getPackageCode({ packageName, version });
        
        return {
          contents: [{
            uri: uri.toString(),
            mimeType: 'text/plain',
            text: code,
          }],
        };
      }
    );

    // Register tools
    this.server.tool(
      'search_components',
      'Search for electronic components in the tscircuit registry',
      {
        query: z.string().describe('Search terms (component name, type, description)'),
        limit: z.number().optional().default(10).describe('Maximum results to return'),
        category: z.enum([
          'resistor', 'capacitor', 'inductor', 'diode', 'transistor', 'ic', 
          'connector', 'led', 'switch', 'sensor', 'crystal', 'relay', 
          'transformer', 'fuse', 'battery', 'motor', 'display', 'antenna', 'other'
        ]).optional().describe('Filter by component category'),
      },
      async (args) => {
        const results = await this.api.searchPackages(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2),
          }],
        };
      }
    );

    this.server.tool(
      'get_package_details',
      'Get detailed information about a specific tscircuit package',
      {
        packageName: z.string().describe('Full package name (e.g., "seveibar/red-led")'),
      },
      async (args) => {
        const details = await this.api.getPackageDetails(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(details, null, 2),
          }],
        };
      }
    );

    this.server.tool(
      'get_package_code',
      'Retrieve the source code for a tscircuit component',
      {
        packageName: z.string().describe('Package name'),
        version: z.string().optional().describe('Specific version (defaults to latest)'),
      },
      async (args) => {
        const code = await this.api.getPackageCode(args);
        return {
          content: [{
            type: 'text',
            text: code,
          }],
        };
      }
    );

    this.server.tool(
      'analyze_component',
      'Analyze a component\'s electrical specifications and footprint',
      {
        packageName: z.string().describe('Package to analyze'),
      },
      async (args) => {
        const analysis = await this.api.analyzeComponent(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          }],
        };
      }
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  getServer(): McpServer {
    return this.server;
  }

  getAPI(): TscircuitAPI {
    return this.api;
  }
}