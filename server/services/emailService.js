const nodemailer = require('nodemailer');

// ── Transporter factory ────────────────────────────────────────────────────────
// In development with no valid SMTP credentials → auto-create an Ethereal
// catch-all account. Email preview URLs are logged to the console.
// In production → use the SMTP config from environment variables.

let _testTransporter = null;

const createTransporter = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isProduction || hasSmtp) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development fallback: reuse a single Ethereal account per process
  if (!_testTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    _testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[emailService] Using Ethereal test account:', testAccount.user);
  }
  return _testTransporter;
};

// ── HTML email base template ───────────────────────────────────────────────────
const emailBase = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background:#09090B;font-family:'Helvetica Neue',Arial,sans-serif;color:#FAFAFA;}
    .wrap{max-width:520px;margin:40px auto;background:#111113;border:1px solid #27272A;border-radius:16px;overflow:hidden;}
    .header{padding:28px 32px 0;font-size:22px;font-weight:700;color:#FAFAFA;}
    .header span{color:#3B82F6;}
    .body{padding:24px 32px 32px;}
    p{margin:0 0 20px;font-size:15px;line-height:1.6;color:#A1A1AA;}
    .btn{display:inline-block;padding:12px 28px;background:#3B82F6;color:#fff !important;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;}
    .footer{padding:16px 32px;border-top:1px solid #27272A;font-size:12px;color:#52525B;}
    .token-box{background:#18181B;border:1px solid #27272A;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:13px;word-break:break-all;color:#FAFAFA;margin:0 0 20px;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">Skill<span>Sync</span></div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">
      If you did not request this, you can safely ignore this email.
      &copy; ${new Date().getFullYear()} SkillSync. All rights reserved.
    </div>
  </div>
</body>
</html>`;

// ── Helper: send and log preview URL in dev ────────────────────────────────────
const sendMail = async (options) => {
  const transporter = await createTransporter();
  const info = await transporter.sendMail(options);

  if (process.env.NODE_ENV !== 'production') {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log(`[emailService] Preview URL → ${preview}`);
    }
  }

  return info;
};

/**
 * Sends the email verification email.
 * On SMTP failure, logs the error server-side — never crashes the request.
 *
 * @param {{ name: string, email: string }} user
 * @param {string} rawToken
 */
const sendVerificationEmail = async (user, rawToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;

  const html = emailBase(
    'Verify your SkillSync email',
    `<p>Hi <strong>${user.name}</strong>,</p>
     <p>Thanks for signing up! Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
     <p><a href="${verifyUrl}" class="btn">Verify Email Address</a></p>
     <p style="margin-top:20px;font-size:13px">Or paste this link into your browser:</p>
     <div class="token-box">${verifyUrl}</div>`
  );

  const text = `Hi ${user.name},\n\nVerify your SkillSync email:\n${verifyUrl}\n\nThis link expires in 24 hours.`;

  try {
    await sendMail({
      from: process.env.EMAIL_FROM || '"SkillSync" <noreply@skillsync.dev>',
      to: user.email,
      subject: 'Verify your SkillSync email address',
      text,
      html,
    });
  } catch (err) {
    console.error('[emailService] Failed to send verification email:', err.message);
    // Swallow — caller returns a generic success message regardless
  }
};

/**
 * Sends the password reset email.
 * On SMTP failure, logs the error server-side — never crashes the request.
 *
 * @param {{ name: string, email: string }} user
 * @param {string} rawToken
 */
const sendPasswordResetEmail = async (user, rawToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

  const html = emailBase(
    'Reset your SkillSync password',
    `<p>Hi <strong>${user.name}</strong>,</p>
     <p>We received a request to reset your password. Click the button below. This link expires in <strong>30 minutes</strong>.</p>
     <p><a href="${resetUrl}" class="btn">Reset Password</a></p>
     <p style="margin-top:20px;font-size:13px">Or paste this link into your browser:</p>
     <div class="token-box">${resetUrl}</div>`
  );

  const text = `Hi ${user.name},\n\nReset your SkillSync password:\n${resetUrl}\n\nThis link expires in 30 minutes.`;

  try {
    await sendMail({
      from: process.env.EMAIL_FROM || '"SkillSync" <noreply@skillsync.dev>',
      to: user.email,
      subject: 'Reset your SkillSync password',
      text,
      html,
    });
  } catch (err) {
    console.error('[emailService] Failed to send password reset email:', err.message);
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
