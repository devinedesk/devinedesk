export const dynamic = "force-dynamic";

import { Card } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import {
  LifeBuoy,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminService } from '@/src/lib/services/adminService';
import { EmptyState } from '@/components/states/EmptyState';

const getStatusColor = (status) => {
  switch (status) {
    case 'OPEN':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    case 'IN_PROGRESS':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'RESOLVED':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'CLOSED':
      return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
    default:
      return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'URGENT':
      return 'text-red-400';
    case 'HIGH':
      return 'text-orange-400';
    case 'NORMAL':
      return 'text-blue-400';
    case 'LOW':
      return 'text-neutral-400';
    default:
      return 'text-neutral-400';
  }
};

export default async function SupportDashboard() {
  const { tickets, total } = await AdminService.getSupportTickets({ page: 1, limit: 50 });

  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN').length;
  const urgentTicketsCount = tickets.filter((t) => t.priority === 'URGENT').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Support & Ticketing</h2>
          <p className="text-neutral-secondary mt-1">
            Manage user issues, bug reports, and billing inquiries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-400">Open Tickets</p>
              <h3 className="text-2xl font-bold text-white mt-1">{openTicketsCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-red-400">Urgent Issues</p>
              <h3 className="text-2xl font-bold text-white mt-1">{urgentTicketsCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Avg Response Time</p>
              <h3 className="text-2xl font-bold text-white mt-1">N/A</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">Resolved</p>
              <h3 className="text-2xl font-bold text-white mt-1">{resolvedCount}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-neutral-border-glass flex flex-wrap justify-between items-center bg-black/20 gap-4">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search tickets by ID, user, or subject..."
              className="w-full bg-neutral-900 border border-neutral-border-glass rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors">
              <option>Status: All Active</option>
              <option>Status: Open</option>
              <option>Status: In Progress</option>
              <option>Status: Resolved</option>
            </select>
            <select className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors">
              <option>Category: All</option>
              <option>Category: Billing</option>
              <option>Category: Bug</option>
              <option>Category: Feature</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0 hover:bg-transparent">
                    <EmptyState
                      icon={LifeBuoy}
                      title="No support tickets"
                      description="User support requests will appear here."
                    />
                  </TableCell>
                </TableRow>
              )}
              {tickets.map((ticket) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-neutral-800/50">
                  <TableCell>
                    <span className="font-mono text-xs text-brand-primary font-medium truncate inline-block max-w-[80px]">
                      {ticket.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-white max-w-[200px] truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {ticket.user?.email || ticket.userId}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-neutral-400 border-neutral-700 bg-neutral-800/50 text-[10px]"
                    >
                      {ticket.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusColor(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-neutral-border-glass bg-black/20 flex justify-between items-center text-sm text-neutral-400">
          <span>
            Showing {tickets.length} of {total} tickets
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
