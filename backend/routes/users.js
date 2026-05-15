// backend/routes/users.js
// Handles: profile create/update, profile fetch, preferences, stats
import express from 'express';
import User from '../models/User.js';
import Interview from '../models/Interview.js';

const router = express.Router();

// ── POST /api/users/profile — create or update user profile (upsert) ─────────
// Called on: onboarding save, profile edit save, every clerk sign-in sync
router.post('/profile', async (req, res) => {
  try {
    const {
      clerkId, email, firstName, lastName, profileImage,
      // Onboarding fields
      userType, studentClass, stream, college,
      jobTitle, company, domain, targetRoles,
      // Shared
      experienceLevel, skills, goals, bio,
      onboarded
    } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ success: false, message: 'clerkId and email are required' });
    }

    // Build the update object — only set fields that were actually sent
    const updateData = {};
    if (email)           updateData.email         = email;
    if (firstName)       updateData.firstName      = firstName;
    if (lastName)        updateData.lastName       = lastName;
    if (profileImage)    updateData.profileImage   = profileImage;
    if (userType)        updateData.userType       = userType;
    if (studentClass !== undefined) updateData.studentClass = studentClass;
    if (stream !== undefined)       updateData.stream       = stream;
    if (college !== undefined)      updateData.college      = college;
    if (jobTitle !== undefined)     updateData.jobTitle     = jobTitle;
    if (company !== undefined)      updateData.company      = company;
    if (domain !== undefined)       updateData.domain       = domain;
    if (targetRoles)     updateData.targetRoles    = targetRoles;
    if (experienceLevel) updateData.experienceLevel = experienceLevel;
    if (skills)          updateData.skills         = skills;
    if (goals)           updateData.goals          = goals;
    if (bio !== undefined)          updateData.bio          = bio;
    if (onboarded !== undefined)    updateData.onboarded    = onboarded;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: updateData },
      {
        new: true,          // return updated doc
        upsert: true,       // create if doesn't exist
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      data: user
    });
  } catch (error) {
    console.error('Save profile error:', error);
    // Handle duplicate key (email conflict on a different clerkId)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use by another account' });
    }
    res.status(500).json({ success: false, message: 'Failed to save profile', error: error.message });
  }
});

// ── GET /api/users/profile/:clerkId — fetch full user profile ─────────────────
router.get('/profile/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
});

// ── GET /api/users/stats/:clerkId — real stats from completed interviews ────
router.get('/stats/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const interviews = await Interview.find({ userId: req.params.clerkId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('title jobPosition overallScore status completedAt duration analysis');

    const completed = interviews.filter(i => i.status === 'completed');
    const scores    = completed.map(i => i.overallScore).filter(s => s > 0);
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const techScores = completed.map(i => i.analysis?.technicalSkills).filter(Boolean);
    const commScores = completed.map(i => i.analysis?.communication).filter(Boolean);
    const psScores   = completed.map(i => i.analysis?.problemSolving).filter(Boolean);
    const confScores = completed.map(i => i.analysis?.confidence).filter(Boolean);

    const recentActivity = interviews.slice(0, 6).map(i => ({
      type:        'interview',
      description: i.title || `${i.jobPosition} Interview`,
      score:       i.overallScore || null,
      date:        i.completedAt || i.createdAt,
      status:      i.status
    }));

    res.status(200).json({
      success: true,
      data: {
        totalInterviews:        user.stats.totalInterviews        || interviews.length,
        completedInterviews:    user.stats.completedInterviews    || completed.length,
        averageScore:           user.stats.averageScore           || avg(scores),
        totalPracticeTime:      user.stats.totalPracticeTime      || completed.reduce((s, i) => s + (i.duration || 0), 0),
        totalQuestionsAnswered: user.stats.totalQuestionsAnswered || 0,
        assessmentsTaken:       user.stats.assessmentsTaken       || 0,
        skills: [
          { name: 'Technical',       score: techScores.length ? avg(techScores) : avg(scores) },
          { name: 'Communication',   score: commScores.length ? avg(commScores) : avg(scores) },
          { name: 'Problem Solving', score: psScores.length   ? avg(psScores)   : avg(scores) },
          { name: 'Confidence',      score: confScores.length ? avg(confScores) : avg(scores) }
        ],
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
});

export default router;