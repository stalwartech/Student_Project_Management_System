const env = require('dotenv').config();
const URI = process.env.URI;
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(URI), console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = connectDB;