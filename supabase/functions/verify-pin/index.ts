import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { pin } = await req.json()
  const correct = pin === Deno.env.get('ADMIN_PIN')

  return new Response(JSON.stringify({ success: correct }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  })
})