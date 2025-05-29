// app/api/gastos/route.ts
export async function GET() {
    const url = process.env.GOOGLE_SHEET;
  
    if (!url) {
      return new Response("Missing GOOGLE_SHEET env var", { status: 500 });
    }
  
    try {
      const res = await fetch(url);
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return new Response("Error fetching data from Google Sheets", { status: 500 });
    }
  }
  
  export async function POST(req: Request) {
    const url = process.env.GOOGLE_SHEET;
  
    if (!url) {
      return new Response("Missing GOOGLE_SHEET env var", { status: 500 });
    }
  
    const body = await req.json();
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      return new Response("OK", { status: 200 });
    } catch (error) {
      return new Response("Error posting data to Google Sheets", { status: 500 });
    }
  }
  