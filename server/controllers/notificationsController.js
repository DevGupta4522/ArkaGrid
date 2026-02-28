import pool from '../db/connection.js';

export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT COUNT(*) FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        res.json({
            success: true,
            data: { count: parseInt(result.rows[0].count) }
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or unauthorized',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await pool.query(
            `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to create notification internally
export const createNotification = async (clientOrPool, userId, type, title, message, relatedId = null) => {
    try {
        const target = clientOrPool || pool;
        await target.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
            [userId, type, title, message, relatedId]
        );
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};
