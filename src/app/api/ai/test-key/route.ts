import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    // Test the API key with a minimal request
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Make a simple request to validate the key
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5,
    });

    if (completion && completion.choices && completion.choices.length > 0) {
      return NextResponse.json({ valid: true, message: 'API key is valid' });
    } else {
      return NextResponse.json(
        { error: 'Invalid response from OpenAI' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error testing OpenAI API key:', error);
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key - authentication failed' },
        { status: 401 }
      );
    } else if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded - API key may be valid but quota exceeded' },
        { status: 429 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to validate API key' },
        { status: 500 }
      );
    }
  }
}
