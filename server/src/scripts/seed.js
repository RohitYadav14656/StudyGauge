import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { Exam, Subject, Topic } from '../models/index.js';

// Load env vars
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing existing exam data...');
    await Exam.deleteMany();
    await Subject.deleteMany();
    await Topic.deleteMany();

    console.log('Seeding GATE CS data...');

    // 1. Create Exam
    const gateExam = await Exam.create({
      name: 'GATE CS',
      description: 'Graduate Aptitude Test in Engineering for Computer Science',
      level: 'Postgraduate',
      metadata: {
        targetAudience: 'CS Graduates',
        maxMarks: '100',
      },
    });

    console.log(`Created Exam: ${gateExam.name}`);

    // 2. Create Subjects
    const subjectsData = [
      {
        name: 'Data Structures and Algorithms',
        description: 'Core concepts of DSA',
        weightage: 15,
      },
      {
        name: 'Operating Systems',
        description: 'Process management, memory management, etc.',
        weightage: 10,
      },
      {
        name: 'Database Management Systems',
        description: 'Relational algebra, SQL, normalization',
        weightage: 8,
      },
    ];

    const createdSubjects = [];
    for (const sub of subjectsData) {
      const subject = await Subject.create({
        ...sub,
        examId: gateExam._id,
      });
      createdSubjects.push(subject);
      console.log(`Created Subject: ${subject.name}`);
    }

    const [dsa, os, dbms] = createdSubjects;

    // 3. Create Topics and Subtopics
    const topicsData = [
      // DSA Topics
      {
        subjectId: dsa._id,
        name: 'Arrays and Linked Lists',
        description: 'Basic linear data structures',
        subtopics: [
          { name: '1D and 2D Arrays' },
          { name: 'Singly Linked List' },
          { name: 'Doubly Linked List' },
        ],
      },
      {
        subjectId: dsa._id,
        name: 'Trees',
        description: 'Hierarchical data structures',
        subtopics: [
          { name: 'Binary Trees' },
          { name: 'Binary Search Trees (BST)' },
          { name: 'AVL Trees' },
        ],
      },
      // OS Topics
      {
        subjectId: os._id,
        name: 'Process Management',
        description: 'Processes, threads, and scheduling',
        subtopics: [
          { name: 'Process Control Block' },
          { name: 'CPU Scheduling Algorithms' },
        ],
      },
      // DBMS Topics
      {
        subjectId: dbms._id,
        name: 'Relational Model',
        description: 'Relational algebra and calculus',
        subtopics: [
          { name: 'Keys (Primary, Foreign, Candidate)' },
          { name: 'Relational Algebra Operations' },
        ],
      },
    ];

    for (const topicData of topicsData) {
      const topic = await Topic.create(topicData);
      console.log(`Created Topic: ${topic.name} with ${topic.subtopics.length} subtopics.`);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
