export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (request.method === 'OPTIONS') { return response.status(200).end(); }
  const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
  const [symbol, resolution, from, to] = [searchParams.get('symbol'), searchParams.get('resolution'), searchParams.get('from'), searchParams.get('to')];
  if (!symbol || !resolution || !from || !to) { return response.status(400).json({ error: 'Missing required parameters' }); }
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) { return response.status(500).json({ error: 'API Key not configured' }); }
  try {
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return response.status(apiResponse.status).json({ error: `Finnhub API Error: ${errorText}` });
    }
    const data = await apiResponse.json();
    response.setHeader('Cache-Control', 's-maxage=43200');
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
