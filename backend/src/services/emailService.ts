import nodemailer from 'nodemailer';
import { emailTemplates } from '../utils/emailTemplates';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

type EmailType = keyof typeof emailTemplates;

export const sendEmail = async <T extends EmailType>(
  to: string,
  type: T,
  data: Parameters<typeof emailTemplates[T]>[0]
) => {
  try {
    const template = emailTemplates[type](data);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: template.subject,
      html: template.html
    });

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};