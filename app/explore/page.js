'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Copy, Loader2, Sparkles, User as UserIcon, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ExploreMarketplace() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPublicWorkflows();
  }, []);

  const fetchPublicWorkflows = async () => {
    try {
      const res = await fetch('/api/explore?type=workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (workflow) => {
    setCloningId(workflow.id);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/clone`, {
        method: 'POST',
      });
      if (res.ok) {
        const cloned = await res.json();
        toast.success('Workflow cloned successfully!');
        router.push(`/workflow/${cloned.id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to clone workflow');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setCloningId(null);
    }
  };

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-app-bg text-white">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-bg.svg')] opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Discover the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              Community Marketplace
            </span>
          </h1>
          <p className="text-xl text-neutral-secondary max-w-2xl mx-auto mb-10">
            Explore and instantly clone powerful AI workflows and agents built by creators around
            the world.
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows, agents, or tags..."
              className="w-full bg-black/40 border border-neutral-border-glass rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:ring-2 focus:ring-primary backdrop-blur-md shadow-2xl transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Trending Workflows
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-20 bg-black/20 rounded-2xl border border-dashed border-neutral-border-glass">
            <p className="text-neutral-secondary">No public workflows found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md hover:border-primary/30 transition-all group flex flex-col h-full"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold line-clamp-1">{workflow.name}</h3>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full border border-primary/20">
                      Workflow
                    </span>
                  </div>
                  <p className="text-sm text-neutral-secondary mb-6 line-clamp-3">
                    {workflow.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-neutral-border-glass/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-black/50 border border-neutral-border-glass flex items-center justify-center overflow-hidden">
                      {workflow.user?.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={workflow.user.image}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </>
                      ) : (
                        <UserIcon className="h-4 w-4 text-neutral-secondary" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-neutral-300">
                      {workflow.user?.name || 'Anonymous'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleClone(workflow)}
                    disabled={cloningId === workflow.id}
                    className="flex items-center gap-1.5 text-sm font-medium bg-white text-black px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {cloningId === workflow.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Clone
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
