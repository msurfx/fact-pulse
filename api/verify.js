module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { claim } = req.body || {};
  if (!claim || typeof claim !== 'string') {
    res.status(400).json({ error: 'Missing claim' });
    return;
  }

  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;

  if (!TAVILY_API_KEY || !NEBIUS_API_KEY) {
    res.status(500).json({
      error: 'Server is missing API keys. Set TAVILY_API_KEY and NEBIUS_API_KEY in your Vercel project\'s Environment Variables, then redeploy.'
    });
    return;
  }

  try {
    // 1. Search live sources with Tavily
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: claim,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: false
      })
    });

    if (!searchRes.ok) {
      const t = await searchRes.text();
      res.status(502).json({ error: `Tavily search failed (${searchRes.status}): ${t.slice(0, 200)}` });
      return;
    }

    const searchData = await searchRes.json();
    const sources = (searchData.results || []).slice(0, 5);

    if (sources.length === 0) {
      res.status(200).json({ error: 'Tavily returned no sources for this claim. Try rephrasing it.' });
      return;
    }

    // 2. Ask the NVIDIA model on Nebius Token Factory to weigh the evidence
    const sourcesBlock = sources.map((s, i) =>
      `EXHIBIT ${i + 1} — ${s.title} (${s.url})\n${(s.content || '').slice(0, 600)}`
    ).join('\n\n');

    const systemPrompt =
      'You are a careful fact-checker. You will be given a claim and a set of web search results (exhibits). ' +
      'Assess whether the claim is supported, contradicted, or only partially/mixed supported by the exhibits. ' +
      'Respond with ONLY a raw JSON object, no markdown fences, no commentary outside the JSON, in exactly this shape: ' +
      '{"verdict":"verified"|"false"|"mixed","confidence":"low"|"medium"|"high","explanation":"2-3 sentence explanation citing exhibit numbers like (Exhibit 2)"}';

    const userPrompt = `CLAIM:\n${claim}\n\nEXHIBITS:\n${sourcesBlock}`;

    const modelRes = await fetch('https://api.tokenfactory.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NEBIUS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b',
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!modelRes.ok) {
      const t = await modelRes.text();
      res.status(502).json({ error: `Nebius model call failed (${modelRes.status}): ${t.slice(0, 200)}` });
      return;
    }

    const modelData = await modelRes.json();
    const msg = modelData.choices && modelData.choices[0] && modelData.choices[0].message;
    let raw = (msg && msg.content) || (msg && msg.reasoning_content) || '';
    raw = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last !== -1) raw = raw.slice(first, last + 1);

    let verdict;
    try {
      verdict = JSON.parse(raw);
    } catch (e) {
      res.status(502).json({ error: `Could not parse model response as JSON: ${raw.slice(0, 200)}` });
      return;
    }

    res.status(200).json({ verdict, sources });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
};
