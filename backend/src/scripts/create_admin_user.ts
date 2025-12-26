import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const createAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to DB');

        const email = 'admin@grab.in';
        const password = '111111';
        const hashedPassword = await bcrypt.hash(password, 12);

        // Check if exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('Admin user already exists. Updating password and role...');
            user.password = hashedPassword;
            user.role = 'admin';
            await user.save();
        } else {
            console.log('Creating new admin user...');
            user = await User.create({
                email,
                password: hashedPassword,
                name: 'System Admin',
                role: 'admin',
                username: 'admin'
            });
        }

        console.log(`
✅ Admin User Set Up:
📧 Email: ${email}
🔑 Password: ${password}
        `);

        process.exit(0);
    } catch (error) {
        console.error('Failed to create admin:', error);
        process.exit(1);
    }
};

createAdminUser();
