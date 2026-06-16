const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses — List all courses (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, difficulty } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (difficulty) {
      filter.difficulty = difficulty;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });

    // Map _id to id for frontend compatibility
    const mapped = courses.map((c) => {
      const obj = c.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.json({ success: true, courses: mapped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/courses/categories — Get unique categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category');
    res.json({ success: true, categories: categories.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/courses/:id — Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const obj = course.toObject();
    obj.id = obj._id.toString();
    res.json({ success: true, course: obj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/courses — Create course (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.create(req.body);
    const obj = course.toObject();
    obj.id = obj._id.toString();
    res.status(201).json({ success: true, course: obj, id: obj.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/courses/:id — Update course (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const obj = course.toObject();
    obj.id = obj._id.toString();
    res.json({ success: true, course: obj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/courses/:id — Delete course (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/courses/:id/enroll — Enroll in course (logged in users)
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
      
      // Optionally increment course enrolledCount
      course.enrolledCount = (course.enrolledCount || 0) + 1;
      await course.save();
    }

    // Return the updated populated user info
    const populatedUser = await User.findById(req.user._id).populate('enrolledCourses');
    const mappedCourses = (populatedUser.enrolledCourses || []).map((c) => {
      const obj = c.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.json({ success: true, message: 'Successfully enrolled', enrolledCourses: mappedCourses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/courses/:id/enroll — Unenroll from a course
router.delete('/:id/enroll', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== courseId.toString());
      await user.save();
      
      course.enrolledCount = Math.max(0, (course.enrolledCount || 1) - 1);
      await course.save();
    }

    const populatedUser = await User.findById(req.user._id).populate('enrolledCourses');
    const mappedCourses = (populatedUser.enrolledCourses || []).map((c) => {
      const obj = c.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.json({ success: true, message: 'Successfully unenrolled', enrolledCourses: mappedCourses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
