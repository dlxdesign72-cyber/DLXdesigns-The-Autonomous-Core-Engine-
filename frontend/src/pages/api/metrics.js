import { supabaseAdmin } from '../../../../backend/supabaseAdmin.js';

// This API endpoint is ran server-side to query Supabase using service role key
export default async function handler(req, res) {
  try {
    // basic metrics
    const { count: newLeadsCount } = await supabaseAdmin
      .from('prospects')
      .select('id', { head: true, count: 'exact' })
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: intentBuyers } = await supabaseAdmin
      .from('evidence')
      .select('id, prospect_id, raw_signal')
      .filter('raw_signal->intent_score', 'gte', '7');

    const { data: sales } = await supabaseAdmin
      .from('sales_opportunities')
      .select('id')
      .is('revenue_realized', null);

    // sample leads for proof-of-performance
    const { data: sampleLeads } = await supabaseAdmin
      .from('prospects')
      .select('full_name,phone_number,email,product_interest,normalized_phone')
      .order('created_at', { ascending: false })
      .limit(6);

    const newLeads = newLeadsCount || 0;
    const intentBuyersCount = (intentBuyers || []).length;
    const conversionRate = (sales?.length || 0) === 0 ? 0 : Math.round(((sales.length / Math.max(1, newLeads)) * 100) * 100) / 100;
    const revenueOpportunities = 0; // conservative: compute from sales_opportunities when available

    res.status(200).json({ newLeads, intentBuyers: intentBuyersCount, conversionRate: `${conversionRate}%`, revenueOpportunities: `NGN ${revenueOpportunities}`, sampleLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
