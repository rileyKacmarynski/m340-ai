// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { ChatOpenAI } from '@langchain/openai'
import { createClient } from '@supabase/supabase-js'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from 'https://esm.sh/@langchain/community@0.0.34/vectorstores/supabase'
import { PromptTemplate } from '@langchain/core/prompts'
import { formatDocumentsAsString } from 'https://esm.sh/langchain@0.1.25/util/document'
import { codeBlock } from 'common-tags'
import {
  RunnablePassthrough,
  RunnableSequence,
} from 'https://esm.sh/v135/@langchain/core@0.1.34/runnables'
import { StringOutputParser } from 'https://esm.sh/v135/@langchain/core@0.1.34/output_parsers'
import OpenAI from 'https://esm.sh/openai@4.28.4'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { BytesOutputParser } from 'https://esm.sh/v135/@langchain/core@0.1.34/output_parsers'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

const openai = new OpenAI({
  apiKey: openAIApiKey,
})

const responseHeaders = {
  'Content-Type': 'application/json',
  ...corsHeaders,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

  // const injectedDocs = await retriever.invoke(latest?.content?.toString() ?? '')
  // console.log('injected docs\n', injectedDocs)

  // const res = await conversationalRetrievalQAChain.invoke({
  //   question: latest?.content ?? '',
  //   chat_history: messages?.map((m) => m.content) ?? '',
  // })

  // console.log('response: ', res)

  const stream = await conversationalRetrievalQAChain.stream({
    question: latest?.content ?? '',
    chat_history: messages?.map((m) => m.content) ?? '',
  })

  return new StreamingTextResponse(stream, { headers: responseHeaders })
  // return new Response(JSON.stringify(stream), { headers: responseHeaders })

  // const result = await conversationalRetrievalQAChain.invoke({
  //   question: latest?.content ?? '',
  //   chat_history: messages?.map((m) => m.content) ?? '',
  // })

  // console.log('result', result)

  // console.log('did something happen?', shit)
  // const results = await store.similaritySearchVectorWithScore()
  //
  // console.log('results', results)

  // so this streams the content
  // for await (const chunk of stream) {
  //   console.log(`${chunk.content}|`);
  // }

  // const injectedDocs = await retriever.pipe(formatDocumentsAsString).invoke(latest?.content?.toString() ?? '')

  // // console.log('injected docs\n', injectedDocs)

  // console.log(injectedDocs.map(d => `${d.pageContent}\n`))

  //  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
  //   [
  //     {
  //       role: 'user',
  //       content: codeBlock`
  //       You're an AI assistant who answers questions about documents.

  //       You're a chat bot, so keep your replies succinct.

  //       You're only allowed to use the documents below to answer the question.

  //       If the question isn't related to these documents, say:
  //       "Sorry, I couldn't find any information on that."

  //       Do not go off topic.

  //       Documents:
  //       ${injectedDocs.map(d => `${d.pageContent}\n`)}
  //     `,
  //     },
  //     ...body.messages,
  //   ];

  // const completionStream = await openai.chat.completions.create({
  //   model: 'gpt-3.5-turbo-0613',
  //   messages: completionMessages,
  //   // max_tokens: 1024,
  //   temperature: 0,
  //   stream: true,
  // });

  // const stream = OpenAIStream(completionStream);
  // return new StreamingTextResponse(stream, { headers: responseHeaders });
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/chat' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
