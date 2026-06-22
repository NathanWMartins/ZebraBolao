// Este endpoint foi removido. O sync de stats agora é feito pelo /api/sync-matches.
export async function GET() {
  return new Response('Moved to /api/sync-matches', { status: 410 })
}
