// seed.js
// Run with: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Board = require('./models/Board');
const List = require('./models/List');
const Task = require('./models/Task');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Board.deleteMany({});
        await List.deleteMany({});
        await Task.deleteMany({});

        console.log('Data cleared');

        // Create Admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: adminPassword, // Storing hashed password manually since we bypass pre-save hook? 
            // Actually creating via User.create triggers hooks unless we use insertMany with raw docs? 
            // User.create triggers hooks! But wait, my manual hash here + hook might double hash?
            // My User model checks if modified. 
            // If I pass plain text 'admin123', the hook will hash it.
            role: 'admin',
        });
        // Let's strictly rely on the hook for hashing, but I need to pass plain text. 
        // Wait, I passed hashed. The hook checks `isModified('password')`. It IS modified.
        // So it will hash the hash.
        // Correction: Pass plain password.

        // Deleting the above creation and doing it right.
        await User.deleteMany({});

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin'
        });

        console.log('Admin created: admin@example.com / admin123');

        // Create Normal User
        const normalUser = await User.create({
            name: 'John Doe',
            email: 'user@example.com',
            password: 'user123',
            role: 'user'
        });

        console.log('User created: user@example.com / user123');

        // Create Board
        const board = await Board.create({
            name: 'Project Alpha',
            owner: adminUser._id,
            members: [adminUser._id, normalUser._id]
        });

        console.log('Board created');

        // Create Lists
        const todoList = await List.create({
            name: 'To Do',
            board: board._id,
            position: 0
        });

        const inProgressList = await List.create({
            name: 'In Progress',
            board: board._id,
            position: 1
        });

        const doneList = await List.create({
            name: 'Done',
            board: board._id,
            position: 2
        });

        console.log('Lists created');

        // Create Tasks
        await Task.create({
            title: 'Design Database Schema',
            description: 'Define models for User, Board, List, Task',
            board: board._id,
            list: todoList._id,
            assignedUsers: [adminUser._id],
            position: 0
        });

        await Task.create({
            title: 'Setup React Project',
            description: 'Initialize Vite and Tailwind',
            board: board._id,
            list: inProgressList._id,
            assignedUsers: [normalUser._id],
            position: 0
        });

        console.log('Tasks created');

        console.log('Seeding completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
