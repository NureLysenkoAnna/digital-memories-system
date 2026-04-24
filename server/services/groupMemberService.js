const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const EmailService = require('./emailService');

class GroupMemberService {
  static async getGroupMembers(groupId) {
    const query = `
      SELECT 
        u.id, 
        u.username as name, 
        u.email, 
        u.avatar_url as avatar, 
        gm.role 
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY 
        CASE gm.role 
          WHEN 'admin' THEN 1 
          WHEN 'member' THEN 2 
          ELSE 3 
        END, 
        u.username
    `;
    const result = await pool.query(query, [groupId]);
    return result.rows;
  }

  static async updateMemberRole(groupId, adminId, targetUserId, newRole) {
    const checkAdmin = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, adminId]
    );
    if (checkAdmin.rows.length === 0 || checkAdmin.rows[0].role !== 'admin') {
      throw new Error('У вас немає прав для зміни ролей.');
    }

    if (String(adminId) === String(targetUserId)) {
      throw new Error('Ви не можете змінити роль самому собі');
    }

    const result = await pool.query(
      'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3 RETURNING *',
      [newRole, groupId, targetUserId]
    );
    return result.rows[0];
  }

  static async removeMember(groupId, requesterId, targetUserId) {
    const rolesRes = await pool.query(
      'SELECT user_id, role FROM group_members WHERE group_id = $1 AND user_id IN ($2, $3)',
      [groupId, requesterId, targetUserId]
    );

    const roles = rolesRes.rows;
    const requester = roles.find(r => String(r.user_id) === String(requesterId));
    const target = roles.find(r => String(r.user_id) === String(targetUserId));

    if (!requester) throw new Error('Ви не є учасником цієї групи');
    if (!target) throw new Error('Користувача не знайдено в групі');

    if (String(requesterId) === String(targetUserId)) {
      if (requester.role === 'admin') {
        throw new Error('Власник не може просто покинути групу. Ви можете лише видалити її повністю.');
      }
    } else {
      if (requester.role !== 'admin') {
        throw new Error('Тільки власник може видаляти інших учасників з групи.');
      }
      if (target.role === 'admin') {
        throw new Error('Неможливо видалити власника групи.');
      }
    }

    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    return { 
      message: String(requesterId) === String(targetUserId) 
        ? 'Ви успішно покинули групу' 
        : 'Учасника успішно видалено' 
    };
  }

  static async sendInvitation(groupId, adminId, email, role) {
    const checkAdmin = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, adminId]
    );
    if (checkAdmin.rows.length === 0 || checkAdmin.rows[0].role !== 'admin') {
      throw new Error('Тільки власник може запрошувати учасників');
    }

    const groupRes = await pool.query('SELECT name FROM groups WHERE id = $1', [groupId]);
    const groupName = groupRes.rows[0].name;

    const checkExisting = await pool.query(`
      SELECT u.id FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1 AND u.email = $2
    `, [groupId, email]);
    if (checkExisting.rows.length > 0) throw new Error('Цей користувач вже є в групі!');

    // Чи не було вже відправлено запрошення на цю пошту?
    const checkPendingInvite = await pool.query(
      'SELECT id FROM group_invitations WHERE group_id = $1 AND email = $2',
      [groupId, email]
    );
    if (checkPendingInvite.rows.length > 0) {
      throw new Error('Запрошення на цю пошту вже надіслано та очікує підтвердження.');
    }

    // Генерація оригінального токена (UUID)
    const rawToken = uuidv4();
    
    // ХЕШ токена для БД
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await pool.query(`
      INSERT INTO group_invitations (group_id, email, token, role, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (group_id, email) 
      DO UPDATE SET token = $3, role = $4, expires_at = $5, created_at = CURRENT_TIMESTAMP
    `, [groupId, email, hashedToken, role, expiresAt]);

    // Відправка оригінального токена у посиланні
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${rawToken}`;
    await EmailService.sendInvitation(email, groupName, inviteLink, role);

    return { message: 'Запрошення успішно надіслано!' };
  }

  // Публічна перевірка запрошення
  static async verifyInvitation(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const inviteRes = await pool.query(`
      SELECT gi.id, gi.group_id, g.name as group_name, gi.role
      FROM group_invitations gi
      JOIN groups g ON gi.group_id = g.id
      WHERE gi.token = $1 AND gi.expires_at > CURRENT_TIMESTAMP
    `, [hashedToken]);

    if (inviteRes.rows.length === 0) {
      throw new Error('Запрошення недійсне, вже використане або його термін дії закінчився.');
    }

    return inviteRes.rows[0]; 
  }

  static async acceptInvitation(token, userId) {
    const invite = await GroupMemberService.verifyInvitation(token);

    // чи немає вже користувача в групі
    const checkMember = await pool.query(
      'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [invite.group_id, userId]
    );

    if (checkMember.rows.length > 0) {
      throw new Error('Ви вже є учасником цієї групи!');
    }

    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [invite.group_id, userId, invite.role]
    );

    await pool.query('DELETE FROM group_invitations WHERE id = $1', [invite.id]);

    return { 
      message: 'Ви успішно приєдналися до групи:', 
      groupId: invite.group_id 
    };
  }
}

module.exports = GroupMemberService;