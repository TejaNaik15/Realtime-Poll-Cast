const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

// GET /api/polls — get all polls, newest first
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/polls — create new poll
router.post('/', async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ message: 'Question and at least 2 options are required.' });
    }

    const formattedOptions = options.map((opt) => ({
      text: typeof opt === 'string' ? opt : opt.text,
      votes: 0,
    }));

    const poll = new Poll({ question, options: formattedOptions });
    await poll.save();
    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/polls/:id — get single poll
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/polls/:id/vote — submit a vote
router.post('/:id/vote', async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }

    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;
    await poll.save();

    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;