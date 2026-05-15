import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

// ── GET all questions with filters ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      type, difficulty, experienceLevel, category, domain,
      limit = 50, page = 1
    } = req.query;

    const query = { isActive: true };

    if (type && type !== 'all')            query.type            = type;
    if (difficulty && difficulty !== 'all') query.difficulty      = difficulty;
    if (experienceLevel && experienceLevel !== 'all') query.experienceLevel = experienceLevel;
    if (category && category !== 'all')    query.category        = category;
    if (domain && domain !== 'all')        query.domain          = domain;

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
});

// ── GET random questions for practice ───────────────────────────────────────
router.get('/random', async (req, res) => {
  try {
    const { type, difficulty, experienceLevel, domain, count = 5 } = req.query;

    const query = { isActive: true };

    if (type && type !== 'all')             query.type            = type;
    if (difficulty && difficulty !== 'all') query.difficulty      = difficulty;
    if (experienceLevel && experienceLevel !== 'all') query.experienceLevel = experienceLevel;
    if (domain && domain !== 'all')         query.domain          = domain;

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) } }
    ]);

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch random questions',
      error: error.message
    });
  }
});

// ── GET question categories ──────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const categories = await Question.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// ── GET questions by domain (for personalized prep) ─────────────────────────
router.get('/by-domain/:domain', async (req, res) => {
  try {
    const { difficulty, experienceLevel, count = 10 } = req.query;
    const query = { isActive: true, domain: req.params.domain };

    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (experienceLevel && experienceLevel !== 'all') query.experienceLevel = experienceLevel;

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) } }
    ]);

    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch', error: error.message });
  }
});

// ── GET single question ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch', error: error.message });
  }
});

export default router;