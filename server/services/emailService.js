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
}

module.exports = EmailService;