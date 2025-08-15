// /api/candle.js
export default async function handler(request, response) {
  const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
  const symbol = searchParams.get('symbol');
  const resolution = searchParams.get('resolution');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  if (!symbol || !resolution || !from || !to) {
    return response.status(400).json({ error: 'Missing required parameters: symbol, resolution, from, to' });
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API Key not configured on server' });
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
    const apiResponse = await fetch(url);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Finnhub API Error: ${apiResponse.status} ${errorText}`);
    }
    const data = await apiResponse.json();
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate');

    return response.status(200).json(data);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
