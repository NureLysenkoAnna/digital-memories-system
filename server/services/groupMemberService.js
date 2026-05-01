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

  static async checkIfAdmin(groupId, userId, errorCode = 'MEMBER_ADMIN_ROLE_REQUIRED') {
    const checkAdmin = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (checkAdmin.rows.length === 0 || checkAdmin.rows[0].role !== 'admin') {
      throw new Error(errorCode);
    }
  }

  static async updateMemberRole(groupId, adminId, targetUserId, newRole) {
    await this.checkIfAdmin(groupId, adminId, 'MEMBER_ADMIN_ROLE_REQUIRED');
    
    if (String(adminId) === String(targetUserId)) {
      throw new Error('MEMBER_CANNOT_CHANGE_OWN_ROLE');
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

    if (!requester) throw new Error('MEMBER_REQUESTER_NOT_IN_GROUP');
    if (!target) throw new Error('MEMBER_TARGET_NOT_IN_GROUP');

    if (String(requesterId) === String(targetUserId)) {
      if (requester.role === 'admin') {
        throw new Error('MEMBER_OWNER_CANNOT_LEAVE');
      }
    } else {
      if (requester.role !== 'admin') {
        throw new Error('MEMBER_ADMIN_ROLE_REQUIRED_TO_REMOVE');
      }
      if (target.role === 'admin') {
        throw new Error('MEMBER_CANNOT_REMOVE_OWNER');
      }
    }

    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    return { 
      message: String(requesterId) === String(targetUserId) 
        ? 'MEMBER_LEFT_SUCCESS' 
        : 'MEMBER_REMOVED_SUCCESS'
    };
  }

  static async sendInvitation(groupId, adminId, email, role) {
    await this.checkIfAdmin(groupId, adminId, 'INVITE_ADMIN_ROLE_REQUIRED');

    const groupRes = await pool.query('SELECT name FROM groups WHERE id = $1', [groupId]);
    const groupName = groupRes.rows[0].name;

    // Отримання мови адміна групи
    const adminRes = await pool.query('SELECT language FROM users WHERE id = $1', [adminId]);
    const adminLang = adminRes.rows.length > 0 && adminRes.rows[0].language ? adminRes.rows[0].language : 'uk';

    const checkExisting = await pool.query(`
      SELECT u.id FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1 AND u.email = $2
    `, [groupId, email]);
    if (checkExisting.rows.length > 0) throw new Error('INVITE_USER_ALREADY_IN_GROUP');

    // Чи не було вже відправлено запрошення на цю пошту?
    const checkPendingInvite = await pool.query(
      'SELECT id FROM group_invitations WHERE group_id = $1 AND email = $2',
      [groupId, email]
    );
    if (checkPendingInvite.rows.length > 0) {
      throw new Error('INVITE_ALREADY_SENT');
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
    await EmailService.sendInvitation(email, groupName, inviteLink, role, adminLang);

    return { message: 'INVITE_SENT_SUCCESS' };
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
      throw new Error('INVITE_INVALID_OR_EXPIRED');
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
      throw new Error('INVITE_USER_ALREADY_IN_GROUP');
    }

    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [invite.group_id, userId, invite.role]
    );

    await pool.query('DELETE FROM group_invitations WHERE id = $1', [invite.id]);

    return { 
      message: 'INVITE_ACCEPTED_SUCCESS', 
      groupId: invite.group_id 
    };
  }
}

module.exports = GroupMemberService;