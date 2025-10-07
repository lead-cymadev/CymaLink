'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftEllipsisIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const GREETING: ChatMessage = {
  role: 'assistant',
  content:
    'Hola, soy CymaLink Assist. Puedo orientarte sobre el panel, explicar funcionalidades y guiarte paso a paso. ¿En qué te ayudo hoy?',
};

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const trimmedInput = input.trim();
  const availableHistory = useMemo(() => messages.slice(-6), [messages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const sendMessage = useCallback(async () => {
    if (!trimmedInput || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedInput, history: availableHistory }),
      });

      const raw = await response.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch (parseErr) {
          console.error('assistant widget parse error:', parseErr, raw);
          data = {};
        }
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'El asistente no pudo responder.');
      }

      const assistantReply: ChatMessage = {
        role: 'assistant',
        content: data.reply || 'Estoy aquí para ayudarte. ¿En qué más puedo asistirte?',
      };

      setMessages((prev) => [...prev, assistantReply]);
    } catch (err: any) {
      console.error('assistant widget error:', err);
      setError(err?.message ?? 'Hubo un problema al conectar con el asistente.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Lo siento, no pude procesar la solicitud en este momento. Intenta nuevamente en unos segundos.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [availableHistory, trimmedInput, loading]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      sendMessage();
    },
    [sendMessage],
  );

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[999] flex flex-col items-end space-y-3">
      {isOpen && (
        <div className="pointer-events-auto w-80 max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-600">CymaLink</p>
              <h4 className="text-base font-semibold text-blue-900">Asistente virtual</h4>
              <p className="text-xs text-slate-500">Guía rápida y consejos en tiempo real</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar asistente"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}-${msg.content.slice(0, 12)}`}
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'assistant'
                    ? 'bg-blue-50 text-blue-900 border border-blue-100'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900 shadow-sm">
                Pensando...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 px-4 py-3">
            <div className="relative flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escribe tu pregunta"
                className="max-h-32 min-h-[48px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-500 focus:outline-none"
                rows={2}
                disabled={loading}
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={loading || !trimmedInput}
                aria-label="Enviar mensaje"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-900 text-white shadow-xl shadow-blue-900/25 transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
