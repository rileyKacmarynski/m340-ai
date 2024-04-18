import { createClient } from '@supabase/supabase-js'
import { Database } from '../_lib/database.ts'
import { resolvePDFJS } from 'https://esm.sh/pdfjs-serverless'
import { Document } from 'https://esm.sh/@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from 'https://esm.sh/langchain/text_splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from 'https://esm.sh/@langchain/community@0.0.34/vectorstores/supabase'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabasePrivateKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

Deno.serve(async (req) => {
  if (!supabaseUrl || !supabasePrivateKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variables.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return new Response(JSON.stringify({ error: `No authorization header passed` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient<Database>(supabaseUrl, supabasePrivateKey, {
    global: {
      headers: {
        authorization,
      },
    },
    auth: {
      persistSession: false,
    },
  })

  const { document_id } = await req.json()

  const { data: document } = await supabase
    .from('documents_with_storage_path')
    .select()
    .eq('id', document_id)
    .single()

  if (!document?.storage_object_path) {
    return new Response(JSON.stringify({ error: 'Failed to find uploaded document' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: file } = await supabase.storage
    .from('files')
    .download(document.storage_object_path)

  if (!file) {
    return new Response(JSON.stringify({ error: 'Failed to download storage object' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await file.arrayBuffer()

  const { getDocument } = await resolvePDFJS()
  const doc = await getDocument({
    data,
    useSystemFonts: true,
  }).promise

  let text = ''
  // Iterate through each page and fetch the text content
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const textContent = await page.getTextContent()
    const contents = textContent.items.map((item) => item.str).join(' ')
    text = text.concat(' ', contents)
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 300,
    chunkOverlap: 0,
  })

  const splitDocs = await textSplitter.splitDocuments([
    new Document({
      pageContent: text,
      metadata: { document_id: document.id, user_id: document.created_by },
    }),
  ])

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey,
    modelName: 'text-embedding-3-small',
  })

  // addDocuments has some nice batching logic
  // so as long as I don't run into this function timing out
  // I'm just going to use langchain here.
  // If I run into issues I'll have to seperate
  // process and embedding like in the example
  const store = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: 'document_sections',
    queryName: 'match_document_sections',
  })

  await store.addDocuments(splitDocs)

  return new Response(null, {
    status: 204,
    headers: { 'Content-Type': 'application/json' },
  })
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
