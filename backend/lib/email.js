const { Resend } = require('resend');

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.EMAIL_FROM || 'SHIRA OT Tracker <noreply@mail.shiraai.in>';
const APP_URL = process.env.FRONTEND_URL || 'https://ottracker.shiraai.in';

// ── Shared layout wrapper ─────────────────────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr><td align="center">
      <!--[if mso]><table width="520"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09);">

        <!-- ── Header ── -->
        <tr><td style="background:linear-gradient(135deg,#0d1b2e 0%,#1a2744 100%);padding:28px 32px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;background:#0d1b2e;border-radius:8px;border:2px solid rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:20px;">⏱</span>
            </div>
            <div style="text-align:left;">
              <div style="font-size:20px;font-weight:800;color:#818cf8;letter-spacing:-0.5px;line-height:1.1;">SHIRA OT</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:2.5px;font-weight:600;">Overtime Tracker</div>
            </div>
          </div>
        </td></tr>

        <!-- ── Content ── -->
        ${content}

        <!-- ── Footer ── -->
        <tr><td style="background:#f8f9fb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
            This email was sent by <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;font-weight:600;">SHIRA OT Tracker</a>
          </p>
          <p style="margin:0;font-size:13px;color:#6b7280;">Made by <a href="https://shiraai.in" target="_blank" style="color:#6366f1;text-decoration:none;font-weight:700;font-size:14px;">SHIRA AI</a></p>
        </td></tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}

// ── OTP email (signup + reset) ────────────────────────────────────────────────
async function sendOtpEmail({ to, name, otp, purpose }) {
  const isReset = purpose === 'reset';

  const subject  = isReset
    ? 'Reset Your Password – SHIRA OT Tracker'
    : 'Verify Your Email – SHIRA OT Tracker';

  const heading  = isReset ? 'Password Reset Request' : 'Verify Your Email Address';
  const bodyLine = isReset
    ? `We received a request to reset the password for your SHIRA OT Tracker account. Use the code below to proceed:`
    : `You're one step away from activating your SHIRA OT Tracker account. Enter the verification code below:`;
  const footNote = isReset
    ? `If you didn't request a password reset, you can safely ignore this email. Your password won't change.`
    : `If you didn't create an account, you can safely ignore this email.`;

  const content = `
    <tr><td style="padding:36px 32px 24px;">
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.5px;">${heading}</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">Hi <strong>${name}</strong>, ${bodyLine}</p>

      <!-- OTP Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr><td align="center">
          <div style="display:inline-block;background:#f5f3ff;border:2px dashed #6366f1;border-radius:14px;padding:22px 48px;">
            <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#4f46e5;font-variant-numeric:tabular-nums;line-height:1;">${otp}</div>
          </div>
        </td></tr>
      </table>

      <!-- Meta info -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9fafb;border-radius:10px;padding:16px;margin:0 0 24px;">
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:4px 0;">⏳ <strong>Expires in:</strong> 5 minutes</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:4px 0;">🔒 <strong>Valid for:</strong> Single use only</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:4px 0;">🔄 <strong>Attempts allowed:</strong> 5 maximum</td>
        </tr>
      </table>

      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;border-top:1px solid #f3f4f6;padding-top:16px;">${footNote}</p>
    </td></tr>`;

  const html = layout(content);
  await resend.emails.send({ from: FROM, to, subject, html });
}

// ── Welcome email (after account activation) ─────────────────────────────────
async function sendWelcomeEmail({ to, name }) {
  const subject = 'Welcome to SHIRA OT Tracker!';

  const content = `
    <tr><td style="padding:36px 32px 24px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Welcome aboard, ${name}! 🎉</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">
        Your SHIRA OT Tracker account is now active. You're all set to start tracking your overtime with ease.
      </p>

      <!-- Feature highlights -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        ${[
          ['⏱', 'Track OT Sessions', 'Start and stop overtime sessions with one click.'],
          ['📊', 'Dashboard Analytics', 'See your daily, weekly and monthly OT at a glance.'],
          ['📥', 'Export to Excel', 'Download your OT history as a formatted Excel report.'],
          ['🔒', 'Secure & Private', 'Your data is encrypted and only accessible to you.'],
        ].map(([icon, title, desc]) => `
        <tr><td style="padding:8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;font-size:20px;vertical-align:top;padding-top:2px;">${icon}</td>
              <td style="padding-left:8px;">
                <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">${title}</div>
                <div style="font-size:13px;color:#6b7280;">${desc}</div>
              </td>
            </tr>
          </table>
        </td></tr>`).join('')}
      </table>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr><td align="center">
          <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
            Open SHIRA OT Tracker →
          </a>
        </td></tr>
      </table>

      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
        If you have any questions, reach out at <a href="mailto:connect.shiraai@gmail.com" style="color:#6366f1;text-decoration:none;">connect.shiraai@gmail.com</a>
      </p>
    </td></tr>`;

  const html = layout(content);
  await resend.emails.send({ from: FROM, to, subject, html });
}

module.exports = { sendOtpEmail, sendWelcomeEmail };
