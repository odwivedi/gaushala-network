import { IconSearch, IconMapPin, IconBook, IconOm, IconStars, IconPalette, IconUsers, IconLock, IconLeaf } from '@tabler/icons-react';

const stats = [
  { num: '5,200+', label: 'Gaushalas listed' },
  { num: '320+', label: 'Wiki articles' },
  { num: '1,800+', label: 'Scriptural references' },
  { num: '28', label: 'Indian states covered' },
];

const layers = [
  {
    icon: <IconMapPin size={20} color="#3B6D11" />,
    bg: '#EAF3DE',
    title: 'Gaushala directory',
    desc: 'Every gaushala in India — searchable by state, district, or pincode. Verified listings with map.',
    count: '5,200+ listings',
    href: '/directory',
  },
  {
    icon: <IconBook size={20} color="#3B6D11" />,
    bg: '#EAF3DE',
    title: 'Knowledge base',
    desc: 'Breeds, diseases, treatments, nutrition, research. Wiki-style, community-edited, fully referenced.',
    count: '320+ articles',
    href: '/wiki',
  },
  {
    icon: <IconOm size={20} color="#854F0B" />,
    bg: '#FAEEDA',
    title: 'Scriptural references',
    desc: 'The cow in Vedas, Puranas, Mahabharata, Ayurveda — Sanskrit, transliteration, Hindi, English.',
    count: '1,800+ shlokas',
    href: '/scripture',
  },
  {
    icon: <IconStars size={20} color="#854F0B" />,
    bg: '#FAEEDA',
    title: 'Jyotish & remedies',
    desc: 'Go-daan, remedies by graha, muhurta for Gau Seva. Classical Jyotish knowledge, cited and structured.',
    count: 'Coming soon',
    href: '/jyotish',
  },
  {
    icon: <IconPalette size={20} color="#3B6D11" />,
    bg: '#EAF3DE',
    title: 'Culture & traditions',
    desc: 'Festivals, folk art, regional traditions — Gopashtami to Mattu Pongal. Every state of India.',
    count: 'Coming soon',
    href: '/culture',
  },
  {
    icon: <IconUsers size={20} color="#3B6D11" />,
    bg: '#EAF3DE',
    title: 'Community',
    desc: 'Connect with vets, scholars, gaushala managers. Contribute knowledge. Coordinate resources.',
    count: 'Join the network',
    href: '/community',
  },
];

const recent = [
  { tag: 'Wiki', tagBg: '#EAF3DE', tagColor: '#27500A', title: 'Gir cow — breed profile, milk yield, and disease resistance', meta: 'AI-generated · pending verification' },
  { tag: 'Scripture', tagBg: '#FAEEDA', tagColor: '#633806', title: 'Rigveda 6.28 — Aghnya shlokas on the inviolability of the cow', meta: 'Sanskrit · Hindi · English · Source cited' },
  { tag: 'Directory', tagBg: '#EAF3DE', tagColor: '#27500A', title: 'Shri Krishna Gaushala, Mathura — listing claimed and verified', meta: 'Uttar Pradesh · 340 cows · Verified member' },
  { tag: 'Wiki', tagBg: '#EAF3DE', tagColor: '#27500A', title: 'Foot and mouth disease — symptoms, treatment protocol, prevention', meta: 'Reviewed by verified veterinarian · ICAR source' },
];

export default function Home() {
  return (
    <main>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#fff', borderBottom: '0.5px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3B6D11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🐄</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>gaushala.network</div>
            <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.3px' }}>The Cow Knowledge Commons</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {['Directory', 'Map', 'Wiki', 'Scripture', 'Jyotish', 'Culture'].map(link => (
            <a key={link} href={link === 'Map' ? '/map' : `/${link.toLowerCase()}`} style={{ fontSize: 13, color: '#555' }}>{link}</a>
          ))}
          <a href="/login" style={{ fontSize: 13, color: '#555' }}>Sign in</a>
          <a href="/register" style={{ fontSize: 13, background: '#3B6D11', color: '#EAF3DE', padding: '6px 16px', borderRadius: 8 }}>Register</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '64px 32px 48px', textAlign: 'center', background: '#fff', borderBottom: '0.5px solid #e5e5e5' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EAF3DE', color: '#3B6D11', fontSize: 12, padding: '4px 14px', borderRadius: 20, marginBottom: 20 }}>
          <IconLeaf size={14} /> A public commons — free forever
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.25, marginBottom: 10, color: '#1a1a1a' }}>
          The world&apos;s knowledge about the cow,<br />in one place
        </h1>
        <p style={{ fontSize: 20, color: '#3B6D11', marginBottom: 12, fontWeight: 400 }}>
          गाय के बारे में सम्पूर्ण ज्ञान — एक स्थान पर
        </p>
        <p style={{ fontSize: 15, color: '#666', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Directory of every gaushala in India. Veterinary knowledge. Vedic scriptures. Jyotish wisdom. Cultural traditions. Built by the community. Owned by no one.
        </p>
        <div style={{ display: 'flex', maxWidth: 520, margin: '0 auto', border: '0.5px solid #ccc', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
          <input placeholder="Search gaushalas, breeds, diseases, scriptures..." style={{ flex: 1, border: 'none', padding: '13px 16px', fontSize: 14, outline: 'none', background: 'transparent', color: '#1a1a1a' }} />
          <button style={{ background: '#3B6D11', color: '#EAF3DE', border: 'none', padding: '13px 20px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconSearch size={16} /> Search
          </button>
        </div>
      </section>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5px', background: '#e5e5e5', borderBottom: '0.5px solid #e5e5e5' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#3B6D11' }}>{s.num}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Layers */}
      <section style={{ padding: '40px 32px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Explore the platform</h2>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Eight layers of knowledge — each independently useful, all connected</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {layers.map(l => (
            <a key={l.title} href={l.href} style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '18px', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {l.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>{l.title}</div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{l.desc}</div>
              <div style={{ fontSize: 11, color: '#3B6D11', marginTop: 10 }}>→ {l.count}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Recently added */}
      <section style={{ padding: '0 32px 40px' }}>
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Recently added</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Latest contributions from the community</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {recent.map(r => (
              <div key={r.title} style={{ border: '0.5px solid #e5e5e5', borderRadius: 10, padding: '14px' }}>
                <span style={{ fontSize: 11, fontWeight: 500, background: r.tagBg, color: r.tagColor, padding: '3px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>{r.tag}</span>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{r.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commons declaration */}
      <section style={{ padding: '0 32px 40px' }}>
        <div style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <IconLock size={24} color="#27500A" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#173404', marginBottom: 4 }}>A public commons — owned by no one, built by everyone</div>
            <div style={{ fontSize: 13, color: '#27500A', lineHeight: 1.7 }}>
              All code is open source (MIT licence). All content is Creative Commons CC BY-SA. Every contributor&apos;s authorship is permanently recorded on the Polygon blockchain. This platform will be transferred to a community-governed non-profit foundation. No individual or company will ever own it.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '20px 32px', borderTop: '0.5px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <div style={{ fontSize: 12, color: '#888' }}>gaushala.network · A Sandhi AI initiative · Public commons since 2026</div>
        <div style={{ fontSize: 12, color: '#888' }}>MIT licence · CC BY-SA content · Polygon attribution</div>
      </footer>

    </main>
  );
}
