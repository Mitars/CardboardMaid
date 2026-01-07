export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the endpoint and all query parameters
  const { endpoint, ...queryParams } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  // Construct BGG API URL
  // The endpoint parameter contains the path (e.g., "collection")
  // All other query parameters should be passed to BGG
  let url = `https://boardgamegeek.com/xmlapi2/${endpoint}`;

  // Build query string from all other parameters
  const queryString = new URLSearchParams(queryParams).toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  console.log('BGG Proxy URL:', url); // Debug logging

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.BGG_API_TOKEN}`,
      },
    });

    const data = await response.text();

    console.log('BGG Response Status:', response.status); // Debug logging

    // Forward the status code and content type
    res.status(response.status);
    res.setHeader('Content-Type', 'application/xml');
    res.send(data);
  } catch (error) {
    console.error('BGG API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from BGG API' });
  }
}
