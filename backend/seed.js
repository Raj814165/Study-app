/**
 * Seed Script — Creates admin user and demo courses in MongoDB
 * Run: cd backend && node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');

const ADMIN_DATA = {
  name: 'Admin',
  email: 'm@admin.com',
  password: 'coading',
  role: 'admin',
};

const STUDENT_DATA = {
  name: 'Alex Student',
  email: 'student@demo.com',
  password: 'student123',
  role: 'user',
};

const DEMO_COURSES = [
  {
    title: 'Class 11 Physics: Kinematics & Mechanics',
    description: 'Complete Physics Mechanics course for NEET 2026. This high-yield course covers 1D and 2D kinematics, laws of motion, friction, work-power-energy, and circular motion with detailed numerical practice.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600',
    duration: '22h 15m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 15430,
    enrolledCount: 89000,
    videoUrl: 'https://www.youtube.com/watch?v=25jxGPMF1rM',
    lessons: [
      { title: 'Units and Measurements - One Shot', videoUrl: 'https://www.youtube.com/watch?v=25jxGPMF1rM', duration: '2:15:30' },
      { title: 'Motion in a Straight Line', videoUrl: 'https://www.youtube.com/watch?v=8-wgK0zAaqI', duration: '3:22:15' },
      { title: 'Laws of Motion & Friction', videoUrl: 'https://www.youtube.com/watch?v=Cx73VWk_Rak', duration: '2:35:40' },
      { title: 'Work, Energy, and Power', videoUrl: 'https://www.youtube.com/watch?v=k_rCYiorZzs', duration: '2:28:10' }
    ]
  },
  {
    title: 'Class 11 Physics: Rotational Motion & Gravitation',
    description: 'Master Rotational Dynamics, Center of Mass, Moment of Inertia, and Gravitation for NEET. Learn tricks to solve complex multi-body problems quickly.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600',
    duration: '14h 45m',
    difficulty: 'Advanced',
    rating: 4.8,
    reviewCount: 9812,
    enrolledCount: 62000,
    videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
    lessons: [
      { title: 'Center of Mass & Rotational Motion', videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw', duration: '3:45:00' },
      { title: 'Gravitation - Complete One Shot', videoUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', duration: '2:50:30' }
    ]
  },
  {
    title: 'Class 11 Physics: Properties of Matter & Fluids',
    description: 'Detailed study of elasticity, viscosity, surface tension, and fluid dynamics for medical aspirants. Strictly based on NCERT guidelines.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600',
    duration: '10h 30m',
    difficulty: 'Intermediate',
    rating: 4.7,
    reviewCount: 5410,
    enrolledCount: 41000,
    videoUrl: 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
    lessons: [
      { title: 'Mechanical Properties of Solids', videoUrl: 'https://www.youtube.com/watch?v=QUT1VHiLmmI', duration: '2:15:00' },
      { title: 'Fluid Mechanics - One Shot', videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg', duration: '3:30:15' }
    ]
  },
  {
    title: 'Class 11 Physics: Thermodynamics & Waves',
    description: 'Covering thermal expansion, calorimetry, heat transfer, kinetic theory of gases, thermodynamics cycles, and waves/oscillations.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
    duration: '18h 20m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 12040,
    enrolledCount: 78000,
    videoUrl: 'https://www.youtube.com/watch?v=UO98lJQ3QGI',
    lessons: [
      { title: 'Thermodynamics & Heat Transfer', videoUrl: 'https://www.youtube.com/watch?v=UO98lJQ3QGI', duration: '4:15:00' },
      { title: 'Simple Harmonic Motion (SHM)', videoUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', duration: '3:10:45' }
    ]
  },
  {
    title: 'Class 12 Physics: Electrostatics & Potential',
    description: 'Understand electric charge, Coulomb\'s law, electric fields, Gauss theorem, electric potential, and capacitance with detailed NEET questions.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=600',
    duration: '16h 50m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 14500,
    enrolledCount: 91000,
    videoUrl: 'https://www.youtube.com/watch?v=30CYAV6YSbk',
    lessons: [
      { title: 'Electric Charges & Fields One Shot', videoUrl: 'https://www.youtube.com/watch?v=30CYAV6YSbk', duration: '4:35:00' },
      { title: 'Electrostatic Potential & Capacitance', videoUrl: 'https://www.youtube.com/watch?v=vn3tm0quoqE', duration: '3:50:30' }
    ]
  },
  {
    title: 'Class 12 Physics: Current Electricity',
    description: 'Drift velocity, Ohm\'s law, Kirchhoff\'s rules, Wheatstone bridge, potentiometer, and heating effects of current. Ideal for NEET revision.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1517420784937-87528255b8eb?w=600',
    duration: '12h 10m',
    difficulty: 'Intermediate',
    rating: 4.8,
    reviewCount: 8740,
    enrolledCount: 55000,
    videoUrl: 'https://www.youtube.com/watch?v=9kRgVxULbag',
    lessons: [
      { title: 'Current Electricity - MahaRevision', videoUrl: 'https://www.youtube.com/watch?v=9kRgVxULbag', duration: '5:10:00' },
      { title: 'Potentiometer & Meter Bridge', videoUrl: 'https://www.youtube.com/watch?v=obH0Po_RGBk', duration: '2:30:15' }
    ]
  },
  {
    title: 'Class 12 Physics: Magnetism & Induction',
    description: 'Magnetic effects of current, Biot-Savart law, Ampere\'s law, electromagnetic induction, Faraday\'s law, Lenz\'s law, and alternating current.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600',
    duration: '20h 40m',
    difficulty: 'Advanced',
    rating: 4.8,
    reviewCount: 11090,
    enrolledCount: 71000,
    videoUrl: 'https://www.youtube.com/watch?v=ur6I5m2nTvk',
    lessons: [
      { title: 'Moving Charges & Magnetism', videoUrl: 'https://www.youtube.com/watch?v=ur6I5m2nTvk', duration: '4:20:00' },
      { title: 'Electromagnetic Induction (EMI)', videoUrl: 'https://www.youtube.com/watch?v=nQVCkqvU1uE', duration: '3:45:30' }
    ]
  },
  {
    title: 'Class 12 Physics: Ray Optics & Wave Optics',
    description: 'Complete optics course including reflection, refraction, lenses, prisms, optical instruments, interference, diffraction, and polarization.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600',
    duration: '22h 30m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 16500,
    enrolledCount: 98000,
    videoUrl: 'https://www.youtube.com/watch?v=5LrDIWkK_Bc',
    lessons: [
      { title: 'Ray Optics - Complete One Shot', videoUrl: 'https://www.youtube.com/watch?v=5LrDIWkK_Bc', duration: '5:45:00' },
      { title: 'Wave Optics - Complete One Shot', videoUrl: 'https://www.youtube.com/watch?v=9kRgVxULbag', duration: '4:15:30' }
    ]
  },
  {
    title: 'Class 12 Physics: Modern Physics & Semiconductors',
    description: 'Dual nature of radiation, atoms, nuclei, semiconductor diodes, transistors, and logic gates. Highly scoring section for NEET.',
    instructor: 'Alakh Pandey',
    category: 'Physics',
    thumbnail: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600',
    duration: '15h 15m',
    difficulty: 'Intermediate',
    rating: 4.9,
    reviewCount: 13900,
    enrolledCount: 84000,
    videoUrl: 'https://www.youtube.com/watch?v=25jxGPMF1rM',
    lessons: [
      { title: 'Dual Nature of Matter & Atoms', videoUrl: 'https://www.youtube.com/watch?v=25jxGPMF1rM', duration: '3:15:00' },
      { title: 'Semiconductor Electronics & Gates', videoUrl: 'https://www.youtube.com/watch?v=8-wgK0zAaqI', duration: '4:10:45' }
    ]
  },
  {
    title: 'Class 11 Chemistry: Mole Concept & Structure of Atom',
    description: 'Learn structural chemistry and physical calculation principles including stoichiometry, empirical formula, Bohr model, and quantum numbers.',
    instructor: 'Pankaj Sir',
    category: 'Chemistry',
    thumbnail: 'https://images.unsplash.com/photo-1603126852811-376a661614f1?w=600',
    duration: '12h 40m',
    difficulty: 'Intermediate',
    rating: 4.8,
    reviewCount: 7850,
    enrolledCount: 49000,
    videoUrl: 'https://www.youtube.com/watch?v=dN6safFWWPg',
    lessons: [
      { title: 'Some Basic Concepts of Chemistry', videoUrl: 'https://www.youtube.com/watch?v=dN6safFWWPg', duration: '3:10:00' },
      { title: 'Structure of Atom One Shot', videoUrl: 'https://www.youtube.com/watch?v=3hJ2W6EUMR4', duration: '3:45:30' }
    ]
  },
  {
    title: 'Class 11 Chemistry: Classification & Bonding',
    description: 'In-depth study of periodic table properties, chemical bonding, hybridization, VSEPR theory, molecular orbital theory, and hydrogen bonding.',
    instructor: 'Pankaj Sir',
    category: 'Chemistry',
    thumbnail: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600',
    duration: '16h 20m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 11040,
    enrolledCount: 73000,
    videoUrl: 'https://www.youtube.com/watch?v=04lpu10ldrQ',
    lessons: [
      { title: 'Classification of Elements & Periodicity', videoUrl: 'https://www.youtube.com/watch?v=04lpu10ldrQ', duration: '2:30:00' },
      { title: 'Chemical Bonding & Molecular Structure', videoUrl: 'https://www.youtube.com/watch?v=W8dAATfMKtg', duration: '4:50:45' }
    ]
  },
  {
    title: 'Class 11 Chemistry: Organic Chemistry Basics (GOC)',
    description: 'Complete basic organic chemistry. Understand electronic effects, inductive effect, resonance, hyperconjugation, isomerism, and reaction intermediates.',
    instructor: 'Pankaj Sir',
    category: 'Chemistry',
    thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600',
    duration: '18h 10m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 12500,
    enrolledCount: 81000,
    videoUrl: 'https://www.youtube.com/watch?v=W8dAATfMKtg',
    lessons: [
      { title: 'General Organic Chemistry (GOC) - Part 1', videoUrl: 'https://www.youtube.com/watch?v=W8dAATfMKtg', duration: '5:20:00' },
      { title: 'General Organic Chemistry (GOC) - Part 2', videoUrl: 'https://www.youtube.com/watch?v=dN6safFWWPg', duration: '4:45:15' }
    ]
  },
  {
    title: 'Class 12 Chemistry: Kinetics & Electrochemistry',
    description: 'Learn about galvanic cells, Nernst equation, electrolytic conductance, Faraday laws, rate of reaction, order of reaction, and activation energy.',
    instructor: 'Pankaj Sir',
    category: 'Chemistry',
    thumbnail: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600',
    duration: '14h 50m',
    difficulty: 'Intermediate',
    rating: 4.8,
    reviewCount: 9230,
    enrolledCount: 59000,
    videoUrl: 'https://www.youtube.com/watch?v=9kRgVxULbag',
    lessons: [
      { title: 'Electrochemistry Complete One Shot', videoUrl: 'https://www.youtube.com/watch?v=9kRgVxULbag', duration: '4:15:00' },
      { title: 'Chemical Kinetics One Shot', videoUrl: 'https://www.youtube.com/watch?v=obH0Po_RGBk', duration: '3:45:30' }
    ]
  },
  {
    title: 'Class 12 Chemistry: Organic Reactions & Mechanisms',
    description: 'Understand haloalkanes, alcohols, phenols, ethers, aldehydes, ketones, carboxylic acids, and amines with mechanisms and named reactions.',
    instructor: 'Pankaj Sir',
    category: 'Chemistry',
    thumbnail: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600',
    duration: '24h 15m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 14900,
    enrolledCount: 92000,
    videoUrl: 'https://www.youtube.com/watch?v=ur6I5m2nTvk',
    lessons: [
      { title: 'Haloalkanes and Haloarenes', videoUrl: 'https://www.youtube.com/watch?v=ur6I5m2nTvk', duration: '4:30:00' },
      { title: 'Alcohols, Phenols and Ethers', videoUrl: 'https://www.youtube.com/watch?v=nQVCkqvU1uE', duration: '5:20:15' },
      { title: 'Aldehydes, Ketones and Carboxylic Acids', videoUrl: 'https://www.youtube.com/watch?v=5LrDIWkK_Bc', duration: '6:15:40' }
    ]
  },
  {
    title: 'Class 11 Biology: Cell Biology & Biomolecules',
    description: 'Master cell structure, cell organelles, mitosis, meiosis, and biochemistry principles (proteins, carbohydrates, lipids, nucleic acids).',
    instructor: 'Tarun Sir & MD Sir',
    category: 'Biology',
    thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600',
    duration: '12h 30m',
    difficulty: 'Beginner',
    rating: 4.9,
    reviewCount: 11090,
    enrolledCount: 77000,
    videoUrl: 'https://www.youtube.com/watch?v=h93t-Y8JAT4',
    lessons: [
      { title: 'Cell: The Unit of Life', videoUrl: 'https://www.youtube.com/watch?v=h93t-Y8JAT4', duration: '3:10:00' },
      { title: 'Cell Cycle and Cell Division', videoUrl: 'https://www.youtube.com/watch?v=lMwdorFoGtk', duration: '2:50:30' }
    ]
  },
  {
    title: 'Class 11 Biology: Human Physiology Complete',
    description: 'Digestive system, breathing & respiration, body fluids & circulation, excretory products, locomotion, neural control, and chemical coordination.',
    instructor: 'Tarun Sir & MD Sir',
    category: 'Biology',
    thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600',
    duration: '28h 45m',
    difficulty: 'Intermediate',
    rating: 4.9,
    reviewCount: 19430,
    enrolledCount: 121000,
    videoUrl: 'https://www.youtube.com/watch?v=ZCEs2xWnvl4',
    lessons: [
      { title: 'Breathing and Exchange of Gases', videoUrl: 'https://www.youtube.com/watch?v=ZCEs2xWnvl4', duration: '3:15:00' },
      { title: 'Body Fluids and Circulation', videoUrl: 'https://www.youtube.com/watch?v=ynUK8zXMulY', duration: '4:20:30' }
    ]
  },
  {
    title: 'Class 12 Biology: Genetics & Evolution',
    description: 'Mendelian inheritance, molecular genetics, replication, transcription, translation, DNA fingerprinting, and theories of origin and evolution.',
    instructor: 'Tarun Sir & MD Sir',
    category: 'Biology',
    thumbnail: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600',
    duration: '22h 10m',
    difficulty: 'Advanced',
    rating: 4.9,
    reviewCount: 16900,
    enrolledCount: 104000,
    videoUrl: 'https://www.youtube.com/watch?v=ZCEs2xWnvl4',
    lessons: [
      { title: 'Principles of Inheritance and Variation', videoUrl: 'https://www.youtube.com/watch?v=ZCEs2xWnvl4', duration: '5:40:00' },
      { title: 'Molecular Basis of Inheritance', videoUrl: 'https://www.youtube.com/watch?v=ynUK8zXMulY', duration: '6:15:30' }
    ]
  },
  {
    title: 'Class 12 Biology: Biotechnology & Ecology',
    description: 'Genetic engineering tools, PCR, recombinant DNA, applications in medicine & agriculture, ecosystems, biodiversity, and environmental issues.',
    instructor: 'Tarun Sir & MD Sir',
    category: 'Biology',
    thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600',
    duration: '18h 50m',
    difficulty: 'Intermediate',
    rating: 4.8,
    reviewCount: 12090,
    enrolledCount: 79000,
    videoUrl: 'https://www.youtube.com/watch?v=h93t-Y8JAT4',
    lessons: [
      { title: 'Biotechnology: Principles & Processes', videoUrl: 'https://www.youtube.com/watch?v=h93t-Y8JAT4', duration: '4:30:00' },
      { title: 'Organisms and Populations', videoUrl: 'https://www.youtube.com/watch?v=lMwdorFoGtk', duration: '3:20:30' }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin
    const admin = await User.create(ADMIN_DATA);
    console.log(`👤 Admin created: ${admin.email} (password: ${ADMIN_DATA.password})`);

    // Create student
    const student = await User.create(STUDENT_DATA);
    console.log(`👤 Student created: ${student.email} (password: ${STUDENT_DATA.password})`);

    // Create courses
    const courses = await Course.insertMany(DEMO_COURSES);
    console.log(`📚 ${courses.length} courses created`);

    console.log('\n✅ Seed complete!\n');
    console.log('──────────────────────────────────────');
    console.log('  Admin Login:');
    console.log(`  Email:    ${ADMIN_DATA.email}`);
    console.log(`  Password: ${ADMIN_DATA.password}`);
    console.log('──────────────────────────────────────');
    console.log('  Student Login:');
    console.log(`  Email:    ${STUDENT_DATA.email}`);
    console.log(`  Password: ${STUDENT_DATA.password}`);
    console.log('──────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seed();
