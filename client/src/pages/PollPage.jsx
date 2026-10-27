
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socket from '../socket';

const API_URL = 'https://realtime-poll-cast.onrender.com';

function PollPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');

  // Fetch the poll from the backend
  const fetchPoll = useCallback(async () => {
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      setError('Invalid poll ID. Please open a valid poll.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/polls/${encodeURIComponent(id)}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (response.status === 404
              ? 'This poll was not found. It may have been deleted.'
              : `Unable to load poll (HTTP ${response.status}).`)
        );
      }

      // Supports either a direct poll object or { poll: ... }
      const pollData = data?.poll ?? data;

      if (!pollData || !pollData._id) {
        throw new Error('The server returned invalid poll data.');
      }

      setPoll(pollData);
    } catch (err) {
      console.error('Error fetching poll:', err);
      setError(
        err.message ||
          'Unable to load this poll. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load the poll and restore the local vote status
  useEffect(() => {
    let active = true;

    const loadPoll = async () => {
      setLoading(true);
      setError('');

      if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
        if (active) {
          setError('Invalid poll ID. Please open a valid poll.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/polls/${encodeURIComponent(id)}`
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              (response.status === 404
                ? 'This poll was not found. It may have been deleted.'
                : `Unable to load poll (HTTP ${response.status}).`)
          );
        }

        const pollData = data?.poll ?? data;

        if (!pollData || !pollData._id) {
          throw new Error('The server returned invalid poll data.');
        }

        if (active) {
          setPoll(pollData);

          const votedPolls = JSON.parse(
            localStorage.getItem('votedPolls') || '{}'
          );

          setHasVoted(Boolean(votedPolls[id]));
        }
      } catch (err) {
        console.error('Error loading poll:', err);

        if (active) {
          setError(
            err.message ||
              'Unable to load this poll. Please try again.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPoll();

    return () => {
      active = false;
    };
  }, [id]);

  // Join the poll's Socket.IO room and receive live updates
  useEffect(() => {
    if (!id) return;

    const handlePollUpdate = (updatedPoll) => {
      if (
        updatedPoll &&
        String(updatedPoll._id) === String(id)
      ) {
        setPoll(updatedPoll);
      }
    };

    socket.emit('joinPoll', id);
    socket.on('pollUpdated', handlePollUpdate);

    return () => {
      socket.off('pollUpdated', handlePollUpdate);
    };
  }, [id]);

  // Submit a vote through Socket.IO
  const handleVote = () => {
    if (selectedOption === null || voting || hasVoted) {
      return;
    }

    if (!poll || !Array.isArray(poll.options)) {
      setVoteMessage('Poll data is unavailable. Please refresh.');
      return;
    }

    if (
      !Number.isInteger(selectedOption) ||
      selectedOption < 0 ||
      selectedOption >= poll.options.length
    ) {
      setVoteMessage('Please select a valid option.');
      return;
    }

    setVoting(true);
    setVoteMessage('');

    // The server broadcasts pollUpdated after successfully saving.
    // This timeout only prevents the UI from staying stuck forever.
    const timeoutId = setTimeout(() => {
      setVoting(false);
      setVoteMessage(
        'No confirmation received from the server. Please check the poll before trying again.'
      );
    }, 10000);

    socket.emit('submitVote', {
      pollId: id,
      optionIndex: selectedOption,
    });

    // This matches the existing server event structure, which has
    // no explicit vote acknowledgement.
    const handleVoteUpdate = (updatedPoll) => {
      if (
        updatedPoll &&
        String(updatedPoll._id) === String(id)
      ) {
        clearTimeout(timeoutId);
        setPoll(updatedPoll);
        setVoting(false);
        setHasVoted(true);
        setVoteMessage('Your vote has been submitted!');

        try {
          const votedPolls = JSON.parse(
            localStorage.getItem('votedPolls') || '{}'
          );

          votedPolls[id] = true;
          localStorage.setItem(
            'votedPolls',
            JSON.stringify(votedPolls)
          );
        } catch (err) {
          console.error('Unable to save local vote status:', err);
        }

        socket.off('pollUpdated', handleVoteUpdate);
      }
    };

    socket.on('pollUpdated', handleVoteUpdate);
  };

  if (loading) {
    return (
      <main className="poll-page">
        <div className="poll-container">
          <p>Loading poll...</p>
        </div>
      </main>
    );
  }

  if (error || !poll) {
    return (
      <main className="poll-page">
        <div className="poll-container">
          <h2>Unable to load poll</h2>
          <p role="alert">
            {error || 'Poll data is unavailable.'}
          </p>

          <button type="button" onClick={fetchPoll}>
            Try Again
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const totalVotes = poll.options.reduce(
    (total, option) => total + (Number(option.votes) || 0),
    0
  );

  return (
    <main className="poll-page">
      <div className="poll-container">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Polls
        </button>

        <h1>{poll.question}</h1>

        <p className="poll-total-votes">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </p>

        <div className="poll-options">
          {poll.options.map((option, index) => {
            const votes = Number(option.votes) || 0;
            const percentage =
              totalVotes > 0
                ? Math.round((votes / totalVotes) * 100)
                : 0;

            return (
              <button
                key={`${index}-${option.text}`}
                type="button"
                className={`poll-option ${
                  selectedOption === index ? 'selected' : ''
                }`}
                onClick={() => {
                  if (!hasVoted && !voting) {
                    setSelectedOption(index);
                    setVoteMessage('');
                  }
                }}
                disabled={hasVoted || voting}
                aria-pressed={selectedOption === index}
              >
                <div className="poll-option-header">
                  <span>{option.text}</span>

                  {(hasVoted || totalVotes > 0) && (
                    <span>
                      {votes} ({percentage}%)
                    </span>
                  )}
                </div>

                {(hasVoted || totalVotes > 0) && (
                  <div className="poll-progress-track">
                    <div
                      className="poll-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!hasVoted ? (
          <button
            type="button"
            className="vote-button"
            onClick={handleVote}
            disabled={selectedOption === null || voting}
          >
            {voting ? 'Submitting vote...' : 'Submit Vote'}
          </button>
        ) : (
          <p className="vote-success">
            You have already voted in this poll.
          </p>
        )}

        {voteMessage && (
          <p role="status" aria-live="polite">
            {voteMessage}
          </p>
        )}
      </div>
    </main>
  );
}

export default PollPage;
