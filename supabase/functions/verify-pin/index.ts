import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { pin } = await req.json()
  const correct = pin === Deno.env.get('ADMIN_PIN')

  return new Response(JSON.stringify({ success: correct }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  })
})