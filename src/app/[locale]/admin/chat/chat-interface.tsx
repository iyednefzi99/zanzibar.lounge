"use client";

import { useEffect, useRef, useState } from "react";

import { sendMessageAction, closeAction } from "./actions";

type Conversation = {
  id: string;
  guestName: string | null;
  guestPhone: string;
  channel: string;
  locale: string;
  lastMessageAt: Date;
  unread: number;
  lastMessage: string;
};

type Message = {
  id: string;
  role: "GUEST" | "AGENT" | "STAFF";
  body: string;
  createdAt: Date;
};

type Props = {
  locale: string;
  initialConversations: Conversation[];
};

const ROLE_STYLES: Record<string, string> = {
  GUEST: "bg-deep/60 border-shell/12 text-shell",
  AGENT: "bg-lagoon/10 border-lagoon/30 text-lagoon",
  STAFF: "bg-brass/10 border-brass/30 text-brass",
};

const ROLE_LABELS: Record<string, string> = {
  GUEST: "Client",
  AGENT: "Agent",
  STAFF: "Staff",
};

const CHANNEL_LABELS: Record<string, string> = {
  WEB: "Web",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  PHONE: "Tél",
};

export function ChatInterface({ initialConversations }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les conversations au démarrage et toutes les 5s
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (!selectedId) return;

    const loadMessages = async () => {
      const res = await fetch(`/api/chat/conversations?id=${selectedId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Auto-scroll en bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !input.trim()) return;

    setLoading(true);
    const formData = new FormData();
    formData.set("conversationId", selectedId);
    formData.set("body", input.trim());

    await sendMessageAction(formData);
    setInput("");
    setLoading(false);

    // Recharger les messages
    const res = await fetch(`/api/chat/conversations?id=${selectedId}`);
    if (res.ok) {
      setMessages(await res.json());
    }
  }

  async function handleClose() {
    if (!selectedId) return;
    const formData = new FormData();
    formData.set("conversationId", selectedId);
    await closeAction(formData);
    setSelectedId(null);
    setMessages([]);
  }

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Liste des conversations */}
      <div className="space-y-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-shell-dim">
          Conversations ({conversations.length})
        </h2>

        {conversations.length === 0 ? (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucune conversation ouverte.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedId === conv.id
                      ? "border-brass bg-brass/10"
                      : "border-shell/10 hover:border-brass/50"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-shell">
                      {conv.guestName ?? conv.guestPhone}
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase text-shell-dim">
                      {CHANNEL_LABELS[conv.channel] ?? conv.channel}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-shell-dim">
                    {conv.lastMessage}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Zone de chat */}
      {selected ? (
        <div className="flex flex-col rounded-xl border border-shell/12 bg-deep/40">
          {/* En-tête */}
          <div className="flex items-center justify-between border-b border-shell/10 px-4 py-3">
            <div>
              <p className="text-sm text-shell">
                {selected.guestName ?? selected.guestPhone}
              </p>
              <p className="font-mono text-[0.6rem] text-shell-dim">
                {selected.guestPhone} · {CHANNEL_LABELS[selected.channel]}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-coral/40 px-3 py-1.5 text-xs text-coral transition-colors hover:bg-coral/10"
            >
              Fermer
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "50vh" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] rounded-xl border px-3 py-2 text-sm ${ROLE_STYLES[msg.role]}`}
              >
                <p className="font-mono text-[0.6rem] uppercase tracking-widest opacity-60">
                  {ROLE_LABELS[msg.role]}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire */}
          <form
            onSubmit={handleSend}
            className="flex gap-2 border-t border-shell/10 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrire un message…"
              className="flex-1 rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-sm text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-brass bg-brass px-5 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-40"
            >
              {loading ? "…" : "Envoyer"}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-shell/15 py-16">
          <p className="text-sm text-shell-dim">
            Sélectionnez une conversation.
          </p>
        </div>
      )}
    </div>
  );
}
