import nodemailer from 'nodemailer';

const BOOKING_ALERT_TO = process.env.BOOKING_ALERT_TO || 'secretary@imatnsb-hqgh.com';

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function sender() {
  return process.env.MAIL_FROM || 'IMA Guesthouse <no-reply@imatnsb-hqgh.com>';
}

// Diagnostic: reports which SMTP vars are set and whether the server accepts the credentials.
// Never returns the password.
export async function verifyEmailConfig() {
  const present = {
    SMTP_HOST: Boolean(process.env.SMTP_HOST),
    SMTP_PORT: process.env.SMTP_PORT || null,
    SMTP_SECURE: process.env.SMTP_SECURE || null,
    SMTP_USER: Boolean(process.env.SMTP_USER),
    SMTP_PASS: Boolean(process.env.SMTP_PASS),
    MAIL_FROM: process.env.MAIL_FROM || null,
    BOOKING_ALERT_TO: process.env.BOOKING_ALERT_TO || null,
  };
  if (!hasSmtpConfig()) {
    return { configured: false, verified: false, present, error: 'One or more SMTP_* variables are missing.' };
  }
  try {
    await createTransport().verify();
    return { configured: true, verified: true, present };
  } catch (e) {
    return { configured: true, verified: false, present, error: e.message };
  }
}

export async function sendBookingConfirmation(booking) {
  if (!hasSmtpConfig()) return { delivered: false, reason: 'SMTP not configured' };

  const recipients = [BOOKING_ALERT_TO];
  if (booking.guestEmail) recipients.push(booking.guestEmail);

  const transport = createTransport();
  const subject = `Booking Confirmed: ${booking.id} · ${booking.selectedSpaceLabel}`;
  const text = [
    `Booking ID: ${booking.id}`,
    `Guest: ${booking.guestName}`,
    `Phone: ${booking.guestPhone || 'N/A'}`,
    `Email: ${booking.guestEmail || 'N/A'}`,
    `Space: ${booking.selectedSpaceLabel}`,
    `Checkin: ${new Date(booking.checkinDateTime).toLocaleString()}`,
    `Checkout: ${new Date(booking.checkoutDateTime).toLocaleString()}`,
    `Amount: INR ${booking.totalAmount}`,
    `Payment: ${booking.paymentMethod} (${booking.paymentStatus})`,
  ].join('\n');

  await transport.sendMail({
    from: sender(),
    to: recipients.join(','),
    subject,
    text,
  });

  return { delivered: true };
}

export async function sendOtpEmail({ guestName, guestEmail, guestPhone, otpCode }) {
  if (!hasSmtpConfig()) return { delivered: false, reason: 'SMTP not configured' };

  const recipients = [BOOKING_ALERT_TO];
  if (guestEmail) recipients.push(guestEmail);

  const transport = createTransport();
  await transport.sendMail({
    from: sender(),
    to: recipients.join(','),
    subject: 'IMA Guesthouse OTP Login Code',
    text: [
      `Guest: ${guestName}`,
      `Phone: ${guestPhone}`,
      `Your OTP is: ${otpCode}`,
      'This OTP expires in 10 minutes.',
    ].join('\n'),
  });

  return { delivered: true };
}
