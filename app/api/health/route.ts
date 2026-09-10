export async function GET() {
  return Response.json({ success: true, message: 'BitGains API running', timestamp: new Date().toISOString() });
}
