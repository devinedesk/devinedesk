'use client';

import { Card } from '@/components/ui/Card';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ImportSettings() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        toast.error('Please upload a valid JSON file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setSuccess(false);

    try {
      const fileText = await file.text();
      const jsonData = JSON.parse(fileText);

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Import failed');
      }

      toast.success('Data imported successfully!');
      setSuccess(true);
      setFile(null);
      // reset file input
      const fileInput = document.getElementById('import-file');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error(error.message || 'Failed to process import file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">Data Import</h2>
        <p className="text-neutral-secondary mt-1">
          Restore your workflows and workspaces from a previous JSON export.
        </p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <div className="space-y-6">
          <div className="rounded-md bg-yellow-500/10 p-4 border border-yellow-500/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-400">Important Note</h3>
                <div className="mt-2 text-sm text-yellow-500/90">
                  <p>
                    Importing data will create new copies of your Workspaces and Workflows.
                    It will not overwrite existing active configurations. Imported items will have "(Imported)" appended to their names.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Select Export File (.json)
            </label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="import-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-neutral-border-glass border-dashed rounded-lg cursor-pointer bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-neutral-400" />
                  <p className="mb-2 text-sm text-neutral-400">
                    <span className="font-semibold text-white">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-neutral-500">JSON export files only</p>
                </div>
                <input 
                  id="import-file" 
                  type="file" 
                  accept="application/json"
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg border border-neutral-border-glass">
              <span className="text-sm text-white truncate max-w-[70%]">{file.name}</span>
              <span className="text-xs text-neutral-400">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-400 p-3 bg-green-400/10 rounded-lg border border-green-400/20">
              <CheckCircle2 className="w-4 h-4" />
              Data imported successfully. Check your dashboard to view the restored items.
            </div>
          )}

          <div className="pt-4 border-t border-neutral-border-glass flex justify-end">
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="bg-primary hover:bg-primary-hover text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Upload size={16} /> Run Import
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
