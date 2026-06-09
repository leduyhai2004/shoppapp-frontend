import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly chatbotBaseUrl = environment.chatbotBaseUrl;

  async askStream(
    message: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch(`${this.chatbotBaseUrl}/ask/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({ message }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Chatbot request failed with status ${response.status}`);
    }

    if (!response.body) {
      onChunk(await response.text());
      return;
    }

    const reader = response.body.getReader();
    const contentType = response.headers.get('content-type') ?? '';
    const charset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim() || 'utf-8';
    const decoder = new TextDecoder(charset);
    const isSse = contentType.includes('text/event-stream');
    let sseBuffer = '';

    const emitSseEvents = (text: string, flush = false) => {
      sseBuffer += text;

      const events = sseBuffer.split(/\r?\n\r?\n/);
      sseBuffer = flush ? '' : events.pop() ?? '';

      for (const event of events) {
        this.emitSseEvent(event, onChunk);
      }

      if (flush && sseBuffer) {
        this.emitSseEvent(sseBuffer, onChunk);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      if (isSse) {
        emitSseEvents(chunk);
      } else {
        onChunk(chunk);
      }
    }

    const finalChunk = decoder.decode();
    if (isSse) {
      emitSseEvents(finalChunk, true);
    } else if (finalChunk) {
      onChunk(finalChunk);
    }
  }

  private emitSseEvent(event: string, onChunk: (chunk: string) => void): void {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => {
        const value = line.slice(5);
        return value.startsWith(' ') ? value.slice(1) : value;
      })
      .join('\n');

    if (data && data !== '[DONE]') {
      onChunk(data);
    }
  }
}
