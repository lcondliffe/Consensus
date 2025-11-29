import { NextRequest } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface CommitteeRequest {
  prompt: string;
  models: string[];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: CommitteeRequest = await request.json();
    const { prompt, models } = body;

    if (!prompt || !models || models.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Prompt and at least 2 models required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a TransformStream to merge all model responses
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Query all models in parallel (FR-002)
    const modelPromises = models.map(async (modelId) => {
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'LLM Committee',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                modelId,
                error: `API error: ${response.status} - ${errorText}`,
                done: true,
              })}\n\n`
            )
          );
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                modelId,
                error: 'No response body',
                done: true,
              })}\n\n`
            )
          );
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ modelId, content: '', done: true })}\n\n`
                )
              );
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                await writer.write(
                  encoder.encode(
                    `data: ${JSON.stringify({ modelId, content, done: false })}\n\n`
                  )
                );
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ modelId, error: message, done: true })}\n\n`
          )
        );
      }
    });

    // Wait for all models to complete, then close the stream
    Promise.all(modelPromises)
      .then(() => writer.close())
      .catch(() => writer.close());

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
