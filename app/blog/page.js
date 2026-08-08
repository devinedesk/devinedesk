import Link from 'next/link';
import { ArrowRight, Calendar, User } from 'lucide-react';

export const metadata = {
  title: 'Blog | DevineDesk',
  description: 'Insights, updates, and tutorials from the DevineDesk team.',
};

export const revalidate = 86400; // Cache at the Edge for 24 hours

const posts = [
  {
    id: 1,
    title: 'Introducing DevineDesk 2.0: The AI-Powered SaaS Platform',
    excerpt:
      "Today we are thrilled to announce the next generation of DevineDesk. We've rebuilt the core architecture from the ground up to support native AI workflows and massive scale.",
    date: 'Aug 15, 2026',
    author: 'Jane Doe',
    category: 'Product Update',
    readTime: '5 min read',
    slug: 'introducing-devinedesk-2',
  },
  {
    id: 2,
    title: 'How to Optimize Your Workflow Engine for High Throughput',
    excerpt:
      'Learn how we scaled our internal BullMQ instances and Redis cluster to handle 10,000 concurrent node executions without dropping a single event.',
    date: 'Aug 02, 2026',
    author: 'John Smith',
    category: 'Engineering',
    readTime: '8 min read',
    slug: 'optimizing-workflow-engine',
  },
  {
    id: 3,
    title: 'The Future of Glassmorphism in Web Design',
    excerpt:
      'Why transparent UI elements and background blur are more than just a passing trend. Exploring the cognitive benefits of layered interfaces.',
    date: 'Jul 28, 2026',
    author: 'Alice Johnson',
    category: 'Design',
    readTime: '4 min read',
    slug: 'future-of-glassmorphism',
  },
  {
    id: 4,
    title: 'Securing Your APIs with Granular RBAC',
    excerpt:
      'A deep dive into how DevineDesk implements Role-Based Access Control down to the database row level, and how you can do it too.',
    date: 'Jul 10, 2026',
    author: 'Bob Williams',
    category: 'Security',
    readTime: '6 min read',
    slug: 'securing-apis-rbac',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#050505]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            The DevineDesk Blog
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Latest news, engineering deep-dives, and tutorials from the team building the future of
            SaaS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/\${post.slug}`}
              className={`group flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-300 animate-in fade-in zoom-in-95 delay-\${index * 100}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-neutral-500 font-medium">{post.readTime}</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h2>

              <p className="text-neutral-400 mb-6 flex-1 line-clamp-3">{post.excerpt}</p>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center text-sm text-neutral-500">
                  <User className="w-4 h-4 mr-2" />
                  {post.author}
                  <span className="mx-2">•</span>
                  <Calendar className="w-4 h-4 mr-2" />
                  {post.date}
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
