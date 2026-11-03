import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    const usersToSeed = [
      {
        name: 'Demo Student',
        email: 'student@example.com',
        password: 'password123',
        role: 'student',
        preferredStudyTime: 'morning',
        availableDailyHours: 4,
        preparationLevel: 'intermediate',
        targetInformation: 'GATE CS 2027 Top 500 AIR',
      },
      {
        name: 'System Admin',
        email: 'admin@study-gauge.com',
        password: 'admin123456',
        role: 'admin',
      },
      {
        name: 'Root Admin',
        email: process.env.ADMIN_EMAIL || 'namaste@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'ASDFGHJKL345678',
        role: 'admin',
      },
    ];

    for (const u of usersToSeed) {
      const existing = await User.findOne({ email: u.email });
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(u.password, salt);

      if (existing) {
        existing.passwordHash = passwordHash;
        existing.role = u.role;
        if (u.targetInformation) existing.targetInformation = u.targetInformation;
        await existing.save();
        console.log(`Updated user: ${u.email}`);
      } else {
        await User.create({
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          targetInformation: u.targetInformation,
        });
        console.log(`Created user: ${u.email}`);
      }
    }

    console.log('User seeding finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedUsers();

