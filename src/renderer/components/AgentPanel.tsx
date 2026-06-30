import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WebViewHandle } from '../../shared/types';
import { buildToolSystemPrompt, parseToolCall, stripToolCall, executeTool, type ToolContext } from '../agents/tools';

interface AgentPanelProps {
  db: Database;
  onDbUpdate: (db: Database) => void;
  onClose: () => void;
  contextAction?: { action: string; content: string } | null;
  activeTabId?: string | null;
  getWebViewHandle?: (tabId: string) => WebViewHandle | undefined;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolCallDisplay {
  tool: string;
  args: Record<string, string>;
  result: string;
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-xs)',
  padding: '3px 6px',
};

const CONTEXT_PROMPTS: Record<string, string> = {
  explain: 'Explain the following content:\n\n{{content}}',
  summarize: 'Summarize the following content:\n\n{{content}}',
  translate: 'Translate the following content to English:\n\n{{content}}',
};

const toolCallStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-tertiary)',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-secondary)',
  marginBottom: 4,
  fontFamily: 'monospace',
};

export default function AgentPanel({ db, onDbUpdate, onClose, contextAction, activeTabId, getWebViewHandle: getHandle }: AgentPanelProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(db.agents[0]?.id || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCallDisplay[]>([]);
  const contextHandledRef = useRef(false);

  const selectedAgent = db.agents.find((a) => a.id === selectedAgentId);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2000);
  }, []);

  useEffect(() => {
    if (contextAction && !contextHandledRef.current) {
      contextHandledRef.current = true;
      const template = CONTEXT_PROMPTS[contextAction.action];
      if (template) {
        const msg = template.replace('{{content}}', contextAction.content);
        setInput(msg);
      }
    }
    if (!contextAction) {
      contextHandledRef.current = false;
    }
  }, [contextAction]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !selectedAgent || !db.settings.ollamaEndpoint) return;
    const model = selectedAgent.model || db.settings.selectedModel;
    if (!model) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setToolCalls([]);

    const chatMessages: { role: string; content: string }[] = [];
    if (selectedAgent.systemPrompt) {
      let prompt = selectedAgent.systemPrompt;
      if (selectedAgent.enableTools) {
        prompt += '\n' + buildToolSystemPrompt();
      }
      chatMessages.push({ role: 'system', content: prompt });
    } else if (selectedAgent.enableTools) {
      chatMessages.push({ role: 'system', content: buildToolSystemPrompt() });
    }
    for (const m of messages) {
      chatMessages.push({ role: m.role, content: m.content });
    }
    chatMessages.push({ role: 'user', content: userMsg.content });

    if (!selectedAgent.enableTools) {
      const result = await window.electronAPI?.ollamaChat({
        endpoint: db.settings.ollamaEndpoint,
        apiKey: db.settings.ollamaApiKey,
        model,
        messages: chatMessages,
        temperature: selectedAgent.temperature,
      });
      setLoading(false);
      const reply = (result?.success && result.response) ? result.response : `Error: ${result?.error || 'Unknown error'}`;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      return;
    }

    const toolCtx: ToolContext = {
      activeTabId: activeTabId || null,
      getWebViewHandle: getHandle || (() => undefined),
      onOpenTab: (url: string) => {
        window.electronAPI?.navigateToUrl(url);
      },
      onBookmarkPage: (title: string, url: string) => {
        const newBookmark = { id: crypto.randomUUID(), title, url };
        const updatedDb = { ...db, bookmarks: [...(db.bookmarks || []), newBookmark] };
        onDbUpdate(updatedDb);
      },
      onTakeNote: (content: string) => {
        const now = new Date().toISOString();
        const newTask = { id: crypto.randomUUID(), title: 'Note', description: content, status: 'completed' as const, agentId: selectedAgent.id, createdAt: now, updatedAt: now };
        const updatedDb = { ...db, tasks: [...(db.tasks || []), newTask] };
        onDbUpdate(updatedDb);
      },
    };

    let currentMessages = chatMessages;
    let finalReply = '';
    let toolCallCount = 0;
    const maxToolCalls = 5;

    while (toolCallCount < maxToolCalls) {
      const result = await window.electronAPI?.ollamaChat({
        endpoint: db.settings.ollamaEndpoint,
        apiKey: db.settings.ollamaApiKey,
        model,
        messages: currentMessages,
        temperature: selectedAgent.temperature,
      });

      if (!result?.success) {
        finalReply = `Error: ${result?.error || 'Unknown error'}`;
        break;
      }

      const response = result.response || '';
      const toolCall = parseToolCall(response);

      if (!toolCall) {
        finalReply = stripToolCall(response) || response;
        break;
      }

      const toolResult = await executeTool(toolCall.tool, toolCall.args, toolCtx);
      setToolCalls((prev) => [...prev, { tool: toolCall.tool, args: toolCall.args, result: toolResult }]);

      currentMessages = [...currentMessages, { role: 'assistant', content: response }];
      currentMessages.push({ role: 'system', content: `Tool result for ${toolCall.tool}:\n${toolResult}` });
      toolCallCount++;
    }

    if (!finalReply && toolCallCount >= maxToolCalls) {
      finalReply = 'Reached maximum tool call limit. Please try again with a more specific request.';
    }

    setLoading(false);
    if (finalReply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: finalReply }]);
    }
  }, [input, selectedAgent, db, activeTabId, getHandle, messages, onDbUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleExport = useCallback(async () => {
    const exportData = {
      conversations: db.conversations || [],
      tasks: db.tasks || [],
    };
    const result = await window.electronAPI?.exportConversations(exportData);
    if (result?.success) {
      showNotification('Exported successfully');
    } else {
      showNotification(result?.error === 'Cancelled' ? '' : 'Export failed');
    }
  }, [db.conversations, db.tasks, showNotification]);

  const handleImport = useCallback(async () => {
    const result = await window.electronAPI?.importConversations();
    if (result?.success && result.data) {
      const updatedDb = {
        ...db,
        conversations: result.data.conversations,
        tasks: result.data.tasks,
      };
      onDbUpdate(updatedDb);
      if (selectedAgentId) {
        const saved = result.data.conversations.find(
          (c: Conversation) => c.agentId === selectedAgentId
        );
        if (saved) {
          setMessages(saved.messages);
        }
      }
      showNotification('Imported successfully');
    } else if (result?.error && result.error !== 'Cancelled') {
      showNotification('Import failed');
    }
  }, [db, onDbUpdate, selectedAgentId, showNotification]);

  const handleSaveToDb = useCallback(() => {
    const now = new Date().toISOString();
    const existingIdx = (db.conversations || []).findIndex(
      (c: Conversation) => c.agentId === selectedAgentId
    );
    const conversation: Conversation = {
      id: existingIdx >= 0 ? db.conversations[existingIdx].id : crypto.randomUUID(),
      agentId: selectedAgentId,
      agentName: selectedAgent?.name || 'Unnamed Agent',
      messages,
      createdAt: existingIdx >= 0 ? db.conversations[existingIdx].createdAt : now,
      updatedAt: now,
    };
    let updatedConversations: Conversation[];
    if (existingIdx >= 0) {
      updatedConversations = [...db.conversations];
      updatedConversations[existingIdx] = conversation;
    } else {
      updatedConversations = [...(db.conversations || []), conversation];
    }
    const updatedDb = { ...db, conversations: updatedConversations };
    onDbUpdate(updatedDb);
    showNotification('Saved to database');
  }, [db, selectedAgentId, selectedAgent, messages, onDbUpdate, showNotification]);

  const handleLoadFromDb = useCallback(() => {
    const saved = (db.conversations || []).find(
      (c: Conversation) => c.agentId === selectedAgentId
    );
    if (saved) {
      setMessages(saved.messages);
      showNotification('Loaded from database');
    } else {
      showNotification('No saved conversation for this agent');
    }
  }, [db.conversations, selectedAgentId, showNotification]);

  useEffect(() => {
    if (selectedAgentId) {
      const saved = (db.conversations || []).find(
        (c: Conversation) => c.agentId === selectedAgentId
      );
      if (saved) {
        setMessages(saved.messages);
      } else {
        setMessages([]);
      }
    }
  }, [selectedAgentId, db.conversations]);

  return (
    <div style={{
      width: 350,
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>AI Agents</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={handleExport} title="Export to file" style={btnStyle}>
            Export
          </button>
          <button onClick={handleImport} title="Import from file" style={btnStyle}>
            Import
          </button>
          <button onClick={handleSaveToDb} title="Save to database" style={btnStyle}>
            Save
          </button>
          <button onClick={handleLoadFromDb} title="Load from database" style={btnStyle}>
            Load
          </button>
          <button onClick={onClose} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', marginLeft: 4 }}>✕</button>
        </div>
      </div>

      {notification && (
        <div style={{
          padding: '4px 12px',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--accent)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          {notification}
        </div>
      )}

      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <select
          value={selectedAgentId}
          onChange={(e) => {
            setSelectedAgentId(e.target.value);
            setMessages([]);
          }}
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 8px',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {db.agents.length === 0 && <option value="">No agents configured</option>}
          {db.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>{agent.name || 'Unnamed Agent'}</option>
          ))}
        </select>
        {db.agents.length > 0 && (
          <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Model: {selectedAgent?.model || db.settings.selectedModel || 'Not set'}
            </span>
            {selectedAgent?.enableTools && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--success)', marginLeft: 8 }}>⚙ Tools</span>
            )}
            <button onClick={clearChat} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              Clear
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center', marginTop: 40 }}>
            {db.agents.length === 0
              ? 'Configure agents in Settings first.'
              : 'Send a message to start chatting.'}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: msg.role === 'user' ? 'var(--bg-surface)' : 'var(--bg-secondary)',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>
              {msg.role === 'user' ? 'You' : (selectedAgent?.name || 'Agent')}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {toolCalls.length > 0 && !loading && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Tools used:</div>
            {toolCalls.map((tc, i) => (
              <div key={i} style={toolCallStyle}>
                <div style={{ color: 'var(--accent)', marginBottom: 2 }}>◈ {tc.tool}({JSON.stringify(tc.args)})</div>
                <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden' }}>
                  {tc.result.length > 200 ? tc.result.slice(0, 200) + '...' : tc.result}
                </div>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {toolCalls.length > 0 ? `Using tool: ${toolCalls[toolCalls.length - 1].tool}...` : 'Thinking...'}
          </div>
        )}
      </div>

      {db.agents.length > 0 && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            style={{
              flex: 1,
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !((selectedAgent?.model || db.settings.selectedModel))}
            style={{
              alignSelf: 'flex-end',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
