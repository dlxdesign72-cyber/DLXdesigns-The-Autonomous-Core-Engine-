import React from 'react';

export default function MetricsCard({ title, value, delta }) {
  return (
    <div className="bg-white shadow rounded p-4 w-full">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {delta && <div className="text-xs text-green-600">{delta}</div>}
    </div>
  );
}
