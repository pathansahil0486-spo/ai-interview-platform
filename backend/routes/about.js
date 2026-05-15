import express from 'express';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';

const router = express.Router();

const fmt = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K+`;
  return `${n}+`;
};

router.get('/stats', async (req, res) => {
  try {
    const [sessions, learners, feedbackStats] = await Promise.all([
      Interview.countDocuments({ status: 'completed' }),
      User.countDocuments(),
      Feedback.aggregate([
        { $match: { stars: { $gte: 4 } } },
        { $count: 'happy' }
      ]),
    ]);

    const totalRated = await Feedback.countDocuments({ stars: { $gt: 0 } });
    const happyCount = feedbackStats[0]?.happy || 0;
    const satisfaction = totalRated > 0
      ? `${Math.round((happyCount / totalRated) * 100)}%`
      : '95%';

    res.json({
      success: true,
      data: {
        sessions:     fmt(sessions),
        learners:     fmt(learners),
        satisfaction,
        templates:    '200+',   // static — update if you have a templates collection
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;