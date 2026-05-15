'use client';
import logger from '@/lib/logger';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

interface Result {
  answer: string;
  related_topics: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface HistoryItem {
  id: number;
  question: string;
  answer: string;
  related_topics: string[];
  confidence: string;
  created_at: string;
}

const SAMPLE_QUESTIONS = [
  'What is the significance of Gir cow in Indian tradition?',
  'How much milk does a Sahiwal cow produce per day?',
  'What are the properties of A2 milk?',
  'What is Panchagavya and its Ayurvedic uses?',
  'How to manage a cow during pregnancy?',
  'What is Go-daan and who should receive it?',
];

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ question: string; result: Result }[]>([]);
  const [savedHistory, setSavedHistory] = useState<HistoryItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    // Auto-ask if question param present
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { setQuestion(q); handleAsk(q); }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          setIsLoggedIn(true);
          fetch('/api/ai/ask')
            .then(r => r.json())
            .then(h => { if (h.success) setSavedHistory(h.history || []); });
        }
      }).catch(() => {});
  }, []);

  function confidenceColor(c: string) {
    if (c === 'high') return '#3B6D11';
    if (c === 'medium') return '#e67e22';
    return '#888';
  }

  async function handleAsk(q?: string) {
    const ask = q || question;
    if (!ask.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    logger.info('UI', 'ask/page.tsx', 'Question submitted');
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: ask })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setHistory(prev => [{ question: ask, result: data.result }, ...prev.slice(0, 4)]);
        if (q) setQuestion(q);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Failed to connect to AI service');
    }
    setLoading(false);
  }

  return (
    <><SiteNav />
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/" style={{ color: '#3B6D11', textDecoration: 'none', fontSize: '0.9rem' }}>← Home</Link>
      </div>

      <h1 style={{ color: '#3B6D11', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>💬 Ask About Cows</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Ask any question about Indian cows, gaushalas, Vedic traditions, cow care, breeds, or Ayurvedic uses.
      </p>

      {/* Sample questions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: '0.5rem' }}>Try asking:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => handleAsk(q)}
              style={{ padding: '0.3rem 0.8rem', background: '#EAF3DE', color: '#3B6D11', border: '1px solid #c3dfa0', borderRadius: 16, cursor: 'pointer', fontSize: 13 }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Ask anything about Indian cows..."
            style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: 15 }}
          />
          <button onClick={() => handleAsk()} disabled={loading || !question.trim()}
            style={{ padding: '0.65rem 1.5rem', background: question.trim() ? '#3B6D11' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, cursor: question.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff8f8', border: '1px solid #f5c6cb', borderRadius: 10, padding: '1rem', color: '#c0392b', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ background: '#EAF3DE', border: '1px solid #c3dfa0', borderRadius: 10, padding: '1.5rem', textAlign: 'center', color: '#3B6D11' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤔</div>
          <p style={{ margin: 0, fontWeight: 500 }}>Thinking...</p>
        </div>
      )}

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem' }}>Answer</h2>
            <span style={{ background: confidenceColor(result.confidence), color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {result.confidence} confidence
            </span>
          </div>
          <p style={{ color: '#333', fontSize: 15, lineHeight: 1.7, margin: '0 0 1rem' }}>{result.answer}</p>
          {result.related_topics.length > 0 && (
            <div>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 0.4rem' }}>Related topics:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.related_topics.map((t, i) => (
                  <span key={i} style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 12, padding: '2px 10px', fontSize: 13 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {!isLoggedIn && (
            <div style={{ marginTop: '1rem', background: '#EAF3DE', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#3B6D11' }}>Sign in to save your Q&A history and access it anytime.</span>
              <a href={`/login?from=/ask?q=${encodeURIComponent(question)}`} style={{ fontSize: 13, fontWeight: 600, color: '#3B6D11', textDecoration: 'none', background: '#fff', border: '1px solid #3B6D11', padding: '0.3rem 0.8rem', borderRadius: 6 }}>Sign in</a>
            </div>
          )}
        </div>
      )}

      {/* Saved history toggle */}
      {isLoggedIn && savedHistory.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setShowSaved(!showSaved)}
            style={{ background: 'none', border: '1px solid #3B6D11', color: '#3B6D11', padding: '0.4rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            {showSaved ? 'Hide' : 'Show'} saved history ({savedHistory.length})
          </button>
          {showSaved && (
            <div style={{ marginTop: '0.75rem' }}>
              {savedHistory.map((h) => (
                <div key={h.id} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '1rem', marginBottom: '0.5rem', cursor: 'pointer' }}
                  onClick={() => { setQuestion(h.question); setResult({ answer: h.answer, related_topics: h.related_topics, confidence: h.confidence as 'high' | 'medium' | 'low' }); setShowSaved(false); }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: '#333' }}>{h.question}</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: 12, color: '#888' }}>{h.answer.slice(0, 100)}...</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: 11, color: '#bbb' }}>{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {history.length > 1 && (
        <div>
          <h3 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Previous questions (this session)</h3>
          {history.slice(1).map((h, i) => (
            <div key={i} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '1rem', marginBottom: '0.5rem', cursor: 'pointer' }}
              onClick={() => { setQuestion(h.question); setResult(h.result); }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: '#333' }}>{h.question}</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: 13, color: '#666' }}>{h.result.answer.slice(0, 120)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
