// /api/intraday?ticker=RELIANCE.NS
// Returns today's intraday price ticks (5-minute interval)
export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker required' });
  }

  try {
    // interval=5m&range=1d gives intraday 5-min candles for today
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=5m&range=1d`;

    const response = await fetch(url);
    const data = await response.json();

    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const meta = result?.meta || {};

    const series = timestamps
      .map((ts, i) => ({
        time: new Date(ts * 1000).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        ts,
        price: closes[i],
      }))
      .filter((x) => x.price != null);

    const previousClose = meta?.chartPreviousClose ?? meta?.previousClose ?? null;

    res.setHeader('Cache-Control', 's-maxage=60');
    return res.json({ series, previousClose });

  } catch (err) {
    console.error('intraday error:', err);
    return res.status(500).json({ error: 'Failed to fetch intraday data' });
  }
}
