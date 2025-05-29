export async function POST(req: Request) {
    const body = await req.json();
  
    const url = process.env.GOOGLE_SHEET;
  
    if (!url) {
      return new Response("Missing GOOGLE_SHEET env var", { status: 500 });
    }
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  
    return new Response("OK", { status: 200 });
  }
  