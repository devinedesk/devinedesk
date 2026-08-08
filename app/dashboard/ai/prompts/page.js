'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlusCircle, Search, FileText, Loader2, Save } from 'lucide-react';

export default function PromptsDashboard() {
  const { data: session } = useSession();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [newPrompt, setNewPrompt] = useState({
    name: '',
    description: '',
    content: '',
    variables: '[]',
    isPublic: false,
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/prompts');
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/ai/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt),
      });
      if (res.ok) {
        setIsCreating(false);
        setNewPrompt({ name: '', description: '', content: '', variables: '[]', isPublic: false });
        fetchPrompts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPrompts = prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Prompt Library</h1>
          <p className="text-zinc-400 mt-1">Manage and version your AI prompt templates.</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-black"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Prompt
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl shadow-cyan-500/10">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>
              Design a reusable prompt template with {{ variables }}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Prompt Name (e.g. Creative Assistant)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              value={newPrompt.name}
              onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              value={newPrompt.description}
              onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
            />
            <textarea
              placeholder="You are a helpful assistant..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white min-h-[150px] font-mono text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              value={newPrompt.content}
              onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newPrompt.name || !newPrompt.content}
                className="bg-white text-black hover:bg-zinc-200"
              >
                <Save className="mr-2 h-4 w-4" /> Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search prompts..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center p-12 border border-zinc-800 rounded-2xl bg-zinc-900/50">
          <FileText className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No prompts found</h3>
          <p className="text-zinc-400 mb-6">You haven't created any prompt templates yet.</p>
          <Button
            onClick={() => setIsCreating(true)}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:text-white"
          >
            Create your first prompt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="bg-zinc-900/80 border-zinc-800 hover:border-cyan-500/50 hover:shadow-glow transition-all group"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium truncate">{prompt.name}</CardTitle>
                  <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">
                    v{prompt.version}
                  </span>
                </div>
                {prompt.description && (
                  <CardDescription className="line-clamp-2">{prompt.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 rounded-md p-3 max-h-32 overflow-hidden relative">
                  <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap line-clamp-4">
                    {prompt.content}
                  </pre>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
