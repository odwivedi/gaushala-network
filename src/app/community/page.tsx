'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import SiteNav from '@/components/SiteNav';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  state: string;
  city: string;
  venue: string;
  start_date: string;
  end_date: string;
  organiser: string;
  contact: string;
  registration_url: string;
}

interface Expert {
  id: number;
  display_name: string;
  expertise: string;
  bio: string;
  qualifications: string;
  organisation: string;
}

export default function CommunityPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'experts' | 'join'>('events');
  const [loading, setLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showExpertForm, setShowExpertForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_type: '', state: '', city: '', venue: '', start_date: '', organiser: '', contact: '', registration_url: '' });
  const [expertForm, setExpertForm] = useState({ expertise: '', bio: '', qualifications: '', organisation: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'events' && events.length === 0) {
      setLoading(true);
      fetch('/api/community/events')
        .then(r => r.json())
        .then(d => { if (d.success) setEvents(d.events); })
        .catch(err => logger.error('UI', 'community/page.tsx', 'Events fetch failed', { err: String(err) }))
        .finally(() => setLoading(false));
    }
    if (activeTab === 'experts' && experts.length === 0) {
      setLoading(true);
      fetch('/api/community/experts')
        .then(r => r.json())
        .then(d => { if (d.success) setExperts(d.experts); })
        .catch(err => logger.error('UI', 'community/page.tsx', 'Experts fetch failed', { err: String(err) }))
        .finally(() => setLoading(false));
    }
  }, [activeTab, events.length, experts.length]);

  async function submitEvent() {
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/community/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Event submitted successfully. It will appear once verified.');
        setShowEventForm(false);
        setEventForm({ title: '', description: '', event_type: '', state: '', city: '', venue: '', start_date: '', organiser: '', contact: '', registration_url: '' });
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      logger.error('UI', 'community/page.tsx', 'Event submit failed', { err: String(err) });
      setMessage('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitExpert() {
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/community/experts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expertForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Expert profile submitted. You will be verified by our team shortly.');
        setShowExpertForm(false);
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      logger.error('UI', 'community/page.tsx', 'Expert submit failed', { err: String(err) });
      setMessage('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const tabStyle = (tab: string) => ({
    padding: '0.5rem 1.25rem', borderRadius: 20, border: '1px solid #3B6D11',
    background: activeTab === tab ? '#3B6D11' : '#fff',
    color: activeTab === tab ? '#fff' : '#3B6D11',
    cursor: 'pointer' as const, fontWeight: 500,
  });

  const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block' as const, fontWeight: 600, marginBottom: '0.3rem', color: '#333', fontSize: '0.88rem' };

  return (
    <>
    <SiteNav />
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#3B6D11', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Community</h1>
        <p style={{ color: '#666', marginTop: '0.25rem' }}>Events, experts, and the gaushala network</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button style={tabStyle('events')} onClick={() => setActiveTab('events')}>Events</button>
        <button style={tabStyle('experts')} onClick={() => setActiveTab('experts')}>Expert Directory</button>
        <button style={tabStyle('join')} onClick={() => setActiveTab('join')}>Join the Network</button>
        <Link href="/community/members" style={{ padding: '0.5rem 1.25rem', borderRadius: 20, border: '1px solid #3B6D11', background: '#fff', color: '#3B6D11', fontWeight: 500, textDecoration: 'none', fontSize: '0.95rem' }}>Members</Link>
      </div>

      {message && <div style={{ background: '#D4EDDA', border: '1px solid #C3E6CB', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#155724', fontSize: '0.9rem' }}>{message}</div>}

      {activeTab === 'events' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Upcoming cow-related events across India</p>
            <button onClick={() => setShowEventForm(!showEventForm)}
              style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              + Submit Event
            </button>
          </div>

          {showEventForm && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.5rem', background: '#fff', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#3B6D11', margin: '0 0 1rem' }}>Submit an Event</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Event title *</label>
                  <input style={inputStyle} value={eventForm.title} onChange={e => setEventForm(p => ({...p, title: e.target.value}))} />
                </div>
                <div>
                  <label style={labelStyle}>Event type</label>
                  <select style={inputStyle} value={eventForm.event_type} onChange={e => setEventForm(p => ({...p, event_type: e.target.value}))}>
                    <option value="">— Select —</option>
                    <option>Conference</option>
                    <option>Festival</option>
                    <option>Workshop</option>
                    <option>Seminar</option>
                    <option>Gaushala visit</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Start date *</label>
                  <input type="date" style={inputStyle} value={eventForm.start_date} onChange={e => setEventForm(p => ({...p, start_date: e.target.value}))} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input style={inputStyle} value={eventForm.state} onChange={e => setEventForm(p => ({...p, state: e.target.value}))} />
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={inputStyle} value={eventForm.city} onChange={e => setEventForm(p => ({...p, city: e.target.value}))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Venue</label>
                  <input style={inputStyle} value={eventForm.venue} onChange={e => setEventForm(p => ({...p, venue: e.target.value}))} />
                </div>
                <div>
                  <label style={labelStyle}>Organiser</label>
                  <input style={inputStyle} value={eventForm.organiser} onChange={e => setEventForm(p => ({...p, organiser: e.target.value}))} />
                </div>
                <div>
                  <label style={labelStyle}>Contact</label>
                  <input style={inputStyle} value={eventForm.contact} onChange={e => setEventForm(p => ({...p, contact: e.target.value}))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{...inputStyle, resize: 'vertical' as const}} rows={3} value={eventForm.description} onChange={e => setEventForm(p => ({...p, description: e.target.value}))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Registration URL</label>
                  <input style={inputStyle} value={eventForm.registration_url} onChange={e => setEventForm(p => ({...p, registration_url: e.target.value}))} />
                </div>
              </div>
              <button onClick={submitEvent} disabled={submitting}
                style={{ marginTop: '1rem', background: submitting ? '#999' : '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '0.65rem 1.5rem', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                {submitting ? 'Submitting...' : 'Submit Event'}
              </button>
            </div>
          )}

          {loading ? <p style={{ color: '#666' }}>Loading...</p> :
            events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                <p style={{ fontSize: '1.1rem' }}>No upcoming events listed yet.</p>
                <p style={{ fontSize: '0.9rem' }}>Know of a cow-related conference, festival, or workshop? Submit it above.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {events.map(e => (
                  <div key={e.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem' }}>{e.title}</h3>
                        <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.85rem' }}>
                          {new Date(e.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {e.city && ` · ${e.city}`}{e.state && `, ${e.state}`}
                        </p>
                      </div>
                      {e.event_type && <span style={{ background: '#EAF3DE', color: '#3B6D11', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.78rem', fontWeight: 500 }}>{e.event_type}</span>}
                    </div>
                    {e.description && <p style={{ color: '#555', margin: '0.75rem 0 0', fontSize: '0.9rem' }}>{e.description}</p>}
                    {e.organiser && <p style={{ color: '#777', margin: '0.4rem 0 0', fontSize: '0.83rem' }}>Organised by: {e.organiser}</p>}
                    {e.registration_url && <a href={e.registration_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.75rem', color: '#3B6D11', fontSize: '0.85rem', fontWeight: 600 }}>Register →</a>}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {activeTab === 'experts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Verified vets, researchers and Sanskrit scholars</p>
            <button onClick={() => setShowExpertForm(!showExpertForm)}
              style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              Apply as Expert
            </button>
          </div>

          {showExpertForm && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.5rem', background: '#fff', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#3B6D11', margin: '0 0 1rem' }}>Apply as Expert</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Area of expertise *</label>
                  <select style={inputStyle} value={expertForm.expertise} onChange={e => setExpertForm(p => ({...p, expertise: e.target.value}))}>
                    <option value="">— Select —</option>
                    <option>Veterinary Medicine</option>
                    <option>Ayurveda</option>
                    <option>Sanskrit & Vedic Studies</option>
                    <option>Jyotish</option>
                    <option>Gaushala Management</option>
                    <option>Cow Breeding & Genetics</option>
                    <option>Dairy Science</option>
                    <option>Agricultural Science</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Organisation / Institution</label>
                  <input style={inputStyle} value={expertForm.organisation} onChange={e => setExpertForm(p => ({...p, organisation: e.target.value}))} />
                </div>
                <div>
                  <label style={labelStyle}>Qualifications</label>
                  <input style={inputStyle} placeholder="e.g. BVSc, MVSc, PhD" value={expertForm.qualifications} onChange={e => setExpertForm(p => ({...p, qualifications: e.target.value}))} />
                </div>
                <div>
                  <label style={labelStyle}>Bio</label>
                  <textarea style={{...inputStyle, resize: 'vertical' as const}} rows={3} placeholder="Brief description of your work and expertise" value={expertForm.bio} onChange={e => setExpertForm(p => ({...p, bio: e.target.value}))} />
                </div>
              </div>
              <button onClick={submitExpert} disabled={submitting}
                style={{ marginTop: '1rem', background: submitting ? '#999' : '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '0.65rem 1.5rem', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          )}

          {loading ? <p style={{ color: '#666' }}>Loading...</p> :
            experts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                <p style={{ fontSize: '1.1rem' }}>No verified experts listed yet.</p>
                <p style={{ fontSize: '0.9rem' }}>Are you a vet, researcher, or Sanskrit scholar? Apply above.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {experts.map(e => (
                  <div key={e.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: '#fff' }}>
                    <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem' }}>{e.display_name}</h3>
                    <p style={{ margin: '0.25rem 0 0.5rem', color: '#856404', fontSize: '0.85rem', fontWeight: 500 }}>{e.expertise}</p>
                    {e.organisation && <p style={{ margin: '0 0 0.4rem', color: '#555', fontSize: '0.85rem' }}>{e.organisation}</p>}
                    {e.qualifications && <p style={{ margin: '0 0 0.4rem', color: '#666', fontSize: '0.83rem' }}>{e.qualifications}</p>}
                    {e.bio && <p style={{ margin: '0.5rem 0 0', color: '#555', fontSize: '0.85rem', lineHeight: 1.6 }}>{e.bio}</p>}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {activeTab === 'join' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '2rem', background: '#fff', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#3B6D11', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Gaushala Network Membership</h2>
            <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
              Verified gaushalas on gaushala.network can join our network to coordinate cow transfers, share feed procurement, and collaborate on health protocols.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {['Share supplier details — feed, medicine, equipment vendors across India', 'Access shared veterinary knowledge base and treatment protocols', 'Coordinate during natural disasters and emergencies', 'Permanent blockchain-verified membership record', 'Connect with verified vets, researchers and Sanskrit scholars'].map(b => (
                <div key={b} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#3B6D11', fontWeight: 700, marginTop: '0.1rem' }}>✓</span>
                  <span style={{ color: '#444', fontSize: '0.9rem' }}>{b}</span>
                </div>
              ))}
            </div>
            <p style={{ color: '#666', fontSize: '0.88rem', margin: '0 0 1rem' }}>To apply, your gaushala must first be claimed and verified in our <Link href="/directory" style={{ color: '#3B6D11' }}>directory</Link>.</p>
            <Link href="/directory" style={{ display: 'inline-block', background: '#3B6D11', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              Find your gaushala in the directory →
            </Link>
          </div>

          <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '2rem', background: '#fff' }}>
            <h2 style={{ color: '#3B6D11', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Contributor Registration</h2>
            <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
              Anyone can register and contribute to gaushala.network. Registered contributors can edit wiki articles (subject to moderation), add scripture references, and participate in discussions.
            </p>
            <Link href="/register" style={{ display: 'inline-block', background: '#3B6D11', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              Register as contributor →
            </Link>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
