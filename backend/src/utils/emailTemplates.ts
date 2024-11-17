interface EmailTemplates {
  welcome: {
    subject: string;
    html: string;
    data: { name: string };
  };
  passwordReset: {
    subject: string;
    html: string;
    data: { otp: string };
  };
  exchangeRequest: {
    subject: string;
    html: string;
    data: { bookTitle: string; requesterName: string };
  };
}

export const emailTemplates: {
  [K in keyof EmailTemplates]: (data: EmailTemplates[K]['data']) => Pick<EmailTemplates[K], 'subject' | 'html'>;
} = {
  welcome: (data) => ({
    subject: 'Welcome to Book Exchange Platform',
    html: `
      <h1>Welcome to Book Exchange Platform!</h1>
      <p>Hi ${data.name},</p>
      <p>Thank you for registering with Book Exchange Platform. We're excited to have you on board!</p>
      <p>You can now:</p>
      <ul>
        <li>List your books for exchange</li>
        <li>Browse available books</li>
        <li>Request exchanges</li>
      </ul>
      <p>Happy reading!</p>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password.</p>
      <p>Your OTP is: <strong>${data.otp}</strong></p>
      <p>This OTP will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  }),

  exchangeRequest: (data) => ({
    subject: 'New Exchange Request',
    html: `
      <h1>New Exchange Request</h1>
      <p>You have received a new exchange request for your book "${data.bookTitle}" from ${data.requesterName}.</p>
      <p>Please log in to your account to accept or decline this request.</p>
    `
  })
};