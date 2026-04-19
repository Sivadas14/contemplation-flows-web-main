/**
 * TopicSuggestions — Admin page for reviewing user-generated topic suggestions.
 *
 * Route: /admin/topics
 *
 * Admin workflow:
 *   Pending  → Approve (appears in Chat UI) or Reject (discarded)
 *   Approved → can be re-rejected; Rejected → can be re-approved
 *
 * Before approving, admin can edit the label and override the tab assignment.
 */
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, RotateCcw, RefreshCw, Hash } from "lucide-react";
import { adminAPI } from "@/apis/api";
import { toast } from "sonner";
import type { SuggestedTopic } from "@/apis/wire";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<string, { label: string; colour: string; icon: JSX.Element }> = {
  pending:  { label: "Pending",  colour: "text-amber-600 bg-amber-50 border-amber-200",  icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", colour: "text-green-700 bg-green-50 border-green-200",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", colour: "text-red-600 bg-red-50 border-red-200",        icon: <XCircle className="w-3.5 h-3.5" /> },
};

const TAB_LABELS: Record<string, string> = {
  teachings: "Ramana's Teachings",
  personal: "What I'm Facing",
};

// ─── Inline edit modal ────────────────────────────────────────────────────────

interface EditModalProps {
  topic: SuggestedTopic;
  onClose: () => void;
  onApprove: (label: string, tab: string) => void;
}

function EditModal({ topic, onClose, onApprove }: EditModalProps) {
  const [label, setLabel] = useState(topic.label);
  const [tab, setTab]     = useState(topic.tab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Topic</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chip label (shown to users)</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            maxLength={40}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
          <p className="text-xs text-gray-400 mt-1">{label.length}/40 chars</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tab</label>
          <select
            value={tab}
            onChange={e => setTab(e.target.value as 'teachings' | 'personal')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          >
            <option value="teachings">Ramana's Teachings</option>
            <option value="personal">What I'm Facing</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full question (sent to LLM)</label>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{topic.question}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onApprove(label.trim() || topic.label, tab)}
            disabled={!label.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            Approve & Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TopicSuggestions() {
  const [topics, setTopics]         = useState<SuggestedTopic[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editTarget, setEditTarget] = useState<SuggestedTopic | null>(null);
  const [actioning, setActioning]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === "all" ? undefined : filter;
      const data = await adminAPI.listSuggestedTopics(status);
      setTopics(data.items);
    } catch {
      toast.error("Failed to load topic suggestions");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (
    topic: SuggestedTopic,
    action: "approved" | "rejected",
    label?: string,
    tab?: string,
  ) => {
    setActioning(topic.id);
    try {
      await adminAPI.updateSuggestedTopic(topic.id, {
        status: action,
        ...(label ? { label } : {}),
        ...(tab   ? { tab }   : {}),
      });
      toast.success(action === "approved" ? "Topic approved and published!" : "Topic rejected.");
      await load();
    } catch {
      toast.error("Action failed — please try again.");
    } finally {
      setActioning(null);
      setEditTarget(null);
    }
  };

  const counts = {
    all:      topics.length,
    pending:  topics.filter(t => t.status === "pending").length,
    approved: topics.filter(t => t.status === "approved").length,
    rejected: topics.filter(t => t.status === "rejected").length,
  };

  // When "all" filter is loaded, compute counts from loaded data
  const pendingCount = filter === "all"
    ? counts.pending
    : topics.filter(t => t.status === "pending").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Topic Suggestions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Topics flagged from user conversations. Approve to add them as chat chips.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              filter === f
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Topic list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Hash className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No suggestions yet</p>
          <p className="text-sm mt-1">They'll appear here as users ask novel questions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map(topic => {
            const cfg = STATUS_CONFIG[topic.status];
            const busy = actioning === topic.id;
            return (
              <div
                key={topic.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.colour}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {TAB_LABELS[topic.tab] ?? topic.tab}
                      </span>
                      {topic.occurrence_count > 1 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          Asked {topic.occurrence_count}×
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-gray-900 text-sm">{topic.label}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {topic.question}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">{fmtDate(topic.created_at)}</p>
                  </div>

                  {/* Right: actions */}
                  <div className="flex gap-2 shrink-0">
                    {topic.status !== "approved" && (
                      <button
                        onClick={() => setEditTarget(topic)}
                        disabled={busy}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                    {topic.status !== "rejected" && (
                      <button
                        onClick={() => handleAction(topic, "rejected")}
                        disabled={busy}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                    {topic.status === "approved" && (
                      <button
                        onClick={() => handleAction(topic, "rejected")}
                        disabled={busy}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        title="Revoke approval"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve modal with label/tab edit */}
      {editTarget && (
        <EditModal
          topic={editTarget}
          onClose={() => setEditTarget(null)}
          onApprove={(label, tab) => handleAction(editTarget, "approved", label, tab)}
        />
      )}
    </div>
  );
}
