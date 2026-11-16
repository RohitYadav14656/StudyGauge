import { seedQuestions } from './seedChallengingQuestions.js';

seedQuestions()
  .then(() => {
    console.log('PYQ Seeding Finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during PYQ seeding:', err);
    process.exit(1);
  });
