import { CheckCircle2, Clock, Map, Star } from 'lucide-react';

export const metadata = {
  title: 'Roadmap | DevineDesk',
  description: "See what we're building next at DevineDesk.",
};

const roadmap = {
  'Q3 2026': [
    {
      title: 'Advanced Workflows',
      status: 'launched',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    { title: 'SSO (SAML/OIDC)', status: 'in-progress', icon: Clock, color: 'text-amber-400' },
    { title: 'SOC2 Compliance', status: 'in-progress', icon: Clock, color: 'text-amber-400' },
  ],
  'Q4 2026': [
    { title: 'AI-Powered Agents v2', status: 'planned', icon: Star, color: 'text-primary' },
    { title: 'Custom Dashboard Builder', status: 'planned', icon: Star, color: 'text-primary' },
    { title: 'EU Data Residency', status: 'planned', icon: Star, color: 'text-primary' },
  ],
  'Q1 2027': [
    { title: 'GraphQL API Access', status: 'evaluating', icon: Map, color: 'text-neutral-400' },
    { title: 'Native Mobile App', status: 'evaluating', icon: Map, color: 'text-neutral-400' },
  ],
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Public Roadmap
          </h1>
          <p className="text-xl text-neutral-400">
            Transparency is a core value. Here's exactly what we're working on.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(roadmap).map(([quarter, items], qIdx) => (
            <div
              key={quarter}
              className={`bg-white/[0.02] border border-white/5 rounded-3xl p-8 animate-in fade-in zoom-in-95 delay-\${qIdx * 150}`}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="bg-white/10 px-3 py-1 rounded-lg text-sm">{quarter}</span>
              </h2>

              <ul className="space-y-4">
                {items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:bg-white/[0.06] transition-colors"
                  >
                    <item.icon className={`w-5 h-5 mr-3 shrink-0 \${item.color}`} />
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1 font-medium">
                        {item.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
