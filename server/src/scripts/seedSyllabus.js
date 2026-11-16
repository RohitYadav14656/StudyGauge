import { seedAllExamsSyllabus } from './seedAllSyllabus.js';

seedAllExamsSyllabus()
  .then(() => {
    console.log('Complete Syllabus Seeding Finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during syllabus seeding:', err);
    process.exit(1);
  });
