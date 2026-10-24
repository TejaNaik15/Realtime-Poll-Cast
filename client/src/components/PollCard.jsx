import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useOutsideClick } from '../hooks/use-outside-click';
import '../styles/PollCard.css';

function cardAccent(id = '') {
  const accents = ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c'];
  return accents[id.charCodeAt(id.length - 1) % accents.length];
}

function cardGradient(id = '') {
  const palettes = [
    'linear-gradient(135deg,#1a0533 0%,#0d1f4a 50%,#0a2a1a 100%)',
    'linear-gradient(135deg,#0d0d2b 0%,#1a0a2e 50%,#0a1a2e 100%)',
    'linear-gradient(135deg,#1a1a0a 0%,#0a2a2a 50%,#0d0d1a 100%)',
    'linear-gradient(135deg,#2a0a0a 0%,#0a0a2a 50%,#0a1a0a 100%)',
    'linear-gradient(135deg,#0a1a2a 0%,#1a0a1a 50%,#0a2a1a 100%)',
  ];
  return palettes[id.charCodeAt(id.length - 1) % palettes.length];
}

/* Close icon */
function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 16, height: 16, color: '#fff' }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
}

/* Single expandable poll card row */
function PollCard({ poll, onExpand, id }) {
  const accent = cardAccent(poll._id);
  const gradient = cardGradient(poll._id);

  const topOption = poll.options?.length > 0
    ? poll.options.reduce((max, o) => (o.votes > max.votes ? o : max), poll.options[0])
    : null;

  const createdDate = new Date(poll.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <motion.div
      layoutId={`card-${poll._id}-${id}`}
      onClick={() => onExpand(poll)}
      className="ec-row"
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
    >
      {/* thumbnail */}
      <motion.div
        layoutId={`image-${poll._id}-${id}`}
        className="ec-thumb"
        style={{ background: gradient }}
      >
        <div className="ec-thumb-shimmer" />
        <span className="ec-thumb-icon">🗳️</span>
        <span className="ec-thumb-badge" style={{ color: accent, borderColor: accent }}>● LIVE</span>
      </motion.div>

      {/* text */}
      <div className="ec-row-body">
        <motion.h3 layoutId={`title-${poll._id}-${id}`} className="ec-row-title">
          {poll.question}
        </motion.h3>
        <motion.p layoutId={`desc-${poll._id}-${id}`} className="ec-row-desc">
          {poll.totalVotes} votes · {poll.options?.length ?? 0} options
          {topOption && poll.totalVotes > 0 ? ` · 🏆 ${topOption.text}` : ''}
        </motion.p>
      </div>

      {/* cta */}
      <motion.button
        layoutId={`btn-${poll._id}-${id}`}
        className="ec-row-btn"
        style={{ '--accent': accent }}
      >
        Vote
      </motion.button>
    </motion.div>
  );
}

/* Expanded modal */
function ExpandedCard({ poll, onClose, id }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const accent = cardAccent(poll._id);
  const gradient = cardGradient(poll._id);

  useOutsideClick(ref, onClose);

  const topOption = poll.options?.length > 0
    ? poll.options.reduce((max, o) => (o.votes > max.votes ? o : max), poll.options[0])
    : null;

  const createdDate = new Date(poll.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="ec-overlay-wrap">
      {/* close btn (mobile) */}
      <motion.button
        key={`close-${poll._id}`}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.05 } }}
        className="ec-close-btn"
        onClick={onClose}
        aria-label="Close"
      >
        <CloseIcon />
      </motion.button>

      <motion.div
        layoutId={`card-${poll._id}-${id}`}
        ref={ref}
        className="ec-expanded"
      >
        {/* expanded image / header */}
        <motion.div
          layoutId={`image-${poll._id}-${id}`}
          className="ec-expanded-thumb"
          style={{ background: gradient }}
        >
          <div className="ec-thumb-shimmer" />
          <span className="ec-expanded-icon">🗳️</span>
        </motion.div>

        {/* content */}
        <div className="ec-expanded-body">
          <div className="ec-expanded-header">
            <div>
              <motion.h3 layoutId={`title-${poll._id}-${id}`} className="ec-expanded-title">
                {poll.question}
              </motion.h3>
              <motion.p layoutId={`desc-${poll._id}-${id}`} className="ec-expanded-desc">
                Created {createdDate}
              </motion.p>
            </div>
            <motion.button
              layoutId={`btn-${poll._id}-${id}`}
              className="ec-expanded-cta"
              style={{ background: accent }}
              onClick={() => navigate(`/poll/${poll._id}`)}
            >
              Vote Now
            </motion.button>
          </div>

          {/* options list */}
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ec-expanded-content"
          >
            <div className="ec-options-label">Options</div>
            {poll.options?.map((opt, i) => {
              const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
              const isTop = topOption && opt.text === topOption.text && poll.totalVotes > 0;
              return (
                <div key={i} className="ec-option">
                  <div className="ec-option-top">
                    <span className="ec-option-text">
                      {isTop && '🏆 '}{opt.text}
                    </span>
                    <span className="ec-option-pct" style={{ color: isTop ? accent : undefined }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="ec-option-bar-bg">
                    <div
                      className="ec-option-bar-fill"
                      style={{ width: `${pct}%`, background: isTop ? accent : 'rgba(255,255,255,0.15)' }}
                    />
                  </div>
                  <span className="ec-option-votes">{opt.votes} votes</span>
                </div>
              );
            })}

            <div className="ec-expanded-stats">
              <div className="ec-stat-pill">
                <span className="ec-stat-val">{poll.totalVotes}</span>
                <span className="ec-stat-lbl">Total Votes</span>
              </div>
              <div className="ec-stat-pill">
                <span className="ec-stat-val">{poll.options?.length ?? 0}</span>
                <span className="ec-stat-lbl">Options</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* Main export — renders the full list */
export default function PollCardList({ polls }) {
  const [active, setActive] = useState(null);
  const id = useId();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    if (active) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active]);

  return (
    <>
      {/* backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ec-backdrop"
          />
        )}
      </AnimatePresence>

      {/* expanded modal */}
      <AnimatePresence>
        {active && (
          <ExpandedCard
            poll={active}
            onClose={() => setActive(null)}
            id={id}
          />
        )}
      </AnimatePresence>

      {/* list */}
      <ul className="ec-list">
        {polls.map((poll) => (
          <PollCard
            key={poll._id}
            poll={poll}
            onExpand={setActive}
            id={id}
          />
        ))}
      </ul>
    </>
  );
}
