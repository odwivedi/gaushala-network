'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MedicalContributePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', content: '', expert_name: '', qualification: '',
    institution: '', experience_years: '', youtube_urls: ['']
  });
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setLoggedIn(d.success && !!d.user);
      setAuthChecked(true);
    });
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleYoutube = (index: number, value: string) => {
    const urls = [...form.youtube_urls];
    urls[index] = value;
    setForm({ ...form, youtube_urls: urls });
  };

  const addYoutube = () => setForm({ ...form, youtube_urls: [...form.youtube_urls, ''] });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entity_type', 'expert_contribution');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }
    setMediaUrls([...mediaUrls, ...urls]);
    setUploading(false);
  };

  const removeMedia = (url: string) => setMediaUrls(mediaUrls.filter(u => u !== url));

  const handleSubmit = async () => {
    if (!form.title || !form.content || !form.expert_name || !form.qualification) {
      setError('Please fill all required fields'); return;
    }
    setSubmitting(true); setError('');
    const res = await fetch('/api/contribute/medical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        experience_years: form.experience_years ? parseInt(form.experience_years) : null,
        youtube_urls: form.youtube_urls.filter(u => u.trim()),
        media_urls: mediaUrls
      })
    });
    const data = await res.json();
    if (data.success) { setSuccess(true); }
    else { setError(data.error || 'Submission failed'); }
    setSubmitting(false);
  };

  if (!authChecked) return <div className="min-h-screen bg-amber-50 flex items-center justify-center"><p className="text-amber-700">Loading...</p></div>;

  if (!loggedIn) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-10 shadow-md text-center max-w-md">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">Login Required</h2>
        <p className="text-amber-700 mb-6">Please sign in to submit your expert contribution.</p>
        <a href="/login?from=/contribute" className="bg-green-700 text-white px-6 py-2 rounded-lg inline-block">Sign In</a>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-10 shadow-md text-center max-w-md">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">Contribution Submitted!</h2>
        <p className="text-amber-700 mb-6">Your contribution is under review. Outstanding submissions may be preserved on the blockchain.</p>
        <button onClick={() => router.push('/')} className="bg-green-700 text-white px-6 py-2 rounded-lg">Go Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <a href="/contribute" className="text-green-700 hover:underline text-sm">← Back to Contribute</a>
          <h1 className="text-3xl font-bold text-green-900 mt-2">Medical Expert Contribution</h1>
          <p className="text-amber-700 mt-1">Share your veterinary or Ayurvedic expertise with the gaushala community.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
          <div className="border-b border-amber-100 pb-6">
            <h2 className="font-bold text-green-900 mb-4">Your Credentials</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Full Name *</label>
                <input name="expert_name" value={form.expert_name} onChange={handleChange}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="Dr. Ramesh Sharma" />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Qualification *</label>
                <input name="qualification" value={form.qualification} onChange={handleChange}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="BVSc, MVSc, BAMS..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Institution</label>
                <input name="institution" value={form.institution} onChange={handleChange}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="Hospital or University name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Years of Experience</label>
                <input name="experience_years" type="number" value={form.experience_years} onChange={handleChange}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="10" />
              </div>
            </div>
          </div>

          <div className="border-b border-amber-100 pb-6">
            <h2 className="font-bold text-green-900 mb-4">Your Contribution</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Title *</label>
                <input name="title" value={form.title} onChange={handleChange}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="e.g. Treatment Protocol for Bovine Mastitis using Panchagavya" />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Detailed Content *</label>
                <textarea name="content" value={form.content} onChange={handleChange} rows={10}
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                  placeholder="Share your detailed knowledge, treatment protocols, case studies, observations..." />
              </div>
            </div>
          </div>

          <div className="border-b border-amber-100 pb-6">
            <h2 className="font-bold text-green-900 mb-4">Media Attachments</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">Images & PDFs</label>
                <label className="cursor-pointer border-2 border-dashed border-amber-300 rounded-lg px-6 py-3 text-amber-700 hover:border-green-500 hover:text-green-700 transition-colors inline-block">
                  {uploading ? 'Uploading...' : '+ Add Images or PDFs'}
                  <input type="file" multiple accept="image/*,application/pdf"
                    onChange={handleFileUpload} className="hidden" />
                </label>
                {mediaUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-xs">
                        <span>{url.includes('/pdfs/') ? '📄' : '🖼'} {url.split('/').pop()}</span>
                        <button onClick={() => removeMedia(url)} className="text-red-500 ml-1">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">YouTube Links</label>
                {form.youtube_urls.map((url, i) => (
                  <input key={i} value={url} onChange={e => handleYoutube(i, e.target.value)}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:border-green-500"
                    placeholder="https://youtube.com/watch?v=..." />
                ))}
                <button onClick={addYoutube} className="text-sm text-green-700 hover:underline">+ Add another YouTube link</button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-600">* Required fields. All submissions are reviewed before publishing.</p>
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium">
              {submitting ? 'Submitting...' : 'Submit Contribution'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
