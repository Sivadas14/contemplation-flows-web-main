
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, MessageCircle, Heart, MessageSquare, HelpCircle, Plus } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import AtmosphericEntry from "@/components/AtmosphericEntry";
import TeachingsSection from "@/components/TeachingsSection";
import { chatAPI } from "@/apis/api";
import { type Conversation } from "@/apis/wire";

// ─── Static daily contemplations (rotate by day-of-week, no API needed) ─────
interface DailyQuote { quote: string; question: string; }
const DAILY_QUOTES: DailyQuote[] = [
  { // Sunday
    quote: "Silence is the true teaching. Sit quietly, and notice what remains when thought subsides.",
    question: "Who is the one who is aware right now?",
  },
  { // Monday
    quote: "The Self is always present. What you seek, you already are. Turn attention inward and rest there.",
    question: "What is present before the very first thought of the day arises?",
  },
  { // Tuesday
    quote: "Thoughts arise and subside in the vast space of awareness. You are that space — not the thoughts.",
    question: "To whom do these thoughts appear?",
  },
  { // Wednesday
    quote: "The ego is like a wave that imagines itself separate from the ocean. Inquiry dissolves this imagining.",
    question: "Can you find the 'I' that claims to have problems?",
  },
  { // Thursday
    quote: "There is no distance between you and the Self. The very act of seeking obscures what is already here.",
    question: "What is the awareness that witnesses both stillness and movement?",
  },
  { // Friday
    quote: "The Heart is not a place — it is the source from which all experience rises and into which it sets.",
    question: "Where does the sense of 'I am' come from?",
  },
  { // Saturday
    quote: "Peace is your natural state. It is only the mind's movements that veil it. Inquire and the veil lifts.",
    question: "What remains when you stop following the next thought?",
  },
];

function getTodayQuote(): DailyQuote {
  return DAILY_QUOTES[new Date().getDay()];
}

const Index = () => {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  // Static daily contemplation — no API call, always available instantly
  const contemplation = getTodayQuote();
  const navigate = useNavigate();

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const response = await chatAPI.getConversations();
        setConversations(response.conversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        // Fallback to empty array if fetch fails
        setConversations([]);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, []);


  const handleSend = async () => {
    if (query.trim()) {
      // Navigate to the chat with the initial query
      // The conversation will be created when the first message is sent
      navigate("/chat", { state: { initialQuery: query } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleChatClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleQuickPrompt = async (prompt: string) => {
    // Navigate to the chat with the initial query (if any)
    if (prompt.trim()) {
      navigate("/chat", { state: { initialQuery: prompt } });
    } else {
      // For empty prompts (like "New Chat"), just navigate without any initial query
      navigate("/chat");
    }
  };

  // Today's Contemplation: prompt text to send to chat when user taps "Begin Inquiry"
  const todaysPrompt = `${contemplation.quote}\n\n${contemplation.question}`;

  const quickPrompts = [
    {
      icon: <MessageSquare className="w-4 h-4" />,
      label: "Share thoughts",
      prompt: "Share some thoughts of Bhagavan Ramana Maharshi about wisdom."
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      label: "Resolve confusion",
      prompt: "What are some ways to reduce confusion?"
    },
    {
      icon: <Plus className="w-4 h-4" />,
      label: "New Chat",
      prompt: ""
    }
  ];

  // Helper function to format date
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays === 1) {
      return "1 day ago";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInWeeks === 1) {
      return "1 week ago";
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} weeks ago`;
    } else {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }
  };

  return (
    <div className="min-h-full flex items-start justify-center p-4 md:pt-16 pb-20" style={{ backgroundColor: 'rgb(236, 229, 223)' }}>
      <AtmosphericEntry />
      <div className="w-full max-w-6xl mx-auto">
        {/* User Menu in top right - Hidden on mobile as it's in sidebar */}
        <div className="hidden md:flex justify-end mb-8">
          <UserMenu />
        </div>

        <div className="text-center mb-8 md:mb-12 mt-8 md:mt-0">
          <h1 className="text-4xl md:text-6xl font-heading text-brand-heading mb-4 md:mb-8">
            Wisdom AI
          </h1>
          {/* ── DEPLOYMENT PROBE ── remove after confirming new code is live */}
          <div style={{
            background: "#c0392b",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontFamily: "monospace",
            display: "inline-block",
            marginBottom: "8px",
          }}>
            BUILD: 17-APR-2026-v3
          </div>
        </div>

        {/* Today's Contemplation Card */}
        <div className="max-w-2xl mx-auto mb-6 md:mb-8">
          <div
            onClick={() => handleQuickPrompt(todaysPrompt)}
            className="cursor-pointer rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] hover:border-brand-button p-5 md:p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-brand-button flex-shrink-0" />
              <span className="text-xs font-semibold tracking-widest uppercase text-brand-button font-body">
                Today's Contemplation
              </span>
            </div>

            <p className="text-brand-heading font-heading text-base md:text-lg leading-relaxed mb-4">
              "{contemplation.quote}"
            </p>
            <p className="text-brand-body font-body text-sm md:text-base italic border-t border-orange-100 pt-3">
              ✦ {contemplation.question}
            </p>

            <div className="mt-4 flex justify-end">
              <span className="text-xs text-brand-button font-body font-medium">
                Begin Inquiry →
              </span>
            </div>
          </div>
        </div>

        {/* Guided Introduction to the Teachings */}
        <TeachingsSection onExplore={handleQuickPrompt} />

        {/* Quick Prompts */}
        <div className="max-w-2xl mx-auto mb-10 md:mb-12">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                onClick={() => handleQuickPrompt(prompt.prompt)}
                variant="outline"
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/80 hover:bg-white border-gray-200 text-brand-body text-sm md:text-base font-body transition-all duration-200 hover:scale-105 hover:border-brand-button"
              >
                {prompt.icon}
                {prompt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Previous Chats Section */}
        <div className="max-w-4xl mx-auto">
          {isLoadingConversations ? (
            <div className="text-center py-8">
              <p className="text-brand-body font-body">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <h2 className="text-xl md:text-2xl font-heading text-brand-heading mb-4">No conversations</h2>
              <p className="text-brand-body font-body">Start a new conversation above!</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-heading text-brand-heading mb-6 text-center">Your Conversations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleChatClick(conversation.id)}
                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 border border-gray-100 hover:border-brand-button"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-brand-button" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium font-heading text-brand-heading mb-2 truncate">
                          {conversation.title || "Untitled Conversation"}
                        </h3>
                        <p className="text-sm text-brand-body mb-3 line-clamp-2 font-body">
                          Click to continue this conversation...
                        </p>
                        <span className="text-xs text-gray-400 font-body">
                          {formatTimestamp(conversation.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
