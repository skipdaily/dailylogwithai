import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy', speed = 1.0, apiKey } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 400 });
    }

    // Validate voice option
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      return NextResponse.json({ error: 'Invalid voice option' }, { status: 400 });
    }

    // Validate speed
    if (speed < 0.25 || speed > 4.0) {
      return NextResponse.json({ error: 'Speed must be between 0.25 and 4.0' }, { status: 400 });
    }

    console.log('🔊 Generating TTS for text:', text.substring(0, 100) + '...');

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'mp3'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS API error:', error);
      return NextResponse.json({ 
        error: `OpenAI TTS API error: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for transmission
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      audio: base64Audio,
      voice: voice,
      speed: speed,
      textLength: text.length
    });

  } catch (error: any) {
    console.error('TTS API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate speech: ' + error.message 
    }, { status: 500 });
  }
}
