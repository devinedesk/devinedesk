import { Accordion } from '@/components/ui/Accordion';

export const metadata = {
  title: 'FAQ - DevineDesk',
  description: 'Frequently Asked Questions about DevineDesk',
};

const faqs = [
  {
    title: 'What is DevineDesk?',
    content: 'DevineDesk is an enterprise-grade AI automation platform that allows you to visually construct, execute, and monitor complex AI workflows using over 200 integrated models.',
  },
  {
    title: 'How does billing work?',
    content: 'Billing is handled via a secure integration with Stripe. You can subscribe to the Pro tier for monthly credits, or purchase one-time credit top-ups directly from the Billing dashboard. Unused subscription credits rollover up to a maximum limit.',
  },
  {
    title: 'Is my data secure?',
    content: 'Yes. All data is encrypted at rest using AES-256 and in transit via TLS 1.3. We employ strict Role-Based Access Control (RBAC) and hash all API keys using SHA-256 to ensure complete security of your assets.',
  },
  {
    title: 'What happens if a model fails during execution?',
    content: 'Our generation engine employs an automatic exponential backoff and retry strategy. If a primary model fails due to rate limits or network issues, we automatically fallback to secondary models if configured in your workflow.',
  },
  {
    title: 'Can I invite my team?',
    content: 'Absolutely. You can create an Organization from the Settings panel and invite team members. You can assign different roles (Admin, Member, Viewer) to restrict who can edit or execute workflows.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#030303] flex justify-center py-20 px-6">
      <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Frequently Asked Questions</h1>
        <p className="text-neutral-400 mb-12 text-lg">
          Find answers to common questions about DevineDesk's billing, security, and AI workflow capabilities.
        </p>

        <Accordion items={faqs} />

        <div className="mt-16 p-6 rounded-2xl border border-neutral-border-glass bg-neutral-card-bg/50 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Still have questions?</h3>
            <p className="text-neutral-400 mt-1">Our support team is here to help you 24/7.</p>
          </div>
          <a
            href="/support"
            className="mt-4 sm:mt-0 px-6 py-2.5 bg-primary text-black font-medium rounded-xl hover:bg-primary-hover transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
