import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle, MessageSquare, HelpCircle, Plus } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import AtmosphericEntry from "@/components/AtmosphericEntry";
import { chatAPI } from "@/apis/api";
import { type Conversation } from "@/apis/wire";

// ─── Design tokens (identical to Landing.tsx) ─────────────────────────────────
const T = {
  cream:    "#F5F0EC",
  creamMid: "#EDE5DC",
  card:     "#FFFCF9",
  brown:    "#472B20",
  muted:    "#8A6D5E",
  accent:   "#B85A2D",
  border:   "#E0D5CC",
  serif:    "'DM Serif Text', serif",
  sans:     "'Figtree', sans-serif",
};

// ─── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  {
    icon: <MessageSquare size={14} />,
    label: "Share thoughts",
    prompt: "Share some thoughts of Bhagavan Ramana Maharshi about wisdom.",
  },
  {
    icon: <HelpCircle size={14} />,
    label: "Resolve confusion",
    prompt: "What are some ways to reduce confusion?",
  },
  {
    icon: <Plus size={14} />,
    label: "New Chat",
    prompt: "",
  },
];

// ─── Timestamp helper ─────────────────────────────────────────────────────────
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const h  = Math.floor(diffMs / (1000 * 60 * 60));
  const d  = Math.floor(h  / 24);
  const w  = Math.floor(d  / 7);
  const mo = Math.floor(d  / 30);
  if (h  < 1)  return "Just now";
  if (h  < 24) return `${h}h ago`;
  if (d  === 1) return "Yesterday";
  if (d  < 7)  return `${d} days ago`;
  if (w  === 1) return "1 week ago";
  if (w  < 4)  return `${w} weeks ago`;
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Index = () => {
  const [query, setQuery]                       = useState("");
  const [conversations, setConversations]       = useState<Conversation[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const navigate = useNavigate();

  // Fetch conversations on mount
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await chatAPI.getConversations();
        setConversations(res.conversations);
      } catch {
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSend = () => {
    if (query.trim()) navigate("/chat", { state: { initialQuery: query } });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };
  const handleChatClick    = (id: string) => navigate(`/chat/${id}`);
  const handleQuickPrompt  = (prompt: string) =>
    prompt.trim() ? navigate("/chat", { state: { initialQuery: prompt } }) : navigate("/chat");

  return (
    <div style={{ minHeight: "100%", backgroundColor: T.cream, fontFamily: T.sans }}>
      <AtmosphericEntry />

      {/* ── 3-column top bar: brand | WISDOM AI | user menu ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "1.75rem 2rem 0",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Left — brand link */}
        <a
          href="https://www.arunachalasamudra.in"
          style={{
            fontFamily: T.serif,
            fontSize: "1.05rem",
            color: T.brown,
            textDecoration: "none",
            letterSpacing: "0.01em",
            opacity: 0.82,
            justifySelf: "start",
          }}
        >
          Arunachala Samudra
        </a>

        {/* Centre — page title */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: T.serif,
              fontSize: "clamp(2rem, 6vw, 3.75rem)",
              color: T.brown,
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            Wisdom AI
          </h1>
          <p
            style={{
              fontFamily: T.sans,
              fontSize: "0.72rem",
              color: T.muted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: "0.4rem",
              marginBottom: 0,
            }}
          >
            Ask anything about Sri Ramana Maharshi's teachings
          </p>
        </div>

        {/* Right — user menu */}
        <div style={{ justifySelf: "end" }}>
          <UserMenu />
        </div>
      </div>

      {/* ── Decorative rule ── */}
      <div
        style={{
          maxWidth: "660px",
          margin: "1.5rem auto 0",
          borderTop: `1px solid ${T.border}`,
        }}
      />

      {/* ── Chat section ── */}
      <div style={{ maxWidth: "660px", margin: "2rem auto 0", padding: "0 1.25rem" }}>

        {/* Description */}
        <p
          style={{
            fontFamily: T.sans,
            fontSize: "0.88rem",
            color: T.muted,
            lineHeight: 1.75,
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          Your personal guide to the wisdom of Arunachala. Ask about self-inquiry,
          the sacred texts, your practice, or whatever you are facing in life —
          every response is rooted in Bhagavan Ramana Maharshi's teachings.
        </p>

        {/* Input box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: T.card,
            border: `1.5px solid ${T.border}`,
            borderRadius: "6px",
            padding: "0.5rem 0.5rem 0.5rem 1rem",
            boxShadow: "0 2px 14px rgba(46,18,8,0.07)",
          }}
        >
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to explore today?"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: T.sans,
              fontSize: "0.92rem",
              color: T.brown,
              minWidth: 0,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!query.trim()}
            style={{
              backgroundColor: query.trim() ? T.accent : T.border,
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "0.55rem 0.9rem",
              cursor: query.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
              flexShrink: 0,
            }}
          >
            <ArrowRight size={17} />
          </button>
        </div>

        {/* Quick prompts */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "1rem",
            justifyContent: "center",
          }}
        >
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleQuickPrompt(p.prompt)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = T.accent;
                (e.currentTarget as HTMLElement).style.color = T.accent;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.brown;
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.38rem 0.85rem",
                backgroundColor: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: "20px",
                fontFamily: T.sans,
                fontSize: "0.8rem",
                color: T.brown,
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
            >
              <span style={{ color: T.muted, display: "flex" }}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section divider ── */}
      <div
        style={{
          maxWidth: "660px",
          margin: "2.5rem auto",
          borderTop: `1px solid ${T.border}`,
        }}
      />

      {/* ── Previous conversations ── */}
      <div style={{ maxWidth: "900px", margin: "0 auto 4rem", padding: "0 1.25rem" }}>
        {isLoading ? (
          <p
            style={{
              textAlign: "center",
              fontFamily: T.sans,
              color: T.muted,
              fontSize: "0.88rem",
            }}
          >
            Loading conversations…
          </p>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <p
              style={{
                fontFamily: T.serif,
                fontSize: "1.2rem",
                color: T.brown,
                marginBottom: "0.4rem",
                fontWeight: 400,
              }}
            >
              No conversations yet
            </p>
            <p style={{ fontFamily: T.sans, fontSize: "0.84rem", color: T.muted }}>
              Ask your first question above to begin
            </p>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontFamily: T.serif,
                fontSize: "1.15rem",
                color: T.brown,
                textAlign: "center",
                marginBottom: "1.25rem",
                fontWeight: 400,
                letterSpacing: "0.01em",
              }}
            >
              Your Conversations
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.85rem",
              }}
            >
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleChatClick(conv.id)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = T.accent;
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 18px rgba(46,18,8,0.09)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                  style={{
                    backgroundColor: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: "6px",
                    padding: "1.1rem 1.2rem",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: T.creamMid,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MessageCircle size={14} color={T.accent} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: T.sans,
                          fontSize: "0.86rem",
                          fontWeight: 600,
                          color: T.brown,
                          margin: "0 0 0.25rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {conv.title || "Untitled Conversation"}
                      </p>
                      <p
                        style={{
                          fontFamily: T.sans,
                          fontSize: "0.74rem",
                          color: T.muted,
                          margin: 0,
                        }}
                      >
                        {formatTimestamp(conv.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
