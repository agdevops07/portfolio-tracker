export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker required' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

    const response = await fetch(url);
    const data = await response.json();

    const price =
      data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (!price) throw new Error('No price');

    res.setHeader('Cache-Control', 's-maxage=60'); // 1 min cache
    return res.json({ price });

  } catch (err) {
    // 🔁 fallback
    return res.status(500).json({ error: 'Failed to fetch price' });
  }
}