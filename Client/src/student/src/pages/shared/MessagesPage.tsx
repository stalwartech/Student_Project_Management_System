import { useEffect, useRef, useState, type FormEvent } from "react";
import { messageApi } from "@/api/misc";
import { projectApi } from "@/api/projects";
import { useAuth } from "@/context/AuthContext";
import type { Message, Project } from "@/types";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/utils/format";

type Thread = "supervisor" | "group";

export function MessagesPage() {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState({ privateByUser: {} as Record<string, number>, groupByProject: {} as Record<string, number> });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    projectApi.myProject().then((res) => setProject(res.data.data)).catch(() => setProject(null));
  }, []);

  const loadUnread = () => messageApi.unreadSummary().then((res) => setUnread(res.data.data)).catch(() => {});
  useEffect(() => { loadUnread(); }, []);

  const openThread = async (t: Thread) => {
    if (!project) return;
    setThread(t);
    const res = t === "supervisor" && project.supervisor
      ? await messageApi.privateThread(project.supervisor._id)
      : await messageApi.projectThread(project._id);
    setMessages(res.data.data);
    await Promise.all(res.data.data.filter((message) => {
      const senderId = typeof message.sender === "string" ? message.sender : message.sender._id;
      return senderId !== user?._id;
    }).map((message) => messageApi.markRead(message._id)));
    loadUnread();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!project || !thread || !draft.trim()) return;
    setSending(true);
    try {
      const res =
        thread === "supervisor" && project.supervisor
          ? await messageApi.send({ chatType: "Private", recipient: project.supervisor._id, content: draft })
          : await messageApi.send({ chatType: "Project Group", project: project._id, content: draft });
      setMessages((prev) => [...prev, res.data.data]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  if (!project) {
    return (
      <div>
        <PageHeader title="Messages" />
        <p className="text-sm text-gray-400">You need an assigned project before you can message your supervisor.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Messages" />

      <div className="card grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-3">
        <div className="border-r border-gray-100 p-3">
          {project.supervisor && (
            <button
              onClick={() => openThread("supervisor")}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50 ${thread === "supervisor" ? "bg-brand-50" : ""}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {project.supervisor.name[0]?.toUpperCase()}
              </span>
              <span className="flex-1">{project.supervisor.title} {project.supervisor.name}</span>
              {unread.privateByUser[project.supervisor._id] > 0 && <UnreadDot />}
            </button>
          )}
          <button
            onClick={() => openThread("group")}
            className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50 ${thread === "group" ? "bg-brand-50" : ""}`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">#</span>
            <span className="flex-1">Project group chat</span>
            {unread.groupByProject[project._id] > 0 && <UnreadDot />}
          </button>
        </div>

        <div className="col-span-2 flex flex-col">
          {!thread ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => {
                  const isMine = typeof m.sender === "string" ? m.sender === user?._id : m.sender._id === user?._id;
                  const senderName = typeof m.sender === "string" ? "" : m.sender.name;
                  return (
                    <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                        {!isMine && thread === "group" && <p className="mb-0.5 text-xs font-semibold opacity-70">{senderName}</p>}
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

function UnreadDot() {
  return <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" /></span>;
}
