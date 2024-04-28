import { Database } from "@/supabase/types"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { OpenAIEmbeddings } from "@langchain/openai"
import { createClient } from "@supabase/supabase-js"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

setInterval(async () => {
  await processDocuments() 
}, 2000)

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePrivateKey = process.env.SUPABASE_SERVICE_KEY
const openAIApiKey = process.env.OPENAI_API_KEY

const supabase = createClient<Database>(supabaseUrl!, supabasePrivateKey!)

async function processDocuments() {
  const { data } = await supabase
    .from('documents')
    .select('id')
    .eq('status', 'initial')

    if (data) {
      await Promise.allSettled(data.map(d => processDocument(d.id)))
    }
}

async function processDocument(document_id: number) {
  console.log('processing doc', document_id)

  await supabase
    .from('documents')
    .update({ status: 'processing' })
    .eq('id', document_id)

  const { data: document } = await supabase
    .from('documents_with_storage_path')
    .select()
    .eq('id', document_id)
    .single()

  console.info(document)


  if (!document?.storage_object_path) {
    throw new Error(`no storage path for document: ${document_id}`)
  }

  const { data: file } = await supabase.storage
    .from('files')
    .download(document.storage_object_path)
    // .createSignedUrl(document.storage_object_path, 60)


    if(!file) {
      throw new Error('unable to get signed url for document')
    }

    const loader = new PDFLoader(file, {
      splitPages: false
    })
    const docs = await loader.load()
    docs.forEach(d => d.metadata = { document_id: document.id, user_id: document.created_by })


  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 300,
    chunkOverlap: 0,
  })

  console.log('splitting doc')

  const splitDocs = await textSplitter.splitDocuments(docs)

  console.log('saving doc')

  const res = await supabase.from('document_sections').insert(
    splitDocs.map(d => ({
      content: d.pageContent,
      metadata: d.metadata,
    }))
  )

  console.log('doc saved', res)

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey,
    modelName: 'text-embedding-3-small',
  })

  const store = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: 'document_sections',
    queryName: 'match_document_sections',
  })

  console.log('adding docs')
  store.addDocuments(splitDocs)

  console.log('finishing up')
  await supabase
    .from('documents')
    .update({
      status: 'finished'      
    })
    .eq('id', document_id)
}

// console.log('trying to process this guy')
// processDocument(2)