import { MCPServer, MCPTool, MCPToolResult } from '../../../types/index.js';

export const webToolsMCPServer: MCPServer = {
  id: 'web-tools',
  name: 'web-tools',
  description: 'Tools for searching the web and fetching content',
  transport: 'stdio',
  enabled: true,
};

export const webTools: MCPTool[] = [
  {
    name: 'searchWeb',
    description: 'Search the web for information',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        numResults: { type: 'number', default: 5 },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetchUrl',
    description: 'Fetch content from a URL',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', format: 'uri' } },
      required: ['url'],
    },
  },
  {
    name: 'extractContent',
    description: 'Extract main content from a webpage',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', format: 'uri' } },
      required: ['url'],
    },
  },
];

function extractMainContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return html.substring(0, 10000);

  let content = bodyMatch[1];

  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  content = content.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  content = content.replace(/<[^>]+>/g, ' ');
  content = content.replace(/\s+/g, ' ').trim();

  return content.substring(0, 10000);
}

export const webToolsHandlers: Record<string, Function> = {
  getTools: () => webTools,

  async searchWeb(query: string, numResults = 5): Promise<MCPToolResult> {
    try {
      const response = await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return {
          content: [{ type: 'text', text: `Search failed: HTTP ${response.status}` }],
          isError: true,
        };
      }

      const data = await response.json() as { RelatedTopics?: Array<{ Text?: string; FirstURL?: string }> };
      const results = (data.RelatedTopics || []).slice(0, numResults).map((item) => ({
        title: item.Text || '',
        url: item.FirstURL || '',
        snippet: item.Text || '',
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Search error: ${error.message}` }],
        isError: true,
      };
    }
  },

  async fetchUrl(url: string): Promise<MCPToolResult> {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { content: [{ type: 'text', text: 'Only HTTP/HTTPS URLs supported' }], isError: true };
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Book-Editor/1.0',
        },
      });

      if (!response.ok) {
        return {
          content: [{ type: 'text', text: `Fetch failed: HTTP ${response.status}` }],
          isError: true,
        };
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/html')) {
        const html = await response.text();
        const extracted = extractMainContent(html);
        return { content: [{ type: 'text', text: extracted }] };
      }

      const text = await response.text();
      return { content: [{ type: 'text', text: text.substring(0, 10000) }] };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Fetch error: ${error.message}` }],
        isError: true,
      };
    }
  },

  async extractContent(url: string): Promise<MCPToolResult> {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { content: [{ type: 'text', text: 'Only HTTP/HTTPS URLs supported' }], isError: true };
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Book-Editor/1.0',
        },
      });

      if (!response.ok) {
        return {
          content: [{ type: 'text', text: `Extract failed: HTTP ${response.status}` }],
          isError: true,
        };
      }

      const html = await response.text();
      const extracted = extractMainContent(html);

      return { content: [{ type: 'text', text: extracted }] };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Extract error: ${error.message}` }],
        isError: true,
      };
    }
  },
};