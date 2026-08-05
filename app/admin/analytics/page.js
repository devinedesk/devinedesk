"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-full text-secondary">
        <Spinner size="lg" />
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 font-medium">Error: {error}</div>;
  }

  return (
    <div className="space-y-8 font-sans">
      <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
      <p className="text-secondary font-medium">Time-series data for the last 30 days.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Generations Chart */}
        <Card padding="lg" className="flex flex-col">
          <h2 className="font-bold text-xl mb-6 text-white">Generations Over Time</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.generationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#a1a1aa"
                  tickFormatter={(tick) => {
                    const d = new Date(tick);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }} 
                />
                <YAxis stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-panel-bg, #0a0a0a)', borderColor: 'var(--color-muted, #27272a)', color: '#fff', borderRadius: '12px' }}
                  itemStyle={{ color: '#ec4899' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="generations" 
                  name="Total Generations" 
                  stroke="#ec4899" 
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: '#ec4899' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Credits Velocity Chart */}
        <Card padding="lg" className="flex flex-col">
          <h2 className="font-bold text-xl mb-6 text-white">Credit Velocity (Purchased vs Spent)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.creditsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#a1a1aa"
                  tickFormatter={(tick) => {
                    const d = new Date(tick);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }} 
                />
                <YAxis stroke="#a1a1aa" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-panel-bg, #0a0a0a)', borderColor: 'var(--color-muted, #27272a)', color: '#fff', borderRadius: '12px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="purchased" name="Purchased" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Spent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
}
