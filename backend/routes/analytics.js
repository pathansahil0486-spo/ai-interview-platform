// backend/routes/analytics.js
// Registered as: app.use('/api/analytics', analyticsRoutes)
import express from 'express';
import User from '../models/User.js';
import Interview from '../models/Interview.js';

const router = express.Router();

// ── GET /api/analytics/user/:userId ───────────────────────────────────────────
// Used by dashboard — matches server.js route registration
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const interviewStats = await Interview.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalInterviews:     { $sum: 1 },
          completedInterviews: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageScore:        { $avg: '$overallScore' },
          totalPracticeTime:   { $sum: '$duration' }
        }
      }
    ]);

    const scoreProgression = await Interview.aggregate([
      { $match: { userId, status: 'completed' } },
      {
        $project: {
          date:  { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          score: '$overallScore',
          title: 1
        }
      },
      { $sort: { date: 1 } },
      { $limit: 10 }
    ]);

    const skillBreakdown = await Interview.aggregate([
      { $match: { userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          technicalScore:    { $avg: '$analysis.technicalSkills' },
          communicationScore:{ $avg: '$analysis.communication' },
          problemSolving:    { $avg: '$analysis.problemSolving' },
          confidence:        { $avg: '$analysis.confidence' }
        }
      }
    ]);

    // Weak areas from user syllabusProgress
    let weakAreas = [];
    try {
      const user = await User.findOne({ clerkId: userId });
      if (user?.syllabusProgress?.length > 0) {
        weakAreas = user.syllabusProgress
          .filter(p => p.averageScore < 60 && p.questionsAttempted > 0)
          .sort((a, b) => a.averageScore - b.averageScore)
          .slice(0, 5)
          .map(p => ({ topic: p.subtopic || p.topic, score: p.averageScore, domain: p.domain }));
      }
    } catch {}

    const stats = interviewStats.length > 0 ? interviewStats[0] : {
      totalInterviews: 0, completedInterviews: 0, averageScore: 0, totalPracticeTime: 0
    };
    delete stats._id;

    const skill = skillBreakdown.length > 0 ? skillBreakdown[0] : {};
    delete skill?._id;

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        averageScore: Math.round(stats.averageScore || 0),
        scoreProgression,
        skillBreakdown: {
          technicalScore:     Math.round(skill.technicalScore     || 0),
          communicationScore: Math.round(skill.communicationScore || 0),
          problemSolving:     Math.round(skill.problemSolving     || 0),
          confidence:         Math.round(skill.confidence         || 0)
        },
        weakAreas
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
});

// ── GET /api/analytics/dashboard/:clerkId ────────────────────────────────────
router.get('/dashboard/:clerkId', async (req, res) => {
  // Alias — forward to same logic using clerkId as userId
  req.params.userId = req.params.clerkId;
  return router.handle(req, res, () => {});
});

export default router;