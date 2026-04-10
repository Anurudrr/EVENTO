import React, { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types';
import { formatRelativeDate, getErrorMessage } from '../utils';

interface ChatPanelProps {
  bookingId: string;
  title: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ bookingId, title }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await chatService.getBookingMessages(bookingId);
      setMessages(data);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to load chat'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
    const intervalId = window.setInterval(() => {
      void chatService.getBookingMessages(bookingId).then(setMessages).catch(() => {});
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [bookingId]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!text.trim()) return;

    setSending(true);
    try {
      const message = await chatService.sendBookingMessage(bookingId, text.trim());
      setMessages((current) => [...current, message]);
      setText('');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to send message'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="border border-noir-border bg-noir-card p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Chat</p>
        <h3 className="mt-2 text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">{title}</h3>
      </div>

      <div className="h-72 space-y-3 overflow-y-auto border border-noir-border bg-noir-bg p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-noir-accent" />
          </div>
        ) : messages.length > 0 ? messages.map((message) => {
          const isMine = typeof message.sender === 'object' && message.sender._id === user?._id;

          return (
            <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] border px-4 py-3 ${isMine ? 'border-noir-accent bg-noir-accent text-noir-bg' : 'border-noir-border bg-white text-noir-ink'}`}>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] opacity-70">
                  {typeof message.sender === 'object' ? message.sender.name : 'User'}
                </p>
                <p className="mt-2 text-sm uppercase tracking-wide">{message.text}</p>
                <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] opacity-70">
                  {formatRelativeDate(message.createdAt)}
                </p>
              </div>
            </div>
          );
        }) : (
          <div className="flex h-full items-center justify-center text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
            No messages yet. Start the conversation.
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a message"
          rows={2}
          className="min-h-[4rem] flex-1 border border-noir-border bg-noir-bg px-4 py-3 text-sm uppercase tracking-wide text-noir-ink focus:border-noir-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="btn-noir !rounded-none !px-5 !py-4"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
};
