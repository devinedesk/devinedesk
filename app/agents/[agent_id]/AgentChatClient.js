'use client';

import { useCallback, useState } from 'react';
import axios from 'axios';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AgentChatClient({ agentDetails, initialHistory, userData }) {
  const [messages, setMessages] = useState(initialHistory || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `/api/agents/by-slug/${agentDetails?.slug || agentDetails?.id}/chat`,
        {
          message: userMessage.content,
          history: messages,
        }
      );

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.reply || 'No response received.' },
      ]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error communicating with agent.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-app-bg text-white/80 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-muted/30 bg-panel-bg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-medium text-white">{agentDetails?.name || 'AI Agent'}</h1>
            <p className="text-sm text-secondary">
              {agentDetails?.description || 'Ready to assist you.'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <Bot className="w-12 h-12 text-primary/40" />
            <h3 className="text-lg font-medium text-white">Start a Conversation</h3>
            <p className="text-secondary max-w-sm">
              Send a message to begin chatting with {agentDetails?.name || 'the agent'}.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-card-bg text-secondary'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`px-5 py-3 rounded-2xl max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-primary/10 border border-primary/20 text-white rounded-tr-none'
                    : 'bg-card-bg border border-muted/50 text-white/80 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-card-bg text-secondary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-card-bg border border-muted/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-75"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-none p-6 border-t border-muted/30 bg-panel-bg">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-card-bg border border-muted hover:border-secondary rounded-xl px-6 py-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app-bg transition-colors"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            variant="primary"
            size="icon"
            className="w-14 h-14 rounded-xl flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
