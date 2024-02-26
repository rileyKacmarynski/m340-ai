// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { ChatOpenAI } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js'

const chatModel = new ChatOpenAI({
  openAIApiKey: Deno.env.get('OPENAI_API_KEY')
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

const responseHeaders = { 
  "Content-Type": "application/json",
  ...corsHeaders 
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if(!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing Environment variables'
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    )
  }

  const authorization = req.headers.get('Authorization')
  if(!authorization) {
    return new Response(
      JSON.stringify({ error: 'No authorization header'}), {
        status: 500,
        headers: responseHeaders,
      }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization,
      }
    },
    auth: {
      persistentSession: false,
    },
  })

  const { value, messages } = await req.json()
  const data = {
    message: `Hello ${value}!`,
  }

  console.log(messages);

  return new Response(
    JSON.stringify(data),
    { headers: responseHeaders },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/chat' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
