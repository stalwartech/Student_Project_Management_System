import { useEffect, useRef, useState, type FormEvent } from "react";
import { messageApi } from "@/api/misc";
import { projectApi } from "@/api/projects";
import { useAuth } from "@/context/AuthContext";
import type { Message, Project } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/utils/format";

interface Contact {
  _id: string;
  name: string;
  matric?: string;
}

export function MessagesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // A supervisor's messageable contacts are the students on their own
  // assigned projects - this avoids calling the coordinator-only
  // student-search endpoints, which a supervisor token can't access.
  useEffect(() => {
    projectApi.assigned().then((res) => setProjects(res.data.data));
  }, []);

  const openConversation = async (contact: Contact) => {
    setActiveContact(contact);
    const res = await messageApi.privateThread(contact._id);
    setThread(res.data.data);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeContact || !draft.trim()) return;
    setSending(true);
    try {
      const res = await messageApi.send({ chatType: "Private", recipient: activeContact._id, content: draft });
      setThread((prev) => [...prev, res.data.data]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Messages" description="Direct messages with your students" />

      <div className="card grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-3">
        <div className="overflow-y-auto border-r border-gray-100 p-3">
          {projects.length === 0 && <p className="mt-6 text-center text-xs text-gray-400">No assigned projects yet.</p>}
          {projects.map((p) => (
            <div key={p._id} className="mb-3">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{p.title}</p>
              {p.students.length === 0 ? (
                <p className="px-2 text-xs text-gray-400">No students yet</p>
              ) : (
                p.students.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => openConversation({ _id: s._id, name: s.name, matric: s.matric })}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50 ${
                      activeContact?._id === s._id ? "bg-brand-50" : ""
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {s.name[0]?.toUpperCase()}
                    </span>
                    <span>{s.name}</span>
                  </button>
                ))
              )}
            </div>
          ))}
        </div>

        <div className="col-span-2 flex flex-col">
          {!activeContact ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Select a student to start messaging
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{activeContact.name}</p>
                {activeContact.matric && <p className="text-xs text-gray-400">{activeContact.matric}</p>}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {thread.map((m) => {
                  const isMine = typeof m.sender === "string" ? m.sender === user?._id : m.sender._id === user?._id;
                  return (
                    <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                        <p>{m.content}</p>
                        <p className={`mt-1 text-[10px] ${isMine ? "text-brand-100" : "text-gray-400"}`}>{formatDateTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-3">
                <input className="input" placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} />
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
