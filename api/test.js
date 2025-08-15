// /api/test.js
export default function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.status(200).json({ 
    message: "Hello from the Vercel test API!",
    timestamp: new Date().toISOString() 
  });
}
