const pool = require('../config/db');

class PostService {
  static async createPost(groupId, authorId, content, tags, eventDate, imageUrls) {
    if (content && content.length > 500) {
      throw new Error('Текст публікації не може перевищувати 500 символів.');
    }
    if (tags && tags.length > 10) {
      throw new Error('Можна додати не більше 5 тегів.');
    }
    if (imageUrls && imageUrls.length > 5) {
      throw new Error('До однієї публікації можна додати максимум 5 фотографій.');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const postResult = await client.query(
        `INSERT INTO posts (group_id, author_id, content, tags, event_date) 
         VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE)) 
         RETURNING *`,
        [groupId, authorId, content, tags || [], eventDate]
      );

      const newPost = postResult.rows[0];

      if (imageUrls && imageUrls.length > 0) {
        const imageValues = [];
        const queryParams = [newPost.id];
        
        imageUrls.forEach((url, index) => {
          queryParams.push(url);
          imageValues.push(`($1, $${index + 2})`); 
        });

        const imageQuery = `
          INSERT INTO post_images (post_id, image_url) 
          VALUES ${imageValues.join(', ')}
        `;
        
        await client.query(imageQuery, queryParams);
      }

      await client.query('COMMIT');
      
      return { ...newPost, images: imageUrls || [] };
    } catch (error) {
      await client.query('ROLLBACK'); // Якщо помилка - скасовування всіх змін
      throw error;
    } finally {
      client.release();
    }
  }

  static async togglePin(postId, groupId, userId) {
    const roleResult = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (roleResult.rows.length === 0) throw new Error('У вас немає доступу до цієї групи');
    
    const postResult = await pool.query('SELECT is_pinned FROM posts WHERE id = $1', [postId]);
    if (postResult.rows.length === 0) throw new Error('Публікацію не знайдено');
    
    const isCurrentlyPinned = postResult.rows[0].is_pinned;

    // Перевірка ліміту закріплення у 3 публікації
    if (!isCurrentlyPinned) {
      const pinCountResult = await pool.query(
        'SELECT COUNT(*) FROM posts WHERE group_id = $1 AND is_pinned = TRUE',
        [groupId]
      );
      if (parseInt(pinCountResult.rows[0].count) >= 3) {
        throw new Error('У групі вже закріплено максимум 3 публікації. Відкріпіть одну з них, щоб закріпити нову.');
      }
    }

    const updatedPost = await pool.query(
      'UPDATE posts SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING is_pinned',
      [postId]
    );

    return updatedPost.rows[0].is_pinned;
  }

  static async getGroupPosts(groupId, sortBy = 'new') {
    let orderClause = 'ORDER BY p.is_pinned DESC, p.created_at DESC'; //спочатку закріплені
    
    if (sortBy === 'event_new') {
      // Хронологія: Спочатку найновіші події
      orderClause = 'ORDER BY p.is_pinned DESC, p.event_date DESC, p.created_at DESC';
    } else if (sortBy === 'event_old') {
      // Хронологія: Спочатку найстаріші події
      orderClause = 'ORDER BY p.is_pinned DESC, p.event_date ASC, p.created_at ASC';
    } else if (sortBy === 'popular') {
      // Популярні: за кількістю коментарів
      orderClause = 'ORDER BY p.is_pinned DESC, "commentsCount" DESC, p.created_at DESC';
    }

    const query = `
      SELECT 
        p.id, 
        p.content as text, 
        p.tags, 
        p.event_date as date, 
        p.is_pinned, 
        p.created_at,
        json_build_object('id', u.id, 'name', u.username, 'avatar', u.avatar_url) as author,
        COALESCE((SELECT json_agg(image_url) FROM post_images WHERE post_id = p.id), '[]'::json) as images,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id)::int as "commentsCount",
        COALESCE((SELECT json_agg(json_build_object('user_id', user_id, 'reaction', reaction)) FROM post_reactions WHERE post_id = p.id), '[]'::json) as reactions
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.group_id = $1
      ${orderClause}
    `;

    const result = await pool.query(query, [groupId]);
    
    return result.rows;
  }

  static async deletePost(postId, userId, groupId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const postCheck = await client.query(`
        SELECT p.author_id, g.role 
        FROM posts p
        LEFT JOIN group_members g ON p.group_id = g.group_id AND g.user_id = $2
        WHERE p.id = $1 AND p.group_id = $3
      `, [postId, userId, groupId]);

      if (postCheck.rows.length === 0) throw new Error('Публікацію не знайдено');
      
      const { author_id, role } = postCheck.rows[0];
      if (author_id !== userId && role !== 'admin') {
        throw new Error('У вас немає прав для видалення цієї публікації');
      }

      const imagesRes = await client.query('SELECT image_url FROM post_images WHERE post_id = $1', [postId]);
      const imageUrls = imagesRes.rows.map(row => row.image_url);

      await client.query('DELETE FROM posts WHERE id = $1', [postId]);

      await client.query('COMMIT');

      const { deleteImageFromCloudinary } = require('../utils/cloudinaryHelper');
      imageUrls.forEach(url => {
        deleteImageFromCloudinary(url).catch(err => console.error('Помилка видалення фото:', err));
      });

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getComments(postId) {
    const query = `
      SELECT 
        c.id, c.content, c.created_at,
        json_build_object('id', u.id, 'name', u.username, 'avatar', u.avatar_url) as author
      FROM post_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;
    const result = await pool.query(query, [postId]);
    return result.rows;
  }

  static async addComment(postId, userId, content) {
    if (!content || content.trim() === '') throw new Error('Коментар не може бути порожнім');
    
    const result = await pool.query(
      'INSERT INTO post_comments (post_id, author_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at',
      [postId, userId, content]
    );
    
    const authorRes = await pool.query('SELECT id, username as name, avatar_url as avatar FROM users WHERE id = $1', [userId]);
    
    return {
      ...result.rows[0],
      author: authorRes.rows[0]
    };
  }

  static async toggleReaction(postId, userId, reaction) {
    const check = await pool.query(
      'SELECT id, reaction FROM post_reactions WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (check.rows.length > 0) {
      const existing = check.rows[0];
      
      if (existing.reaction === reaction) {
        // Якщо клікнули на ту саму реакцію ще раз — видалення реакції
        await pool.query('DELETE FROM post_reactions WHERE id = $1', [existing.id]);
        return { action: 'removed' };
      } else {
        // Якщо клікнули на іншу реакцію — оновлення реакції
        await pool.query(
          'UPDATE post_reactions SET reaction = $1 WHERE id = $2',
          [reaction, existing.id]
        );
        return { action: 'updated', reaction };
      }
    } else {
      // Якщо реакцій не було взагалі — створення реакції
      await pool.query(
        'INSERT INTO post_reactions (post_id, user_id, reaction) VALUES ($1, $2, $3)',
        [postId, userId, reaction]
      );
      return { action: 'added', reaction };
    }
  }
}

module.exports = PostService;