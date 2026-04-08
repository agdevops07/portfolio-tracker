export default async function handler(req, res) {
  const { ticker, upstox_ticker, range = '1y' } = req.query;

  try {
    let series = [];

    // 🟣 CASE 1: Use Upstox if available
    if (upstox_ticker) {

      const today = new Date().toISOString().split('T')[0];

      const url = `https://api.upstox.com/v2/historical-candle/NSE_EQ|${upstox_ticker}/day/${today}/2024-01-01`;

      /*
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.UPSTOX_TOKEN}`
        }
      }); */
    

      const response = await fetch(url);

      const data = await response.json();


      const candles = data?.data?.candles || [];

      // ✅ Transform format
      series = candles.map(c => ({
        date: c[0].split('T')[0],
        price: c[4] // close price
      }));

      // Upstox gives latest first → reverse
      series.reverse();
    }

    // 🔵 CASE 2: Fallback to Yahoo
    if (!series.length) {
  
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`;

      const response = await fetch(url);
      const data = await response.json();

      const result = data?.chart?.result?.[0];

      const timestamps = result?.timestamp || [];
      const closes = result?.indicators?.quote?.[0]?.close || [];

      series = timestamps.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: closes[i]
      })).filter(x => x.price != null);
    }

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.json(series);

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}