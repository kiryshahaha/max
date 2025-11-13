export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    const parserUrl = process.env.PARSER_SERVICE_URL;
    const response = await fetch(`${parserUrl}/api/scrape/init-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return Response.json({ success: false, message: 'Parser service unavailable' }, { status: 500 });
    }

    const result = await response.json();
    return Response.json(result);
    
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}