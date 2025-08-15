// /api/quote.js
export default async function handler(request, response) {
  // 設置 CORS headers，確保無論成功或失敗都會發送
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理瀏覽器的 OPTIONS 預檢請求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return response.status(400).json({ error: 'Symbol parameter is required' });
    }

    const apiKey = process.env.FINNHUB_API_KEY;

    // **關鍵除錯點 1: 檢查 API Key 是否存在**
    if (!apiKey) {
      console.error("FINNHUB_API_KEY environment variable is not set!");
      return response.status(500).json({ error: 'Server configuration error: API Key is missing.' });
    }
    
    const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    
    // **關鍵除錯點 2: 打印出將要發送的 URL (隱藏 key 的一部分)**
    console.log(`Fetching from Finnhub: https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey.slice(0,4)}...`);

    const apiResponse = await fetch(finnhubUrl);

    // **關鍵除錯點 3: 檢查 Finnhub 的回應狀態**
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Finnhub API responded with status ${apiResponse.status}:`, errorText);
      return response.status(apiResponse.status).json({ 
        error: `Finnhub API error`,
        status: apiResponse.status,
        details: errorText 
      });
    }

    const data = await apiResponse.json();
    
    // 成功時快取 1 分鐘
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return response.status(200).json(data);

  } catch (error) {
    // **關鍵除錯點 4: 捕獲任何其他未知錯誤**
    console.error('An unexpected error occurred:', error);
    return response.status(500).json({ error: 'An unexpected internal server error occurred.', details: error.message });
  }
}
