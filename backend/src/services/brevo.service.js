const nodemailer = require('nodemailer');

let transporter;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.BREVO_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendBrevoEmail = async ({ to, subject, text, html }) => {
  const transport = createTransporter();

  if (!transport) {
    throw new Error('Brevo is not configured');
  }

  const from = process.env.BREVO_FROM || 'PTC Library System <no-reply@ptc-library.local>';

  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

const buildEmailShell = ({ title, eyebrow, bodyHtml, ctaLabel, ctaUrl, footerNote }) => `
  <div style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e3ebe3;border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(18,56,29,0.08);">
        <div style="padding:28px 28px 20px;background:linear-gradient(135deg,#1f5e2b,#2e7d32);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">${eyebrow}</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">${title}</h1>
        </div>
        <div style="padding:28px;color:#203024;font-size:15px;line-height:1.7;">
          ${bodyHtml}
          ${ctaUrl ? `<div style="margin:28px 0 8px;"><a href="${ctaUrl}" style="display:inline-block;background:#2e7d32;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;">${ctaLabel}</a></div>` : ''}
          <p style="margin:28px 0 0;color:#607060;font-size:13px;">${footerNote}</p>
        </div>
      </div>
    </div>
  </div>
`;

const formatDateLabel = (value) => {
  if (!value) {
    return 'soon';
  }

  return new Date(value).toLocaleDateString();
};

const sendVerificationEmail = async (user) => {
  const subject = 'Your PTC Library account has been verified';
  const text = [
    `Hello ${user.name},`,
    '',
    'Your PTC Library Management System account has been verified by an administrator.',
    'You can now sign in and access your account, borrowings, notifications, and library services.',
    '',
    'Regards,',
    'PTC Library Management System',
  ].join('\n');

  const html = buildEmailShell({
    title: 'Account Verified',
    eyebrow: 'Verification complete',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hello ${user.name},</p>
      <p style="margin:0 0 14px;">Your PTC Library Management System account has been verified by an administrator.</p>
      <p style="margin:0;">You can now sign in and access your account, borrowings, notifications, and library services.</p>
    `,
    ctaLabel: 'Open the library app',
    ctaUrl: process.env.APP_LANDING_URL || '',
    footerNote: 'If you did not expect this email, you can safely ignore it.',
  });

  await sendBrevoEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendRejectionEmail = async (user, reason = '') => {
  const subject = 'Your PTC Library account registration needs attention';
  const message = reason ? ` Reason: ${reason}` : '';
  const text = [
    `Hello ${user.name},`,
    '',
    'Your PTC Library Management System registration was not approved at this time.',
    `Please review your account details and contact the library office if you need assistance.${message}`,
    '',
    'Regards,',
    'PTC Library Management System',
  ].join('\n');

  const html = buildEmailShell({
    title: 'Registration Review Update',
    eyebrow: 'Verification status changed',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hello ${user.name},</p>
      <p style="margin:0 0 14px;">Your PTC Library Management System registration was not approved at this time.</p>
      <p style="margin:0;">Please review your account details and contact the library office if you need assistance.${reason ? ` Reason: ${reason}` : ''}</p>
    `,
    ctaLabel: 'View library portal',
    ctaUrl: process.env.APP_LANDING_URL || '',
    footerNote: 'You may resubmit or contact support if you believe this was a mistake.',
  });

  await sendBrevoEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendArchiveEmail = async (user, reason = '') => {
  const subject = 'Your PTC Library account has been archived';
  const text = [
    `Hello ${user.name},`,
    '',
    'Your PTC Library Management System account has been archived.',
    reason ? `Reason: ${reason}` : 'You can contact the library office if you believe this was a mistake.',
    '',
    'Regards,',
    'PTC Library Management System',
  ].join('\n');

  const html = buildEmailShell({
    title: 'Account Archived',
    eyebrow: 'Account status changed',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hello ${user.name},</p>
      <p style="margin:0 0 14px;">Your PTC Library Management System account has been archived.</p>
      <p style="margin:0;">${reason || 'You can contact the library office if you believe this was a mistake.'}</p>
    `,
    ctaLabel: 'Open the library portal',
    ctaUrl: process.env.APP_LANDING_URL || '',
    footerNote: 'This account can be restored by a superadmin if needed.',
  });

  await sendBrevoEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendRestoreEmail = async (user) => {
  const subject = 'Your PTC Library account has been restored';
  const text = [
    `Hello ${user.name},`,
    '',
    'Your PTC Library Management System account has been restored.',
    'You can sign in again and continue using the library system.',
    '',
    'Regards,',
    'PTC Library Management System',
  ].join('\n');

  const html = buildEmailShell({
    title: 'Account Restored',
    eyebrow: 'Access re-enabled',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hello ${user.name},</p>
      <p style="margin:0 0 14px;">Your PTC Library Management System account has been restored.</p>
      <p style="margin:0;">You can sign in again and continue using the library system.</p>
    `,
    ctaLabel: 'Open the library portal',
    ctaUrl: process.env.APP_LANDING_URL || '',
    footerNote: 'If you did not request this change, contact the library office.',
  });

  await sendBrevoEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendBorrowingDueReminderEmail = async ({ user, bookTitle, dueDate, daysRemaining }) => {
  if (!user?.email) {
    return;
  }

  const dueLabel = formatDateLabel(dueDate);
  const dayLabel = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;
  const subject = `Book due in ${dayLabel}`;
  const text = [
    `Hello ${user.name},`,
    '',
    `Your borrowed book "${bookTitle || 'Book'}" is due in ${dayLabel} on ${dueLabel}.`,
    'Please return or renew it before the due date to avoid penalties.',
    '',
    'Regards,',
    'PTC Library Management System',
  ].join('\n');

  const html = buildEmailShell({
    title: `Due in ${dayLabel}`,
    eyebrow: 'Return reminder',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hello ${user.name},</p>
      <p style="margin:0 0 14px;">Your borrowed book <strong>${bookTitle || 'Book'}</strong> is due in ${dayLabel} on ${dueLabel}.</p>
      <p style="margin:0;">Please return or renew it before the due date to avoid penalties.</p>
    `,
    ctaLabel: 'Open the library app',
    ctaUrl: process.env.APP_LANDING_URL || '',
    footerNote: 'If you have already returned this book, you can ignore this reminder.',
  });

  await sendBrevoEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendPenaltyDueReminderEmail = async ({ user, bookTitle, dueDate, amount }) => {
  if (!user?.email) {
    return;
  }

  const dueLabel = formatDateLabel(dueDate);
  const subject = 'Penalty payment due soon';
  const amountLabel = typeof amount === 'number' ? `PHP ${amount.toFixed(2)}` : 'a penalty';
  const text = [
    `Hello ${user.name},`,
    '',
    `Your penalty payment for "${bookTitle || 'a borrowing'}" is due on ${dueLabel}.`,
    `Outstanding amount: ${amountLabel}.`,
    'Please settle the payment before the due date.',
    '',
    'Regards,',
    'PTC Library Management System',
  ].join('\n');

  const html = buildEmailShell({
    title: 'Penalty payment due',
    eyebrow: 'Payment reminder',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hello ${user.name},</p>
      <p style="margin:0 0 14px;">Your penalty payment for <strong>${bookTitle || 'a borrowing'}</strong> is due on ${dueLabel}.</p>
      <p style="margin:0 0 14px;">Outstanding amount: <strong>${amountLabel}</strong>.</p>
      <p style="margin:0;">Please settle the payment before the due date.</p>
    `,
    ctaLabel: 'Open the library app',
    ctaUrl: process.env.APP_LANDING_URL || '',
    footerNote: 'If you have already settled this payment, you can ignore this reminder.',
  });

  await sendBrevoEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendTestEmail = async ({ to, subject, message }) => {
  const emailSubject = subject || 'Brevo test from PTC Library System';
  const emailMessage = message || 'This is a Brevo test message from the PTC Library System backend.';

  await sendBrevoEmail({
    to,
    subject: emailSubject,
    text: emailMessage,
    html: buildEmailShell({
      title: emailSubject,
      eyebrow: 'Brevo test',
      bodyHtml: `<p style="margin:0;">${emailMessage}</p>`,
      footerNote: 'This email was sent through the Brevo test endpoint.',
    }),
  });
};

module.exports = {
  sendBrevoEmail,
  sendVerificationEmail,
  sendRejectionEmail,
  sendArchiveEmail,
  sendRestoreEmail,
  sendTestEmail,
  sendBorrowingDueReminderEmail,
  sendPenaltyDueReminderEmail,
};