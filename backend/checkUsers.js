require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
require('./models/Course');

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mithunsai211:T8I6YV8G2V3y7pCq@studyapp.ac-m20ymkq.mongodb.net/?retryWrites=true&w=majority&appName=studyapp')
  .then(async () => {
    console.log('Connected to DB');
    const users = await User.find().populate('enrolledCourses');
    console.log(JSON.stringify(users.map(u => ({ email: u.email, name: u.name, enrolled: u.enrolledCourses.map(c => c.title) })), null, 2));
    process.exit(0);
  });
