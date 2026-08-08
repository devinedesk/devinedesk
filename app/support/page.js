'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FiLifeBuoy, FiBook, FiCode, FiArrowRight } from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { DataGrid } from '@/components/ui/DataGrid';
import { Tabs } from '@/components/ui/Tabs';
import { Accordion } from '@/components/ui/Accordion';
import { apiClient } from '@/src/lib/apiClient';

const FAQS = [
  {
    title: 'How do I trigger workflows externally?',
    content: 'You can trigger workflows securely using our Webhook endpoints. Navigate to your Workspace Settings to generate an API key, then send a POST request to /api/webhooks.',
  },
  {
    title: 'Can I use custom AI models?',
    content: "Yes. DevineDesk's abstraction layer allows you to plug in API keys for OpenAI, Anthropic, Gemini, or even custom hosted LLMs via the HTTP Request node.",
  },
  {
    title: 'How does billing work?',
    content: 'Billing is managed per workspace via Stripe. We offer a usage-based execution tier and an Enterprise unlimited tier. Visit /billing to manage your subscription.',
  },
];

export default function SupportCenter() {
  const { data: session } = useSession();
  
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchTickets();
    } else {
      setLoadingTickets(false);
    }
  }, [session]);

  const fetchTickets = async () => {
    try {
      const data = await apiClient.get('/support');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      setError('Subject and message are required.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      await apiClient.post('/support', {
        subject,
        category,
        priority,
        message
      });
      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (err) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const ticketColumns = [
    { key: 'createdAt', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status', render: (val) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        val === 'OPEN' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
      }`}>{val}</span>
    )},
    { key: 'priority', label: 'Priority', render: (val) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        val === 'HIGH' || val === 'URGENT' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
      }`}>{val}</span>
    )},
    { key: 'action', label: '', render: (_, row) => (
      <Link href={`/dashboard/support/${row.id}`} className="text-cyan-400 hover:underline">View</Link>
    )}
  ];

  const tabs = [
    {
      id: 'faq',
      label: 'Knowledge Base',
      content: (
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Link
              href="/docs"
              className="block bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
            >
              <div className="h-10 w-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiBook size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Documentation</h3>
              <p className="text-sm text-zinc-400">Read our comprehensive guides on building AI workflows.</p>
            </Link>

            <Link
              href="/docs/api"
              className="block bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
            >
              <div className="h-10 w-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiCode size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">API Reference</h3>
              <p className="text-sm text-zinc-400">Integrate DevineDesk deeply into your own applications.</p>
            </Link>
          </div>
          
          <div className="md:col-span-2">
            <Card padding="lg">
              <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
              <Accordion items={FAQS} />
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'create_ticket',
      label: 'Open a Ticket',
      content: (
        <div className="pt-6 max-w-3xl mx-auto">
          {!session ? (
            <Card padding="lg" className="text-center">
              <h3 className="text-lg text-white mb-4">Please log in to submit a ticket.</h3>
              <Link href="/auth/login?callbackUrl=/support">
                <Button>Log In</Button>
              </Link>
            </Card>
          ) : (
            <Card padding="lg">
              <h3 className="text-xl font-bold text-white mb-6">Submit a Request</h3>
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-xl text-green-200">
                  Ticket submitted successfully! We will get back to you shortly.
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of the issue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-secondary mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-black/40 border border-neutral-border-glass rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="GENERAL">General Inquiry</option>
                      <option value="BUG">Bug Report</option>
                      <option value="BILLING">Billing Issue</option>
                      <option value="FEATURE">Feature Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-secondary mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-black/40 border border-neutral-border-glass rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Production down)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-secondary mb-2">Message</label>
                  <RichTextEditor
                    value={message}
                    onChange={setMessage}
                    placeholder="Describe your issue in detail. Please include reproduction steps if applicable."
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" isLoading={submitting}>
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )
    },
    {
      id: 'my_tickets',
      label: 'My Tickets',
      content: (
        <div className="pt-6">
          {!session ? (
            <Card padding="lg" className="text-center">
              <h3 className="text-lg text-white mb-4">Please log in to view your tickets.</h3>
              <Link href="/auth/login?callbackUrl=/support">
                <Button>Log In</Button>
              </Link>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <DataGrid
                columns={ticketColumns}
                data={tickets}
                loading={loadingTickets}
                emptyMessage="You haven't submitted any tickets yet."
              />
            </Card>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-app-bg text-white font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-app-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 bg-cyan-500 rounded flex items-center justify-center">
              <span className="text-black font-black text-xs">D</span>
            </div>
            <span className="font-bold text-white tracking-tight">DevineDesk</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4">How can we help?</h1>
          <p className="text-lg text-zinc-500">
            Search our knowledge base or open a ticket for personalized support.
          </p>
        </div>

        <Tabs tabs={tabs} defaultTab="faq" />
      </main>
    </div>
  );
}
