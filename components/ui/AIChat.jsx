import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export function AIChat({ onSendMessage, isTyping = false, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = { role: 'user', content: input };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    if (onSendMessage) {
      const response = await onSendMessage(msg.content);
      if (response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      }
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-neutral-card-bg/50 border border-neutral-border-glass rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-black' : 'bg-neutral-800 text-primary'}`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`px-4 py-2 max-w-[80%] rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20 text-white' : 'bg-neutral-800/50 border border-neutral-700 text-neutral-200'}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-800 text-primary">
              <Bot size={16} />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-neutral-800/50 border border-neutral-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 bg-black/40 border-t border-neutral-border-glass">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="w-full bg-neutral-800/50 border border-neutral-700 rounded-full pl-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-1 p-2 bg-primary text-black rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
