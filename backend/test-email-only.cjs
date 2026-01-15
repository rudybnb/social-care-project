require('dotenv').config();
const nodemailer = require('nodemailer');

const toEmail = 'laurenalecia@eclesia.co.uk';

async function testEmail() {
    console.log('📧 Testing Email Service...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`User: ${process.env.SMTP_USER}`);
    console.log(`Target: ${toEmail}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verification successful.');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: toEmail,
            subject: 'Debug Test Email - Typo Fix Verification',
            text: 'This is a test email to verify that the email service is working and the corrected address (eclesia.co.uk) is valid.\n\nSent from debugging session.',
        });

        console.log('✅ Email sent successfully!');
        console.log(`Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Email test failed:', error);
    }
}

testEmail();
