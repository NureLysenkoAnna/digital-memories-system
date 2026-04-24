const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class EmailService {
  static async sendInvitation(email, groupName, inviteLink, role) {
    const roleText = role === 'member' ? '<i>Учасника</i>. Ви зможете додавати, переглядати спогади та ділитися своїми враженнями!' : '<i>Читача</i>. Ви зможете переглядати спогади та ділитися своїми враженнями!';
    
    const mailOptions = {
      from: `"Starlace Memories" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Запрошення до групи "${groupName}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #232426; color: #E2E8F0; border-radius: 12px;">
          <h2 style="color: #ffffff;"> Вас запрошено до групи у Starlace Memories!</h2>
          <p>Ви отримали запрошення приєднатися до групи <b>"${groupName}"</b> у ролі ${roleText}</p>
          <p>Натисніть на кнопку нижче, щоб прийняти запрошення:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #E2E8F0; color: #070B14; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Приєднатися
          </a>
          <p style="font-size: 12px; color: #94A3B8; text-align: right">Це посилання дійсне протягом 48 годин.</p>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  static async sendPasswordReset(email, username, resetLink) {
    const mailOptions = {
      from: `"Starlace Memories" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Відновлення доступу до профілю у Starlace Memories',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #232426; color: #E2E8F0; border-radius: 12px;">
          
          <h2 style="color: #ffffff;">Вітаємо, ${username}!</h2>
          
          <p>Ми отримали запит на скидання пароля для Вашого облікового запису <b>Starlace Memories</b>.</p>
          <p>Щоб створити новий пароль та відновити доступ до своїх груп та спогадів, будь ласка, натисніть на кнопку нижче:</p>
          
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #E2E8F0; color: #070B14; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Створити новий пароль
          </a>
          
          <p style="font-size: 13px; color: #94A3B8; margin-bottom: 5px;">
            Якщо кнопка не працює, перейдіть за цим посиланням:
          </p>
          <a href="${resetLink}" style="font-size: 13px; color: #94A3B8; word-break: break-all;">
            ${resetLink}
          </a>

          <div style="margin-top: 30px; font-size: 12px; color: #94A3B8; text-align: right;">
            <p style="margin: 5px 0;">Це посилання дійсне лише <b>1 годину</b>.</p>
            <p style="margin: 5px 0;">Якщо Ви не надсилали цей запит, просто проігноруйте цей лист.</p>
          </div>
          
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }
}

module.exports = EmailService;