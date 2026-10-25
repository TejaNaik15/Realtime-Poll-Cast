import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';
import '../styles/PollPage.css';

function PollPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voted, setVoted] = useState(false);
  const [votedIndex, setVotedIndex] = useState(null);
  const [voting, setVoting] = useState(false);

  // Check localStorage for prior vote
  useEffect(() => {
    const storedVote = localStorage.getItem(`livepoll_voted_${id}`);
    if (storedVote !== null) {
      setVoted(true);
      setVotedIndex(parseInt(storedVote, 10));
    }
  }, [id]);

  // Fetch poll data
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${id}`);
        if (!res.ok) throw new Error('Poll not found');
        const data = await res.json();
        setPoll(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  // Socket.io: join room and listen for updates
  useEffect(() => {
    socket.emit('joinPoll', id);

    socket.on('pollUpdated', (updatedPoll) => {
      setPoll(updatedPoll);
    });

    return () => {
      socket.off('pollUpdated');
    };
  }, [id]);

  const handleVote = async (optionIndex) => {
    if (voted || voting) return;

    setVoting(true);
    try {
      socket.emit('submitVote', { pollId: id, optionIndex });
      localStorage.setItem(`livepoll_voted_${id}`, optionIndex);
      setVoted(true);
      setVotedIndex(optionIndex);
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setVoting(false);
    }
  };

  const getPercentage = (votes) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  if (loading) {
    return (
      <div className="poll-page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="poll-page-container">
        <div className="error-state">
          <span>⚠️</span>
          <p>{error}</p>
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-page-container">
      <div className="poll-wrapper">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>

        <div className="poll-header">
          <div className="poll-live-badge">
            <span className="live-dot"></span>
            LIVE
          </div>
          <h1 className="poll-question">{poll.question}</h1>
          <p className="poll-total-votes">
            {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} cast
          </p>
        </div>

        <div className="poll-options">
          {poll.options.map((option, index) => {
            const pct = getPercentage(option.votes);
            const isVotedOption = voted && votedIndex === index;
            const isWinning =
              voted &&
              poll.totalVotes > 0 &&
              option.votes === Math.max(...poll.options.map((o) => o.votes));

            return (
              <div
                key={index}
                className={`option-card ${voted ? 'voted' : 'clickable'} ${isVotedOption ? 'my-vote' : ''} ${isWinning && voted ? 'winning' : ''}`}
                onClick={() => handleVote(index)}
                role={!voted ? 'button' : undefined}
                tabIndex={!voted ? 0 : undefined}
                onKeyDown={(e) => !voted && e.key === 'Enter' && handleVote(index)}
                aria-label={`Vote for ${option.text}`}
              >
                <div className="option-content">
                  <div className="option-top-row">
                    <span className="option-text">
                      {isVotedOption && '✓ '}
                      {option.text}
                    </span>
                    {voted && (
                      <span className="option-pct">{pct}%</span>
                    )}
                  </div>

                  {voted && (
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${isWinning ? 'winning-bar' : ''}`}
                        style={{ width: `${pct}%` }}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  )}

                  {voted && (
                    <span className="option-votes">
                      {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!voted && (
          <p className="vote-prompt">👆 Click an option to cast your vote</p>
        )}
        {voted && (
          <p className="voted-notice">✅ Your vote has been recorded. Results update live!</p>
        )}
      </div>
    </div>
  );
}

export default PollPage;
