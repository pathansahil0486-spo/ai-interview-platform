// routes/feedback.js
import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// ── POST /api/feedback  — save one submission ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, userName, userEmail, mood, type, stars, message } = req.body;

    if (!message || message.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Message too short.' });
    }

    const fb = await Feedback.create({
      userId:    userId    || 'anonymous',
      userName:  userName  || 'Anonymous',
      userEmail: userEmail || '',
      mood:      mood      || 'not selected',
      type:      type      || 'general',
      stars:     stars     || 0,
      message:   message.trim(),
      submittedAt: new Date(),
    });

    res.status(201).json({ success: true, data: fb });
  } catch (err) {
    console.error('Feedback POST error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/feedback/stats  — aggregated numbers ───────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const total = await Feedback.countDocuments();

    // Average rating (only rated entries)
    const ratingAgg = await Feedback.aggregate([
      { $match: { stars: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
    ]);
    const avgRating  = ratingAgg[0]?.avg   ? +ratingAgg[0].avg.toFixed(1)  : 0;
    const ratedCount = ratingAgg[0]?.count ?? 0;

    // Distribution 1-5
    const distAgg = await Feedback.aggregate([
      { $match: { stars: { $gt: 0 } } },
      { $group: { _id: '$stars', count: { $sum: 1 } } },
    ]);
    const distMap = {};
    distAgg.forEach(d => { distMap[d._id] = d.count; });

    const distribution = [5, 4, 3, 2, 1].map(s => {
      const count = distMap[s] || 0;
      const pct   = ratedCount > 0 ? Math.round((count / ratedCount) * 100) : 0;
      return { stars: s, pct, count };
    });

    res.json({ success: true, data: { total, avgRating, ratedCount, distribution } });
  } catch (err) {
    console.error('Feedback stats error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/feedback/community  — recent public entries ────────────────────
router.get('/community', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const items = await Feedback.find({ message: { $exists: true } })
      .sort({ submittedAt: -1 })
      .limit(limit)
      .select('userName mood type stars message submittedAt -_id');

    res.json({ success: true, data: items });
  } catch (err) {
    console.error('Feedback community error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;