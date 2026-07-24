import { useEffect, useRef, useState, type FormEvent } from "react";
import { messageApi } from "@/api/misc";
import { studentApi } from "@/api/students";
import { supervisorApi } from "@/api/supervisors";
import { useAuth } from "@/context/AuthContext";
import type { Message, User } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { TextField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/utils/format";

export function MessagesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Search across both students and supervisors by name, since the
  // coordinator might want to message either.
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const [studentsRes, supervisorsRes] = await Promise.all([
        studentApi.list({ search, limit: 5 }),
        supervisorApi.list({ search, limit: 5 }),
      ]);
      setResults([...studentsRes.data.data.students, ...supervisorsRes.data.data.supervisors]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const openConversation = async (u: User) => {
    setActiveUser(u);
    setSearch("");
    setResults([]);
    const res = await messageApi.privateThread(u._id);
    setThread(res.data.data);
    await Promise.all(res.data.data.filter((message) => {
      const senderId = typeof message.sender === "string" ? message.sender : message.sender._id;
      return senderId !== user?._id;
    }).map((message) => messageApi.markRead(message._id)));
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeUser || !draft.trim()) return;
    setSending(true);
    try {
      const res = await messageApi.send({ chatType: "Private", recipient: activeUser._id, content: draft });
      setThread((prev) => [...prev, res.data.data]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Messages" description="Direct messages with students and supervisors" />

      <div className="card grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-3">
        <div className="border-r border-gray-100 p-3">
          <TextField placeholder="Search students or supervisors…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="mt-2 space-y-1">
            {results.map((u) => (
              <button
                key={u._id}
                onClick={() => openConversation(u)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {u.name[0]?.toUpperCase()}
                </span>
                <span>
                  {u.name} <span className="text-xs text-gray-400 capitalize">({u.role})</span>
                </span>
              </button>
            ))}
          </div>
          {!activeUser && results.length === 0 && (
            <p className="mt-6 text-center text-xs text-gray-400">Search for someone to start a conversation.</p>
          )}
        </div>

        <div className="col-span-2 flex flex-col">
          {!activeUser ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Select a conversation or search for someone
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{activeUser.name}</p>
                <p className="text-xs capitalize text-gray-400">{activeUser.role}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {thread.map((m) => {
                  const isMine = typeof m.sender === "string" ? m.sender === user?._id : m.sender._id === user?._id;
                  return (
                    <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                          isMine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p>{m.content}</p>
                        <p className={`mt-1 text-[10px] ${isMine ? "text-brand-100" : "text-gray-400"}`}>
                          {formatDateTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-3">
                <input
                  className="input"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button type="submit" loading={sending} disabled={!draft.trim()}>
                  Send
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
