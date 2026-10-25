import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreatePage.css';

function CreatePage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (!trimmedQuestion) {
      setError('Please enter a question.');
      return;
    }
    if (validOptions.length < 2) {
      setError('Please provide at least 2 non-empty options.');
      return;
    }

    setSubmitting(true);
    try {
      
const res= await fetch(
  'https://realtime-poll-cast.onrender.com/api/polls',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      options,
    }),
  }
);


      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create poll');
      }

      const newPoll = await res.json();
      navigate(`/poll/${newPoll._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-container">
      <div className="create-wrapper">
        <div className="create-card">
          <div className="create-card-punch" />
          <div className="create-card-body">
        <div className="create-header">
          <div className="create-badge-label"><span className="create-badge-dot" />New Poll</div>
          <h1 className="create-title">Create a New Poll</h1>
          <p className="create-subtitle">Ask a question and let the crowd decide</p>
        </div>
        <div className="create-divider" />

        <form className="create-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="question" className="form-label">
              Your Question
            </label>
            <input
              id="question"
              type="text"
              className="form-input"
              placeholder="e.g. What's the best programming language?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              required
            />
            <span className="char-count">{question.length}/200</span>
          </div>

          <div className="form-group">
            <label className="form-label">Options</label>
            <div className="options-list">
              {options.map((option, index) => (
                <div key={index} className="option-input-row">
                  <span className="option-number">{index + 1}</span>
                  <input
                    type="text"
                    className="form-input option-input"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="remove-option-btn"
                      onClick={() => removeOption(index)}
                      aria-label={`Remove option ${index + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                className="add-option-btn"
                onClick={addOption}
              >
                + Add Option
                <span className="option-count-hint">
                  ({options.length}/6)
                </span>
              </button>
            )}
          </div>

          {error && (
            <div className="form-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
            id="create-poll-submit"
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                Creating Poll...
              </>
            ) : (
              '🚀 Launch Poll'
            )}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePage;
