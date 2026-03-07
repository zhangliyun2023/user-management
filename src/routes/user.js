const express = require('express');
const pool = require('../db/pool');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/resume-context', authRequired, async (_req, res) => {
    // 简历内容已迁移至客户端本地存储，此接口保持兼容，返回空 context
    return res.json({ success: true, context: '' });
});

/** 查询当前登录用户的余额/状态（客户端用） */
router.get('/balance', authRequired, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                COALESCE(u.quota_tokens, 1000000)::bigint AS quota_tokens,
                COALESCE(u.frozen, FALSE) AS frozen,
                COALESCE(SUM(tu.total_tokens), 0)::bigint AS used_tokens
            FROM users u
            LEFT JOIN token_usage tu ON tu.user_id = u.id
            WHERE u.id = $1
            GROUP BY u.id, u.quota_tokens, u.frozen
            LIMIT 1
            `,
            [req.user.id]
        );
        const row = result.rows[0];
        if (!row) {
            return res.status(404).json({ success: false, error: '用户不存在', code: 'USER_NOT_FOUND' });
        }
        return res.json({
            success: true,
            usedTokens: Number(row.used_tokens || 0),
            quotaTokens: Number(row.quota_tokens || 0),
            frozen: Boolean(row.frozen),
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message, code: 'BALANCE_QUERY_FAILED' });
    }
});

module.exports = router;
