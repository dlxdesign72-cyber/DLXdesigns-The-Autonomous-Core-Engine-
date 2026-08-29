import { supabaseAdmin } from '../../../../backend/supabaseClient.js';

// This API endpoint is ran server-side to query Supabase using service role key
export default async function handler(req, res) {
  try {
    // basic metrics
    const { count: newLeadsCount } = await supabaseAdmin
      .from('dlx_verified_leads')
      .select('id', { head: true, count: 'exact' })
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: intentBuyers } = await supabaseAdmin
      .from('dlx_verified_leads')
      .select('id')
      .gte('intent_score', 7);

    const { data: sales } = await supabaseAdmin
      .from('dlx_verified_leads')
      .select('id')
      .eq('lead_status', 'converted');

    // sample leads for proof-of-performance
    const { data: sampleLeads } = await supabaseAdmin
      .from('dlx_verified_leads')
      .select('full_name,phone_number,email,intent_score,source_platform')
      .order('created_at', { ascending: false })
      .limit(6);

    const newLeads = newLeadsCount || 0;
    const intentBuyersCount = (intentBuyers || []).length;
    const conversionRate = (sales?.length || 0) === 0 ? 0 : Math.round(((sales.length / Math.max(1, newLeads)) * 100) * 100) / 100;
    // rough revenue opportunities: sum of intent_score * 100 (very naive)
    const revenueOpportunities = (intentBuyers || []).reduce((s, _, i) => s + 100, 0);

    res.status(200).json({ newLeads, intentBuyers: intentBuyersCount, conversionRate: `${conversionRate}%`, revenueOpportunities: `NGN ${revenueOpportunities}`, sampleLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
