export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker required' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

    const response = await fetch(url);
    const data = await response.json();

    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    // chartPreviousClose is the previous trading day's close — exactly what we need
    const previousClose = meta?.chartPreviousClose ?? meta?.previousClose ?? null;

    if (!price) throw new Error('No price');

    res.setHeader('Cache-Control', 's-maxage=60');
    return res.json({ price, previousClose });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch price' });
  }
}
