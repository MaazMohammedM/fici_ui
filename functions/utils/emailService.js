const nodemailer = require('nodemailer');
const { getConfig } = require('../config/firebaseConfig');

// Send email using SMTP
async function sendEmail({ to, subject, html, text, cc, bcc }) {
  try {
    const config = getConfig();
    
    // Create transporter directly (no caching for now to avoid issues)
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    
    const mailOptions = {
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to,
      subject,
      text,
      html,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

module.exports = {
  sendEmail
};
