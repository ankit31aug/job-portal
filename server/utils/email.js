const nodemailer = require('nodemailer');

let transporter = null;
let testAccount = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[Email] Using Ethereal test account:', testAccount.user);
    console.log('[Email] Preview emails at: https://ethereal.email');
  }

  return transporter;
}

const FROM = process.env.EMAIL_FROM || '"QCI Job Portal" <noreply@qci.org>';

async function sendMail({ to, subject, html }) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({ from: FROM, to, subject, html });
    if (testAccount) {
      console.log(`[Email] Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
}

// ── OTP Email ──────────────────────────────────────────────────────────────
function otpEmail(name, otp) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <h2 style="color:#1d4ed8;margin:0">Quality Council of India</h2>
        <p style="color:#6b7280;margin:4px 0 0">Job Portal — OTP Verification</p>
      </div>
      <p style="color:#374151">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151">Your One-Time Password for QCI Job Portal registration is:</p>
      <div style="text-align:center;margin:24px 0">
        <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#1d4ed8;background:#eff6ff;padding:16px 24px;border-radius:8px">${otp}</span>
      </div>
      <p style="color:#6b7280;font-size:13px">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#9ca3af;font-size:12px;text-align:center">Quality Council of India | careers@qci.org</p>
    </div>`;
}

// ── Application Confirmation ───────────────────────────────────────────────
function applicationConfirmEmail(name, jobTitle, company) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#1d4ed8">Application Received!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been successfully submitted.</p>
      <p style="color:#6b7280">Our team will review your application and get back to you. You can track your status on your dashboard.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#9ca3af;font-size:12px">QCI Job Portal | careers@qci.org</p>
    </div>`;
}

// ── Status Update Email ────────────────────────────────────────────────────
const STATUS_MESSAGES = {
  shortlisted: { emoji: '🎉', title: 'You have been Shortlisted!', color: '#059669', msg: 'Congratulations! Your application has been shortlisted. The hiring team will contact you for the next steps.' },
  interviewed: { emoji: '📅', title: 'Interview Scheduled', color: '#7c3aed', msg: 'You have been selected for an interview. Please check your email for further details from the hiring team.' },
  hired:        { emoji: '🏆', title: 'Offer Extended — Welcome to QCI!', color: '#1d4ed8', msg: 'We are delighted to extend you an offer! The HR team will contact you shortly with the onboarding details.' },
  rejected:     { emoji: '📋', title: 'Application Update', color: '#dc2626', msg: 'Thank you for your interest in this position. After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for future openings.' },
};

function statusUpdateEmail(name, jobTitle, status) {
  const s = STATUS_MESSAGES[status] || { emoji: '📌', title: 'Application Update', color: '#374151', msg: `Your application status has been updated to: ${status}.` };
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:${s.color}">${s.emoji} ${s.title}</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Regarding your application for <strong>${jobTitle}</strong>:</p>
      <p style="color:#374151">${s.msg}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#9ca3af;font-size:12px">QCI Job Portal | careers@qci.org</p>
    </div>`;
}

// ── New Application Alert (to employer/HR) ─────────────────────────────────
function newApplicationAlertEmail(hrName, applicantName, jobTitle, matchScore) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#1d4ed8">New Application Received</h2>
      <p>Hi <strong>${hrName}</strong>,</p>
      <p><strong>${applicantName}</strong> has applied for <strong>${jobTitle}</strong>.</p>
      <p>Match Score: <strong style="color:${matchScore >= 70 ? '#059669' : '#374151'}">${matchScore}%</strong>${matchScore >= 70 ? ' — <em>Auto-shortlisted</em>' : ''}</p>
      <p>Log in to the admin panel to review the application.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#9ca3af;font-size:12px">QCI Job Portal | careers@qci.org</p>
    </div>`;
}

module.exports = { sendMail, otpEmail, applicationConfirmEmail, statusUpdateEmail, newApplicationAlertEmail };
