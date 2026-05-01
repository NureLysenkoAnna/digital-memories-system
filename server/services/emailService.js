const nodemailer = require('nodemailer');
const ukLocale = require('../locales/uk');
const enLocale = require('../locales/en');

const locales = { 
  uk: ukLocale, 
  en: enLocale 
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class EmailService {
  static getBaseTemplate(content) {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #232426; 
      color: #E2E8F0; border-radius: 12px;">
        ${content}
      </div>
    `;
  }

  static async sendInvitation(email, groupName, inviteLink, role, lang = 'uk') {
    const t = locales[lang].email;
    const roleText = role === 'member' ? t.roleMember : t.roleViewer;
    
    const content = `
      <h2 style="color: #ffffff;">${t.inviteHeader}</h2>
      <p>${t.inviteBody(groupName, roleText)}</p>
      <p>${t.inviteAction}</p>
      <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #E2E8F0; color: #070B14; 
      text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
        ${t.btnJoin}
      </a>
      <p style="font-size: 12px; color: #94A3B8; text-align: right">${t.inviteValidity}</p>
    `;

    const mailOptions = {
      from: `"Starlace Memories" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: t.inviteSubject(groupName),
      html: this.getBaseTemplate(content)
    };

    return transporter.sendMail(mailOptions);
  }

  static async sendPasswordReset(email, username, resetLink, lang = 'uk') {
    const t = locales[lang].email;

    const content = `
      <h2 style="color: #ffffff;">${t.resetGreeting(username)}</h2>
      <p>${t.resetReqText}</p>
      <p>${t.resetInstruction}</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #E2E8F0; color: #070B14; 
      text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
        ${t.btnReset}
      </a>
      <p style="font-size: 13px; color: #94A3B8; margin-bottom: 5px;">${t.resetAltLink}</p>
      <a href="${resetLink}" style="font-size: 13px; color: #94A3B8; word-break: break-all;">${resetLink}</a>
      <div style="margin-top: 30px; font-size: 12px; color: #94A3B8; text-align: right;">
        <p style="margin: 5px 0;">${t.resetValidity}</p>
        <p style="margin: 5px 0;">${t.resetIgnore}</p>
      </div>
    `;

    const mailOptions = {
      from: `"Starlace Memories" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: t.resetSubject,
      html: this.getBaseTemplate(content)
    };

    return transporter.sendMail(mailOptions);
  }
}

module.exports = EmailService;