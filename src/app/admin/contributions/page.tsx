'use client';
import { useState, useEffect } from 'react';

interface Contribution {
  id: number;
  contribution_type: string;
  title: string;
  content: string;
  expert_name: string;
  qualification: string;
  institution: string;
  experience_years: number;
  youtube_urls: string[];
  ai_score: number;
  ai_reasoning: string;
  status: string;
  blockchain_verified: boolean;
  blockchain_tx: string;
  created_at: string;
  contributor_name: string;
  contributor_email: string;
  media: { url: string; type: string }[];
}

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'medical'|'jyotish'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending'|'approved'|'rejected'>('pending');
  const [selected, setSelected] = useState<Contribution | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchContributions = async () => {
    setLoading(true);
    const types = filter === 'all' ? ['medical', 'jyotish'] : [filter];
    const all: Contribution[] = [];
    for (const type of types) {
      const res = await fetch(`/api/contribute/${type}`, { headers: { 'x-admin-secret': 'gn_admin_2026' } });
      if (res.ok) {
        const data = await res.json();
        all.push(...data);
      }
    }
    setContributions(all.filter(c => c.status === statusFilter));
    setLoading(false);
  };

  useEffect(() => { fetchContributions(); }, [filter, statusFilter]);

  const handleReview = async (action: 'approve'|'reject'|'approve_blockchain') => {
    if (!selected) return;
    setReviewing(true);
    const res = await fetch(`/api/contribute/${selected.id}/review`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, review_note: reviewNote })
    });
    const data = await res.json();
    if (data.success) {
      setSelected(null);
      setReviewNote('');
      fetchContributions();
    }
    setReviewing(false);
  };

  const aiScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  const aiScoreLabel = (score: number) => {
    if (score >= 70) return 'Likely AI';
    if (score >= 40) return 'Possibly AI';
    return 'Likely Human';
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin/moderation" className="text-green-700 hover:underline text-sm">← Admin Dashboard</a>
            <h1 className="text-2xl font-bold text-green-900 mt-1">Expert Contributions</h1>
          </div>
          <div className="flex gap-2">
            {(['all', 'medical', 'jyotish'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-green-700 text-white' : 'bg-white text-green-700 border border-green-300'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm ${statusFilter === s ? 'bg-amber-700 text-white' : 'bg-white text-amber-700 border border-amber-300'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <p className="text-amber-700">Loading...</p> : contributions.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-amber-600">No {statusFilter} contributions found.</div>
        ) : (
          <div className="space-y-4">
            {contributions.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.contribution_type === 'medical' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.contribution_type === 'medical' ? '🏥 Medical' : '🪐 Jyotish'}
                      </span>
                      {c.blockchain_verified && <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">⛓️ Blockchain Verified</span>}
                    </div>
                    <h3 className="font-bold text-green-900 text-lg">{c.title}</h3>
                    <p className="text-sm text-amber-700">{c.expert_name} · {c.qualification}{c.institution ? ` · ${c.institution}` : ''}{c.experience_years ? ` · ${c.experience_years}y exp` : ''}</p>
                    <p className="text-xs text-amber-500 mt-1">Submitted by {c.contributor_name} ({c.contributor_email}) · {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${aiScoreColor(c.ai_score)}`}>
                      AI: {c.ai_score}% · {aiScoreLabel(c.ai_score)}
                    </div>
                    <button onClick={() => { setSelected(c); setReviewNote(''); }}
                      className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800">
                      Review
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{c.content.substring(0, 200)}...</p>
                {c.media && c.media.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {c.media.map((m, i) => (
                      <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">
                        {m.type === 'pdf' ? '📄 PDF' : '🖼 Image'} {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-amber-100">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-green-900">{selected.title}</h2>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <p className="text-sm text-amber-700 mt-1">{selected.expert_name} · {selected.qualification}</p>
              </div>

              <div className="p-6 space-y-4">
                <div className={`rounded-lg p-4 ${aiScoreColor(selected.ai_score)}`}>
                  <div className="font-medium text-sm mb-1">AI Analysis: {selected.ai_score}% probability of AI generation</div>
                  <div className="text-sm">{selected.ai_reasoning}</div>
                </div>

                <div>
                  <h3 className="font-medium text-green-900 mb-2">Full Content</h3>
                  <div className="bg-amber-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">{selected.content}</div>
                </div>

                {selected.youtube_urls && selected.youtube_urls.filter(u => u).length > 0 && (
                  <div>
                    <h3 className="font-medium text-green-900 mb-2">YouTube Links</h3>
                    {selected.youtube_urls.filter(u => u).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm">{url}</a>
                    ))}
                  </div>
                )}

                {selected.media && selected.media.length > 0 && (
                  <div>
                    <h3 className="font-medium text-green-900 mb-2">Media Attachments</h3>
                    <div className="flex flex-wrap gap-3">
                      {selected.media.map((m, i) => (
                        m.type === 'image'
                          ? <img key={i} src={m.url} alt="attachment" className="w-32 h-32 object-cover rounded-lg border" />
                          : <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 hover:bg-amber-100">📄 PDF {i + 1}</a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Review Note (optional)</label>
                  <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                    placeholder="Add a note for the contributor..." />
                </div>

                {selected.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleReview('reject')} disabled={reviewing}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
                      Reject
                    </button>
                    <button onClick={() => handleReview('approve')} disabled={reviewing}
                      className="flex-1 bg-green-700 text-white py-2.5 rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium">
                      Approve
                    </button>
                    <button onClick={() => handleReview('approve_blockchain')} disabled={reviewing}
                      className="flex-1 bg-purple-700 text-white py-2.5 rounded-lg hover:bg-purple-800 disabled:opacity-50 font-medium">
                      {reviewing ? 'Writing...' : '⛓️ Approve + Blockchain'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
