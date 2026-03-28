const pool = require('../config/db');
const { deleteImageFromCloudinary } = require('../utils/cloudinaryHelper');

class GroupService {
  static async createGroup(name, description, coverImageUrl, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const groupResult = await client.query(
        'INSERT INTO groups (name, description, cover_image_url, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description || '', coverImageUrl || '', userId]
      );
      
      const newGroup = groupResult.rows[0];

      await client.query(
        'INSERT INTO group_members (user_id, group_id, role) VALUES ($1, $2, $3)',
        [userId, newGroup.id, 'admin']
      );

      await client.query('COMMIT');
      return newGroup;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserGroups(userId) {
    const result = await pool.query(`
      SELECT g.id, g.name, g.description, g.cover_image_url, g.created_at, gm.role, gm.is_favorite 
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
      ORDER BY gm.is_favorite DESC, g.created_at DESC
    `, [userId]);
    return result.rows;
  }

  // Перемикач обраної групи
  static async toggleFavorite(userId, groupId) {
    const result = await pool.query(
      `UPDATE group_members 
       SET is_favorite = NOT is_favorite 
       WHERE user_id = $1 AND group_id = $2 
       RETURNING is_favorite`,
      [userId, groupId]
    );
    return result.rows[0];
  }

  // Отримання повної інформації про групу зі статистикою
  static async getGroupDetails(groupId, userId) {

    const groupResult = await pool.query(`
      SELECT g.id, g.name, g.description, g.cover_image_url, g.created_at,
             COALESCE(gm.is_favorite, false) as is_favorite,
             gm.role as user_role
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE g.id = $1 AND gm.user_id = $2
    `, [groupId, userId]);

    if (groupResult.rows.length === 0) {
      throw new Error('Групу не знайдено або у вас немає доступу');
    }

    const groupData = groupResult.rows[0];

    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM group_members WHERE group_id = $1) as members_count,
        (SELECT COUNT(*) FROM posts WHERE group_id = $1) as posts_count,
        (SELECT COUNT(*) FROM post_images pi JOIN posts p ON pi.post_id = p.id WHERE p.group_id = $1)::int as "imagesCount"
    `, [groupId]);

    const stats = statsResult.rows[0];

    let topMember = null;
    if (parseInt(stats.members_count) >= 2) {
      const topMemberResult = await pool.query(`
        SELECT u.username as name, COUNT(p.id) as post_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.group_id = $1 
          AND p.created_at >= NOW() - INTERVAL '1 month'
        GROUP BY u.id, u.username
        ORDER BY post_count DESC
        LIMIT 1
      `, [groupId]);

      if (topMemberResult.rows.length > 0) {
        topMember = topMemberResult.rows[0];
      }
    }

    return {
      id: groupData.id,
      name: groupData.name,
      description: groupData.description,
      coverUrl: groupData.cover_image_url,
      createdAt: groupData.created_at,
      isFavorite: groupData.is_favorite,
      userRole: groupData.user_role,
      membersCount: parseInt(stats.members_count),
      postsCount: parseInt(stats.posts_count),
      imagesCount: statsResult.rows[0].imagesCount,
      topMember: topMember
    };
  }

  static async checkAdminRole(groupId, userId) {
    const result = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      throw new Error('У вас немає прав адміністратора для цієї дії');
    }
  }

  static async updateGroup(groupId, userId, name, description, coverImageUrl) {
    await this.checkAdminRole(groupId, userId);

    const result = await pool.query(
      `UPDATE groups 
       SET name = $1, description = $2, cover_image_url = COALESCE($3, cover_image_url) 
       WHERE id = $4 
       RETURNING *`,
      [name, description, coverImageUrl, groupId]
    );

    return result.rows[0];
  }

  static async deleteGroup(groupId, userId) {
    await this.checkAdminRole(groupId, userId);

    const result = await pool.query(
      'DELETE FROM groups WHERE id = $1 RETURNING id, cover_image_url',
      [groupId]
    );

    if (result.rows.length === 0) {
      throw new Error('Групу не знайдено');
    }

    const deletedGroup = result.rows[0];

    if (deletedGroup.cover_image_url) {
      deleteImageFromCloudinary(deletedGroup.cover_image_url);
    }

    return deletedGroup;
  }
}

module.exports = GroupService;