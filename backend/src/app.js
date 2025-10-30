const express = require('express');
const dotenv = require('dotenv');

console.log('Starting server...');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Resume optimization routes
app.use('/api/resume', require('./routes/resume'));

app.use('/api/transcribe', require('./routes/transcribe'));


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
