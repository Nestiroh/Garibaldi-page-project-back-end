const nodemailer = require('nodemailer');
require('dotenv').config(); 

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS,   
    },
    tls: {
        rejectUnauthorized: false // Ignorar certificados no confiables
    }
});

module.exports = transporter;


