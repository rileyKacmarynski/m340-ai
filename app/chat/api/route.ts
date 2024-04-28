import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { codeBlock } from 'common-tags'
import { formatDocumentsAsString } from 'langchain/util/document'
import { StringOutputParser, BytesOutputParser } from "@langchain/core/output_parsers"
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables"
import { PromptTemplate } from "@langchain/core/prompts"
import { StreamingTextResponse } from "ai"

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY
const openAIApiKey = process.env.OPENAI_API_KEY

const responseHeaders = {
  'Content-Type': 'application/json',
}

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing Environment variables',
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    )
  }

  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      status: 500,
      headers: responseHeaders,
    })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization,
      },
    },
    auth: {
      persistSession: false,
    },
  })

  const body = await req.json()

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey,
    modelName: 'text-embedding-3-small',
  })

  const model = new ChatOpenAI({
    openAIApiKey,
    // modelName: 'gpt-3.5-turbo',
    streaming: true,
  })

  const store = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: 'document_sections',
    queryName: 'match_document_sections',
  })

  const retriever = store.asRetriever(5, { document_id: body.documentId })

  const condenseQuestionTemplate = codeBlock`
      Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.
      Chat History:
      {chat_history}
      Follow Up Input: {question}
      Standalone question:
    `
  const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(condenseQuestionTemplate)

  const answerTemplate = codeBlock`
    Answer the question based only on the following context:
    {context}

    Question: {question}
  `
  const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate)

  const formatChatHistory = (chatHistory: [string, string][]) => {
    const formattedDialogueTurns = chatHistory.map(
      (dialogueTurn) => `Human: ${dialogueTurn[0]}\nAssistant: ${dialogueTurn[1]}`
    )
    return formattedDialogueTurns.join('\n')
  }

  type ConversationalRetrievalQAChainInput = {
    question: string
    chat_history: [string, string][]
  }

  // @ts-ignore
  const standaloneQuestionChain = RunnableSequence.from([
    {
      question: (input: ConversationalRetrievalQAChainInput) => input.question,
      chat_history: (input: ConversationalRetrievalQAChainInput) =>
        formatChatHistory(input.chat_history),
    },
    CONDENSE_QUESTION_PROMPT,
    model,
    new StringOutputParser(),
  ])

  const messages = body.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  // const latest = messages.at(-1)
  const latest = messages.pop()

  const answerChain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    ANSWER_PROMPT,
    model,
    new BytesOutputParser(),
  ])

  const conversationalRetrievalQAChain = standaloneQuestionChain.pipe(answerChain)

  const stream = await conversationalRetrievalQAChain.stream({
    // @ts-ignore
    question: latest?.content ?? '',
    // @ts-ignore
    chat_history: messages?.map((m) => m.content) ?? '',
  })

  return new StreamingTextResponse(stream, { headers: responseHeaders })
}
