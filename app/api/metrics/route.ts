export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("METRIC", body);
  } catch {
    console.log("METRIC_PARSE_ERROR");
  }
  return new Response(null, { status: 204 });
}
