import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import connectDB from '../config/db.js';

dotenv.config();

const examsToSeed = [
  {
    name: 'GATE',
    description: 'Graduate Aptitude Test in Engineering',
    level: 'Postgraduate',
  },
  {
    name: 'CAT',
    description: 'Common Admission Test',
    level: 'Postgraduate',
  },
  {
    name: 'UPSC',
    description: 'Union Public Service Commission Civil Services Examination',
    level: 'Postgraduate/Undergraduate',
  },
  {
    name: 'SSC CGL',
    description: 'Staff Selection Commission - Combined Graduate Level',
    level: 'Undergraduate',
  },
  {
    name: 'JEE',
    description: 'Joint Entrance Examination',
    level: 'Undergraduate',
  },
  {
    name: 'NEET',
    description: 'National Eligibility cum Entrance Test',
    level: 'Undergraduate',
  },
  {
    name: 'Banking',
    description: 'Banking sector exams (IBPS, SBI, etc.)',
    level: 'Undergraduate/Postgraduate',
  },
  {
    name: 'GRE',
    description: 'Graduate Record Examinations',
    level: 'Postgraduate',
  },
  {
    name: 'GMAT',
    description: 'Graduate Management Admission Test',
    level: 'Postgraduate',
  },
];

const seedExams = async () => {
  try {
    await connectDB();
    
    console.log('Clearing existing exams...');
    await Exam.deleteMany();
    
    console.log('Seeding exams...');
    await Exam.insertMany(examsToSeed);
    
    console.log('Exams seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedExams();
