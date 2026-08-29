import React from 'react';

export default function BriefingCard({ briefing, leads = [] }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <h3 className="text-lg font-semibold">Morning Briefing</h3>
      <pre className="whitespace-pre-wrap mt-2 text-sm">{briefing || 'No briefing yet'}</pre>
      <h4 className="mt-4 font-medium">Proof of Performance</h4>
      <div className="mt-2">
        {leads.length === 0 && <div className="text-sm text-gray-500">No verified leads yet</div>}
        {leads.map((l) => (
          <div key={l.phone_number || l.email} className="border rounded p-2 my-2">
            <div className="text-sm font-semibold">{l.full_name || '(no name)'}</div>
            <div className="text-xs text-gray-600">{l.phone_number || l.email}</div>
            <div className="text-xs">Intent: {l.intent_score}</div>
            <div className="text-xs">Source: {l.source_platform}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
