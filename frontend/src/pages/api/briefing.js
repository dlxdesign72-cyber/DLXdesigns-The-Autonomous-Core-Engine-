import { supabaseAdmin } from '../../../../backend/supabaseClient.js';

export default async function handler(req, res) {
  try {
    const { data: latest } = await supabaseAdmin
      .from('dlx_oracle_logs')
      .select('market_trend_summary,competitor_analysis,actionable_recommendation,created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: sampleLeads } = await supabaseAdmin
      .from('dlx_verified_leads')
      .select('full_name,phone_number,email,intent_score,source_platform')
      .order('created_at', { ascending: false })
      .limit(6);

    res.status(200).json({ latest: latest?.[0] || null, sampleLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
