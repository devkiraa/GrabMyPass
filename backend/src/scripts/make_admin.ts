import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const email = process.argv[2];

if (!email) {
    console.log('Usage: npx ts-node src/scripts/make_admin.ts <email>');
    process.exit(1);
}

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to DB');

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`✅ User ${email} is now an ADMIN`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

makeAdmin();
