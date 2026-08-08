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
  Database,
  HardDrive,
  Image as ImageIcon,
  Video,
  FileAudio,
  Search,
  Filter,
  Trash2,
  Cloud,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminService } from '@/src/lib/services/adminService';

const getTypeIcon = (mimeType) => {
  if (!mimeType) return <HardDrive size={16} className="text-neutral-400" />;
  if (mimeType.includes('image')) return <ImageIcon size={16} className="text-blue-400" />;
  if (mimeType.includes('video')) return <Video size={16} className="text-purple-400" />;
  if (mimeType.includes('audio')) return <FileAudio size={16} className="text-green-400" />;
  if (mimeType.includes('model') || mimeType.includes('octet-stream'))
    return <Database size={16} className="text-yellow-400" />;
  return <HardDrive size={16} className="text-neutral-400" />;
};

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default async function StorageDashboard() {
  const { assets, total } = await AdminService.getAssets({ page: 1, limit: 50 });

  const totalBytes = assets.reduce((acc, a) => acc + (a.sizeBytes || 0), 0);
  const formattedTotalStorage = formatBytes(totalBytes);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Storage Management</h2>
          <p className="text-neutral-secondary mt-1">
            S3 bucket metrics, large files, and automated cleanup policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Storage Used</p>
              <h3 className="text-2xl font-bold text-white mt-1">{formattedTotalStorage}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Cloud size={20} />
            </div>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full w-[2%]" />
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex justify-between">
            <span>{formattedTotalStorage}</span>
            <span>10 TB Quota</span>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Assets</p>
              <h3 className="text-2xl font-bold text-white mt-1">{total.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Database size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Monthly Egress</p>
              <h3 className="text-2xl font-bold text-white mt-1">0 TB</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-400">Orphaned Files</p>
              <h3 className="text-2xl font-bold text-white mt-1">0 GB</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <HardDrive size={20} />
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
              placeholder="Search assets by ID, name, or user..."
              className="w-full bg-neutral-900 border border-neutral-border-glass rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors">
              <option>Type: All Types</option>
              <option>Type: Images</option>
              <option>Type: Videos</option>
              <option>Type: Models</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Key</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-neutral-500 py-4">
                    No storage assets found.
                  </TableCell>
                </TableRow>
              )}
              {assets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-neutral-800/50">
                  <TableCell className="font-medium text-white flex items-center gap-2">
                    {getTypeIcon(asset.mimeType)}
                    <span className="truncate max-w-[200px] inline-block">{asset.key}</span>
                  </TableCell>
                  <TableCell>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] text-brand-primary hover:underline truncate max-w-[200px] inline-block"
                    >
                      {asset.url}
                    </a>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {asset.user?.email || asset.userId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-neutral-400 border-neutral-700 bg-neutral-800/50 text-[10px] uppercase"
                    >
                      {asset.mimeType || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-300 text-sm">
                    {formatBytes(asset.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
