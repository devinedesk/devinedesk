'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export function DynamicSettingsForm({ title, description, schema, initialData = {} }) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">{title}</h2>
        {description && <p className="text-neutral-secondary mt-1">{description}</p>}
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {schema.map((field) => (
              <div key={field.key} className="flex items-center justify-between">
                <div className="mr-8">
                  <h3 className="font-medium text-white">{field.label}</h3>
                  {field.description && (
                    <p className="text-sm text-neutral-400 mt-1">
                      {field.description}
                    </p>
                  )}
                </div>
                
                {field.type === 'toggle' && (
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={data[field.key] === 'true' || data[field.key] === true}
                      onChange={(e) => handleChange(field.key, e.target.checked ? 'true' : 'false')}
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                )}

                {field.type === 'select' && (
                  <select
                    className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors shrink-0 min-w-[150px]"
                    value={data[field.key] !== undefined ? data[field.key] : (field.defaultValue || '')}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  >
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                
                {field.type === 'input' && (
                  <input
                    type="text"
                    className="bg-neutral-900 border border-neutral-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors shrink-0 min-w-[200px]"
                    value={data[field.key] || ''}
                    placeholder={field.placeholder}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-border-glass flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
