const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  videoUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    default: '',
  },
  duration: {
    type: String,
    default: '',
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  enrolledCount: {
    type: Number,
    default: 0,
  },
  lessons: [lessonSchema],
}, {
  timestamps: true,
});

// Text index for search
courseSchema.index({ title: 'text', description: 'text', instructor: 'text', category: 'text' });

module.exports = mongoose.model('Course', courseSchema);
