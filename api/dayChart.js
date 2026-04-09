export default async function handler(req, res) {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Ticker required' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=5m&range=1d`;
    const response = await fetch(url);
    const data = await response.json();

    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};

    const series = timestamps.map((ts, i) => ({
      time: new Date(ts * 1000).toISOString(),
      price: closes[i],
    })).filter(x => x.price != null);

    const prevClose = meta.chartPreviousClose || meta.previousClose || null;

    res.setHeader('Cache-Control', 's-maxage=60');
    return res.json({ series, prevClose });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch intraday data' });
  }
}
