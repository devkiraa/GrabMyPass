import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import figlet from 'figlet';
import { authRouter } from './routes/auth';
import { apiRouter } from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
morgan.token('time', () => new Date().toLocaleString());
app.use(morgan('[:time] :method :status :response-time ms :url'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/grabmypass')
    .then(() => console.log('✅ Connected to MongoDB Database'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => res.send('GrabMyPass API Running'));
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// Start Server
app.listen(PORT, () => {
    figlet('GrabMyPass', (err, data) => {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data);
        console.log(`
Welcome to GrabMyPass Backend Server

Date:         ${new Date().toLocaleDateString()}
Time:         ${new Date().toLocaleTimeString()}
TimeStamp:    ${new Date().toISOString()}

✅ HTTP server running on port ${PORT}
🔗 Local URL:  http://localhost:${PORT}
`);
    });
});
