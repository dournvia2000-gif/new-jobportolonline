export async function GET(request: Request) {
  try {
    // TODO: perform email cron work here
    return new Response(JSON.stringify({ ok: true, message: 'email every-minute cron triggered' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
