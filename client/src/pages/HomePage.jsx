import React, { useState } from 'react';
import PollCardList from '../components/PollCard';
import { SquigglyText } from '../components/ui/squiggly-text';
import '../styles/HomePage.css';

/* Split text into individually animated word spans */
function AnimatedText({ text, className, baseDelay = 0 }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="word-reveal"
          style={{ animationDelay: `${baseDelay + i * 0.07}s` }}
        >
          {word}
          {i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </span>
  );
}

function HomePage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPolls, setShowPolls] = useState(false);

  const handleBrowse = async () => {
    if (showPolls) {
      document.getElementById('polls')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://realtime-poll-cast.onrender.com/api/polls');
      if (!res.ok) throw new Error('Failed to fetch polls');
      const data = await res.json();
      setPolls(data);
      setShowPolls(true);
      setTimeout(() => document.getElementById('polls')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      {/* Hero — bare text, no card */}
      <div className="home-hero">
        <div className="home-hero-eyebrow">
          <span className="home-hero-dot" />
          <SquigglyText
            stepDuration={90}
            scale={[4, 7]}
            baseFrequency={0.018}
            style={{
              fontFamily: 'Grandstander, cursive',
              fontWeight: 900,
              fontSize: '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(200,160,255,0.9)',
              lineHeight: 1.0,
              whiteSpace: 'nowrap',
            }}
          >
            Live · Real-Time Voting
          </SquigglyText>
        </div>

        <h1 className="home-title">
          <AnimatedText text="Real-Time" baseDelay={0.2} />
          {' '}
          <span className="accent">
            <AnimatedText text="Polls" baseDelay={0.45} />
          </span>
        </h1>

        <p className="home-subtitle">
          <AnimatedText
            text="Vote on live polls and watch results update instantly"
            baseDelay={0.55}
          />
        </p>

        <div className="home-hero-actions">
          <button onClick={handleBrowse} className="home-hero-cta" disabled={loading}>
            {loading ? '⏳ Loading...' : '🗳️ Browse Polls'}
          </button>
          <a href="#how-it-works" className="home-hero-secondary liquid-glass">
            How it works ↓
          </a>
        </div>
      </div>

      {/* How it works strip */}
      <div id="how-it-works" className="how-it-works">
        {[
          { icon: '✏️', title: 'Create', desc: 'Set a question and add options in seconds' },
          { icon: '🔗', title: 'Share', desc: 'Send the link to anyone, anywhere' },
          { icon: '📊', title: 'Watch Live', desc: 'Results update in real-time via WebSockets' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="hiw-step">
            <span className="hiw-icon">{icon}</span>
            <strong>{title}</strong>
            <p>{desc}</p>
          </div>
        ))}
      </div>

      {/* Poll list */}
      {showPolls && (
        <div id="polls">
          {error && (
            <div className="error-state">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          )}
          {polls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗳️</div>
              <h2>No polls yet</h2>
              <p>Be the first to create a poll!</p>
            </div>
          ) : (
            <div className="polls-grid">
            <PollCardList polls={polls} />
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;
