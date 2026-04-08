export default async function handler(req, res) {
  const { ticker, range = '1y' } = req.query;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`;

    const response = await fetch(url);
    const data = await response.json();

    const result = data?.chart?.result?.[0];

    if (!result) throw new Error('No data');

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const series = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: closes[i]
    })).filter(x => x.price != null);

    res.setHeader('Cache-Control', 's-maxage=300'); // 5 min cache
    return res.json(series);

  } catch (err) {
    // 🔁 fallback
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}