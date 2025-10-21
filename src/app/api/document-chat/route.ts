import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatRequest {
  message: string
  documentContext: {
    title: string
    content: string
    templateName: string
  }
  conversationHistory: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication from session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { message, documentContext, conversationHistory }: ChatRequest = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get AI response using available providers
    const response = await getDocumentAIResponse(message, documentContext, conversationHistory)

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Document Chat] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getDocumentAIResponse(
  message: string,
  documentContext: { title: string; content: string; templateName: string },
  conversationHistory: ChatMessage[]
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // Build conversation context
  const systemPrompt = `You are a professional document assistant helping create high-quality ${documentContext.templateName} documents.

Current Document:
Title: ${documentContext.title}
Template: ${documentContext.templateName}

Document Content:
${documentContext.content || '[Document is empty - help the user get started]'}

Your role is to:
1. Help improve and enhance the document with professional language
2. Add relevant compliance information (ISO 27001, SOC 2, RFP best practices, etc.)
3. Suggest sections and content based on the template type
4. Answer questions about compliance requirements
5. Provide specific, actionable advice

Be concise, professional, and focus on practical improvements. If suggesting changes, provide specific examples of what to add or modify.`

  // Try OpenAI first (GPT-4)
  if (openaiKey) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ]

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      }
    } catch (error) {
      console.error('[Document Chat] OpenAI error:', error)
    }
  }

  // Try Anthropic (Claude) as fallback
  if (anthropicKey) {
    try {
      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ]

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          system: systemPrompt,
          messages,
          max_tokens: 1000
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.content[0].text
      }
    } catch (error) {
      console.error('[Document Chat] Claude error:', error)
    }
  }

  // Fallback response if no AI providers available
  return `I can help you improve this ${documentContext.templateName}. Here are some suggestions:

1. **Add Professional Language**: Ensure all sections use formal, compliance-appropriate terminology
2. **Complete All Sections**: Review the template structure and fill in any missing sections
3. **Add Evidence**: Include specific examples, controls, or certifications where applicable
4. **Review Format**: Ensure consistent formatting and clear section headers

To get AI-powered assistance, please configure an API key in /admin/ai-providers.

What specific aspect of the document would you like help with?`
}
