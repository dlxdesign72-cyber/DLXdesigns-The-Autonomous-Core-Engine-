import React from 'react';
import useSWR from 'swr';
import MetricsCard from '../components/MetricsCard';
import BriefingCard from '../components/BriefingCard';
import { supabase } from '../lib/supabaseClient';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Home() {
  const { data: metrics } = useSWR('/api/metrics', fetcher, { refreshInterval: 15000 });
  const { data: briefing } = useSWR('/api/briefing', fetcher, { refreshInterval: 60000 });

  const leads = metrics?.sampleLeads || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">DLX OS — Executive Dashboard</h1>
          <p className="text-sm text-gray-600">Live metrics and Morning Briefing</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <MetricsCard title="New Leads (24h)" value={metrics?.newLeads ?? '...'} />
          <MetricsCard title="Intent Buyers" value={metrics?.intentBuyers ?? '...'} />
          <MetricsCard title="Conversion Rate" value={metrics?.conversionRate ?? '...'} />
          <MetricsCard title="Revenue Opportunities" value={metrics?.revenueOpportunities ?? '...'} />
        </section>

        <section className="mb-6">
          <BriefingCard briefing={briefing?.latest?.market_trend_summary} leads={leads} />
        </section>
      </div>
    </div>
  );
}
