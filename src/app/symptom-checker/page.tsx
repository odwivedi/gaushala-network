'use client';
import logger from '@/lib/logger';
import { useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

const BREEDS = ['', 'Gir', 'Sahiwal', 'Tharparkar', 'Rathi', 'Kankrej', 'Hariana', 'Ongole', 'Deoni', 'Hallikar', 'Amrit Mahal', 'Other'];

interface Condition {
  name: string;
  likelihood: 'high' | 'medium' | 'low';
  description: string;
  urgency: 'emergency' | 'urgent' | 'routine';
}

interface Result {
  possible_conditions: Condition[];
  immediate_actions: string[];
  home_management: string[];
  when_to_call_vet: string;
  disclaimer: string;
}

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  function urgencyColor(urgency: string) {
    if (urgency === 'emergency') return '#c0392b';
    if (urgency === 'urgent') return '#e67e22';
    return '#3B6D11';
  }

  function likelihoodColor(likelihood: string) {
    if (likelihood === 'high') return '#c0392b';
    if (likelihood === 'medium') return '#e67e22';
    return '#888';
  }

  async function handleSubmit() {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    logger.info('UI', 'symptom-checker/page.tsx', 'Symptom check submitted');
    try {
      const res = await fetch('/api/ai/symptom-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, breed, age })
      });
      const data = await res.json();
      if (data.success) setResult(data.result);
      else setError(data.error || 'Something went wrong');
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

      <h1 style={{ color: '#3B6D11', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>🐄 Cow Symptom Checker</h1>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Describe your cow&apos;s symptoms and get an AI-assisted veterinary assessment. Always consult a qualified vet for diagnosis and treatment.
      </p>

      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>
            Describe the symptoms *
          </label>
          <textarea
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="e.g. The cow is not eating since yesterday, has loose motions, appears lethargic, and her milk yield has dropped significantly..."
            rows={5}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #ccc', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#333', marginBottom: '0.4rem', fontSize: 14 }}>Breed (optional)</label>
            <select value={breed} onChange={e => setBreed(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}>
              {BREEDS.map(b => <option key={b} value={b}>{b || 'Select breed'}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#333', marginBottom: '0.4rem', fontSize: 14 }}>Age (optional)</label>
            <input value={age} onChange={e => setAge(e.target.value)}
              placeholder="e.g. 4 years, 6 months"
              style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !symptoms.trim()}
          style={{ padding: '0.75rem 2rem', background: symptoms.trim() ? '#3B6D11' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, cursor: symptoms.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 15 }}>
          {loading ? 'Analysing...' : 'Check Symptoms'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fff8f8', border: '1px solid #f5c6cb', borderRadius: 10, padding: '1rem', color: '#c0392b', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ background: '#EAF3DE', border: '1px solid #c3dfa0', borderRadius: 10, padding: '1.5rem', textAlign: 'center', color: '#3B6D11' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p style={{ margin: 0, fontWeight: 500 }}>Analysing symptoms...</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: 13, color: '#666' }}>Consulting veterinary knowledge base</p>
        </div>
      )}

      {result && (
        <div>
          {/* Possible Conditions */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
            <h2 style={{ color: '#3B6D11', fontSize: '1.1rem', marginTop: 0, marginBottom: '1rem' }}>Possible Conditions</h2>
            {result.possible_conditions.map((c, i) => (
              <div key={i} style={{ borderLeft: `4px solid ${urgencyColor(c.urgency)}`, paddingLeft: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                  <span style={{ background: likelihoodColor(c.likelihood), color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{c.likelihood} likelihood</span>
                  <span style={{ background: urgencyColor(c.urgency), color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{c.urgency}</span>
                </div>
                <p style={{ margin: 0, color: '#555', fontSize: 14 }}>{c.description}</p>
              </div>
            ))}
          </div>

          {/* Immediate Actions */}
          <div style={{ background: '#fff8f0', border: '1px solid #f5c6cb', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
            <h2 style={{ color: '#c0392b', fontSize: '1.1rem', marginTop: 0, marginBottom: '0.75rem' }}>⚡ Immediate Actions</h2>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {result.immediate_actions.map((a, i) => <li key={i} style={{ color: '#444', fontSize: 14, marginBottom: '0.4rem' }}>{a}</li>)}
            </ul>
          </div>

          {/* Home Management */}
          <div style={{ background: '#EAF3DE', border: '1px solid #c3dfa0', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
            <h2 style={{ color: '#3B6D11', fontSize: '1.1rem', marginTop: 0, marginBottom: '0.75rem' }}>🌿 Home Management</h2>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {result.home_management.map((t, i) => <li key={i} style={{ color: '#444', fontSize: 14, marginBottom: '0.4rem' }}>{t}</li>)}
            </ul>
          </div>

          {/* When to call vet */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
            <h2 style={{ color: '#333', fontSize: '1.1rem', marginTop: 0, marginBottom: '0.5rem' }}>📞 When to Call a Vet</h2>
            <p style={{ margin: 0, color: '#555', fontSize: 14 }}>{result.when_to_call_vet}</p>
          </div>

          {/* Disclaimer */}
          <div style={{ background: '#FFF3CD', border: '1px solid #ffeaa7', borderRadius: 10, padding: '1rem' }}>
            <p style={{ margin: 0, color: '#856404', fontSize: 13 }}>⚠ {result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
