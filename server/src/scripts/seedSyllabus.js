import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import connectDB from '../config/db.js';

dotenv.config();

const gateSyllabus = [
  {
    name: 'Database Management Systems',
    shortName: 'DBMS',
    description: 'Databases, ER models, SQL, and transactions',
    order: 1,
    weightage: 10,
    topics: [
      {
        name: 'ER Model',
        description: 'Entity Relationship modeling and diagrams',
        order: 1,
        subtopics: [
          { name: 'Entities and Attributes', order: 1 },
          { name: 'Relationships', order: 2 }
        ]
      },
      {
        name: 'Relational Model',
        description: 'Relational algebra and calculus',
        order: 2,
        subtopics: [
          { name: 'Relational Algebra', order: 1 },
          { name: 'Tuple Calculus', order: 2 }
        ]
      },
      {
        name: 'SQL',
        description: 'Structured Query Language',
        order: 3,
        subtopics: []
      },
      {
        name: 'Normalization',
        description: 'Database normalization forms',
        order: 4,
        subtopics: [
          { name: 'Functional Dependencies', order: 1 },
          { name: '1NF, 2NF, 3NF', order: 2 },
          { name: 'BCNF', order: 3 }
        ]
      }
    ]
  },
  {
    name: 'Operating Systems',
    shortName: 'OS',
    description: 'Processes, memory, and file systems',
    order: 2,
    weightage: 12,
    topics: [
      {
        name: 'Processes',
        description: 'Process concepts and scheduling',
        order: 1,
        subtopics: [
          { name: 'Process State', order: 1 },
          { name: 'CPU Scheduling', order: 2 }
        ]
      },
      {
        name: 'Threads',
        description: 'Multithreading models',
        order: 2,
        subtopics: []
      },
      {
        name: 'Deadlocks',
        description: 'Deadlock detection and prevention',
        order: 3,
        subtopics: [
          { name: "Banker's Algorithm", order: 1 }
        ]
      }
    ]
  },
  {
    name: 'Computer Networks',
    shortName: 'CN',
    description: 'OSI model, routing, and protocols',
    order: 3,
    weightage: 8,
    topics: [
      {
        name: 'Network Layer',
        description: 'IPv4, IPv6, routing',
        order: 1,
        subtopics: [
          { name: 'IPv4 Addressing', order: 1 },
          { name: 'Routing Algorithms', order: 2 }
        ]
      }
    ]
  },
  {
    name: 'Data Structures',
    shortName: 'DS',
    description: 'Arrays, Trees, Graphs, Hashing',
    order: 4,
    weightage: 15,
    topics: [
      {
        name: 'Arrays & Linked Lists',
        order: 1,
        subtopics: [
          { name: '1D and 2D Arrays', order: 1 },
          { name: 'Singly Linked List', order: 2 }
        ]
      },
      {
        name: 'Trees',
        order: 2,
        subtopics: [
          { name: 'Binary Search Trees', order: 1 },
          { name: 'AVL Trees', order: 2 }
        ]
      }
    ]
  }
];

const seedSyllabus = async () => {
  try {
    await connectDB();

    const gateExam = await Exam.findOne({ name: /GATE/i });
    if (!gateExam) {
      console.error('Error: GATE exam not found in database. Run seedExams first.');
      process.exit(1);
    }

    console.log('Seeding GATE Syllabus...');

    // Clear old GATE subjects and topics to prevent duplicates on re-run
    const oldSubjects = await Subject.find({ examId: gateExam._id });
    const oldSubjectIds = oldSubjects.map(s => s._id);
    await Topic.deleteMany({ subjectId: { $in: oldSubjectIds } });
    await Subject.deleteMany({ examId: gateExam._id });

    // Seed new syllabus
    for (const subData of gateSyllabus) {
      const { topics, ...subjectFields } = subData;
      
      const subject = await Subject.create({
        ...subjectFields,
        examId: gateExam._id,
      });

      console.log(`Created subject: ${subject.name}`);

      for (const topicData of topics) {
        await Topic.create({
          examId: gateExam._id,
          subjectId: subject._id,
          name: topicData.name,
          description: topicData.description || '',
          order: topicData.order,
          subtopics: topicData.subtopics || []
        });
      }
    }

    console.log('GATE Syllabus seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedSyllabus();
