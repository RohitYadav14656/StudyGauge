import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import PYQ from '../models/PYQ.js';

dotenv.config();

const samplePYQs = [
  {
    year: 2023,
    questionText: 'What is the derivative of x^2?',
    options: [
      { text: 'x', isCorrect: false },
      { text: '2x', isCorrect: true },
      { text: 'x^2', isCorrect: false },
      { text: '2', isCorrect: false },
    ],
    explanation: 'By the power rule, the derivative of x^n is n*x^(n-1). For x^2, it is 2*x^(2-1) = 2x.',
    difficulty: 'easy',
    tags: ['calculus', 'derivatives', 'math'],
  },
  {
    year: 2022,
    questionText: 'Which of the following is Newton\'s Second Law?',
    options: [
      { text: 'Every action has an equal and opposite reaction', isCorrect: false },
      { text: 'F = ma', isCorrect: true },
      { text: 'An object at rest stays at rest', isCorrect: false },
      { text: 'E = mc^2', isCorrect: false },
    ],
    explanation: 'Newton\'s Second Law states that force equals mass times acceleration (F = ma).',
    difficulty: 'easy',
    tags: ['physics', 'newton', 'mechanics'],
  },
  {
    year: 2021,
    questionText: 'Solve for x: 2x + 5 = 15',
    options: [
      { text: '5', isCorrect: true },
      { text: '10', isCorrect: false },
      { text: '20', isCorrect: false },
      { text: '2.5', isCorrect: false },
    ],
    explanation: 'Subtract 5 from both sides to get 2x = 10. Then divide by 2 to get x = 5.',
    difficulty: 'easy',
    tags: ['algebra', 'math'],
  },
  {
    year: 2023,
    questionText: 'What is the chemical formula for water?',
    options: [
      { text: 'H2O2', isCorrect: false },
      { text: 'CO2', isCorrect: false },
      { text: 'H2O', isCorrect: true },
      { text: 'O2', isCorrect: false },
    ],
    explanation: 'Water is composed of two hydrogen atoms and one oxygen atom, giving the formula H2O.',
    difficulty: 'easy',
    tags: ['chemistry', 'basics'],
  },
  {
    year: 2020,
    questionText: 'What is the integral of 1/x dx?',
    options: [
      { text: 'ln|x| + C', isCorrect: true },
      { text: 'x^2 / 2 + C', isCorrect: false },
      { text: '1/x^2 + C', isCorrect: false },
      { text: 'e^x + C', isCorrect: false },
    ],
    explanation: 'The antiderivative of 1/x is the natural logarithm of the absolute value of x, plus a constant C.',
    difficulty: 'medium',
    tags: ['calculus', 'integration', 'math'],
  }
];

const seedPYQs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    let exam = await Exam.findOne({ name: 'Demo Exam' });
    if (!exam) {
      exam = await Exam.create({ name: 'Demo Exam', description: 'A demo exam for testing PYQs' });
    }

    let subject = await Subject.findOne({ name: 'General Science & Math', examId: exam._id });
    if (!subject) {
      subject = await Subject.create({ name: 'General Science & Math', examId: exam._id });
    }

    await PYQ.deleteMany({ examId: exam._id });
    
    const pyqsToInsert = samplePYQs.map(pyq => ({
      ...pyq,
      examId: exam._id,
      subjectId: subject._id
    }));

    await PYQ.insertMany(pyqsToInsert);

    console.log('Sample PYQs seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedPYQs();
