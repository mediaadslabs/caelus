import type { ToolDefinition, WebViewHandle } from '../../shared/types';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'search_web',
    description: 'Search the web for information. Returns relevant search results with snippets.',
    parameters: [
      { name: 'query', type: 'string', description: 'The search query', required: true },
    ],
  },
  {
    name: 'get_page_content',
    description: 'Get the full text content of the current page the user is viewing.',
    parameters: [],
  },
  {
    name: 'open_tab',
    description: 'Open a new browser tab with the given URL.',
    parameters: [
      { name: 'url', type: 'string', description: 'The URL to open', required: true },
    ],
  },
  {
    name: 'bookmark_page',
    description: 'Save a bookmark for the current page or a specified URL.',
    parameters: [
      { name: 'title', type: 'string', description: 'Bookmark title', required: false },
      { name: 'url', type: 'string', description: 'URL to bookmark', required: false },
    ],
  },
  {
    name: 'take_note',
    description: 'Save a note or reminder to the user\'s notes database.',
    parameters: [
      { name: 'content', type: 'string', description: 'The note content', required: true },
    ],
  },
];

export function buildToolSystemPrompt(): string {
  return `
You have access to the following tools. Use them when needed to accomplish the user's request.

Available tools:
${TOOL_DEFINITIONS.map((t) => {
  const params = t.parameters.map((p) => `      ${p.name}${p.required ? '' : '?'}: ${p.type} — ${p.description}`).join('\n');
  return `  - ${t.name}(${t.parameters.map((p) => `${p.name}${p.required ? '' : '?'}`).join(', ')}): ${t.description}${params ? `\n    Parameters:\n${params}` : ''}`;
}).join('\n')}

To use a tool, respond with exactly:
<tool_call>
<tool>tool_name</tool>
<args>{"param": "value"}</args>
</tool_call>

Then after you receive the result, continue helping the user.
`;
}

export function parseToolCall(response: string): { tool: string; args: Record<string, string> } | null {
  const match = response.match(/<tool_call>[\s\S]*?<tool>(\w+)<\/tool>[\s\S]*?<args>(.*?)<\/args>[\s\S]*?<\/tool_call>/);
  if (!match) return null;
  try {
    const args = JSON.parse(match[2]);
    return { tool: match[1], args };
  } catch {
    return null;
  }
}

export function stripToolCall(response: string): string {
  return response.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim();
}

export interface ToolContext {
  activeTabId: string | null;
  getWebViewHandle: (tabId: string) => WebViewHandle | undefined;
  onOpenTab: (url: string) => void;
  onBookmarkPage: (title: string, url: string) => void;
  onTakeNote: (content: string) => void;
}

export async function executeTool(
  tool: string,
  args: Record<string, string>,
  ctx: ToolContext,
): Promise<string> {
  switch (tool) {
    case 'search_web': {
      if (!args.query) return 'Error: query parameter is required';
      const result = await window.electronAPI?.toolSearchWeb(args.query);
      if (!result?.success) return `Search failed: ${result?.error || 'Unknown error'}`;
      return result.results || 'No results found';
    }

    case 'get_page_content': {
      if (!ctx.activeTabId) return 'Error: no active tab';
      const handle = ctx.getWebViewHandle(ctx.activeTabId);
      if (!handle) return 'Error: could not access page';
      const js = `
        (function() {
          var sel = window.getSelection().toString();
          if (sel) return sel.substring(0, 6000);
          var selectors = ['article','main','.content','#content','.post','.entry'];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el) return el.innerText.substring(0, 6000);
          }
          return document.body.innerText.substring(0, 6000);
        })()
      `;
      try {
        const content = await handle.executeJavaScript(js);
        return content || '(empty page)';
      } catch {
        return '(could not extract page content)';
      }
    }

    case 'open_tab': {
      if (!args.url) return 'Error: url parameter is required';
      ctx.onOpenTab(args.url);
      return `Tab opened: ${args.url}`;
    }

    case 'bookmark_page': {
      ctx.onBookmarkPage(args.title || 'Untitled', args.url || '');
      return `Page bookmarked: ${args.title || 'Untitled'}`;
    }

    case 'take_note': {
      if (!args.content) return 'Error: content parameter is required';
      ctx.onTakeNote(args.content);
      return 'Note saved successfully';
    }

    default:
      return `Error: unknown tool "${tool}"`;
  }
}
