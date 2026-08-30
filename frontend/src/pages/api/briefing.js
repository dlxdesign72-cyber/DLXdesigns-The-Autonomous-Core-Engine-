import { supabaseAdmin } from '../../../../backend/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const { data: latest } = await supabaseAdmin
      .from('qualification_decisions')
      .select('prospect_id,score,tier,approved,reason,created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: sampleLeads } = await supabaseAdmin
      .from('prospects')
      .select('full_name,phone_number,email,product_interest')
      .order('created_at', { ascending: false })
      .limit(6);

    res.status(200).json({ latest: latest?.[0] || null, sampleLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
