import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../services/chatbot.service';

type ChatRole = 'user' | 'assistant';
type ChatStatus = 'streaming' | 'error';

interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  status?: ChatStatus;
}

@Component({
  selector: 'app-chatbox',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss']
})
export class ChatboxComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  isOpen = false;
  isSending = false;
  inputValue = '';
  messages: ChatMessage[] = [
    {
      id: 1,
      role: 'assistant',
      content: 'Xin chào! Tôi có thể tư vấn sản phẩm và gợi ý lựa chọn phù hợp cho bạn.'
    }
  ];

  private nextMessageId = 2;
  private shouldScroll = false;
  private abortController?: AbortController;

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.abortController?.abort();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.queueScroll();
  }

  clearConversation(): void {
    if (this.isSending) {
      this.stopStreaming();
    }

    this.messages = [
      {
        id: this.nextMessageId++,
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Bạn muốn tìm sản phẩm nào?'
      }
    ];
    this.queueScroll();
  }

  stopStreaming(): void {
    this.abortController?.abort();
  }

  handleComposerKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) {
      return;
    }

    keyboardEvent.preventDefault();
    void this.sendMessage();
  }

  async sendMessage(): Promise<void> {
    const question = this.inputValue.trim();
    if (!question || this.isSending) {
      return;
    }

    this.inputValue = '';
    this.isSending = true;

    this.messages = [
      ...this.messages,
      { id: this.nextMessageId++, role: 'user', content: question },
      { id: this.nextMessageId++, role: 'assistant', content: '', status: 'streaming' }
    ];
    const assistantMessage = this.messages[this.messages.length - 1];
    this.queueScroll();

    this.abortController = new AbortController();

    try {
      await this.chatbotService.askStream(
        question,
        (chunk: string) => {
          assistantMessage.content += chunk;
          this.queueScroll();
          this.changeDetectorRef.detectChanges();
        },
        this.abortController.signal
      );

      if (!assistantMessage.content.trim()) {
        assistantMessage.content = 'Tôi chưa nhận được phản hồi. Bạn vui lòng thử lại.';
      }
      assistantMessage.status = undefined;
    } catch (error: unknown) {
      if (this.isAbortError(error)) {
        assistantMessage.content = assistantMessage.content || 'Đã dừng phản hồi.';
        assistantMessage.status = undefined;
      } else {
        assistantMessage.content = 'Không thể kết nối chatbot lúc này. Bạn vui lòng thử lại sau.';
        assistantMessage.status = 'error';
      }
    } finally {
      this.isSending = false;
      this.abortController = undefined;
      this.queueScroll();
      this.changeDetectorRef.detectChanges();
    }
  }

  private isAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
  }

  private queueScroll(): void {
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    const element = this.messageList?.nativeElement;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }
}
