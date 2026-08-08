'use client';

import React from 'react';
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
  ResponsiveContainer,
} from 'recharts';

export function LineChartComponent({ data, dataKey, series = [], height = 300 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey={dataKey} stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
          <Legend />
          {series.map((s, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={s.key}
              stroke={s.color || '#22d3ee'}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartComponent({ data, dataKey, series = [], height = 300 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey={dataKey} stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
          <Legend />
          {series.map((s, idx) => (
            <Bar key={idx} dataKey={s.key} fill={s.color || '#22d3ee'} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
