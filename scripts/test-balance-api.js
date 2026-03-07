#!/usr/bin/env node
/**
 * 余额查询接口测试脚本
 * 用法: node scripts/test-balance-api.js [BASE_URL]
 * 环境变量: ADMIN_EMAIL, ADMIN_PASSWORD, TEST_USER_EMAIL, TEST_USER_PASSWORD
 * 默认 BASE_URL: http://localhost:8787
 */

const baseUrl = process.argv[2] || process.env.BASE_URL || 'http://localhost:8787';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
const testUserEmail = process.env.TEST_USER_EMAIL || adminEmail;
const testUserPassword = process.env.TEST_USER_PASSWORD || adminPassword;

async function request(path, options = {}) {
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...options.headers,
        },
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

function assert(condition, msg) {
    if (!condition) {
        throw new Error(msg);
    }
}

async function main() {
    console.log('=== 余额查询接口测试 ===');
    console.log('BASE_URL:', baseUrl);
    console.log('');

    try {
        // 1. 健康检查
        console.log('1. 健康检查 GET /healthz');
        const health = await request('/healthz');
        assert(health.ok, `健康检查失败: ${health.status}`);
        assert(health.data?.success, '健康检查返回 success 应为 true');
        console.log('   OK:', health.data);
        console.log('');

        // 2. 管理员登录
        console.log('2. 管理员登录 POST /auth/admin-login');
        const adminLogin = await request('/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        });
        assert(adminLogin.ok, `管理员登录失败: ${adminLogin.status} - ${adminLogin.data?.error || ''}`);
        const adminToken = adminLogin.data?.token;
        assert(adminToken, '未返回 token');
        console.log('   OK, token 已获取');
        console.log('');

        // 3. 按邮箱查询（管理员）
        console.log('3. 按邮箱查询 GET /api/admin/usage/balance?email=...');
        const balanceByEmail = await request(
            `/api/admin/usage/balance?email=${encodeURIComponent(adminEmail)}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        assert(balanceByEmail.ok, `按邮箱查询失败: ${balanceByEmail.status} - ${balanceByEmail.data?.error || ''}`);
        const user = balanceByEmail.data?.user;
        assert(user, '未返回 user');
        assert(typeof user.usedTokens === 'number', 'user.usedTokens 应为数字');
        assert(typeof user.quotaTokens === 'number', 'user.quotaTokens 应为数字');
        assert(typeof user.frozen === 'boolean', 'user.frozen 应为布尔值');
        console.log('   OK:', user);
        console.log('');

        // 4. 普通用户登录（若与管理员相同则复用）
        console.log('4. 普通用户登录 POST /auth/login');
        const userLogin = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: testUserEmail, password: testUserPassword }),
        });
        let userToken;
        if (userLogin.ok) {
            userToken = userLogin.data?.token;
            assert(userLogin.data?.user?.frozen !== undefined, 'login user 应包含 frozen');
            assert(userLogin.data?.user?.quotaTokens !== undefined, 'login user 应包含 quotaTokens');
            assert(userLogin.data?.user?.usedTokens !== undefined, 'login user 应包含 usedTokens');
            console.log('   OK, login user 包含 frozen/quotaTokens/usedTokens');
        } else {
            console.log('   跳过（可能无普通用户，使用管理员 token）');
            userToken = adminToken;
        }
        console.log('');

        // 5. 用户自己的余额
        console.log('5. 用户余额 GET /api/user/balance');
        const userBalance = await request('/api/user/balance', {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        assert(userBalance.ok, `用户余额查询失败: ${userBalance.status} - ${userBalance.data?.error || ''}`);
        assert(typeof userBalance.data?.usedTokens === 'number', 'usedTokens 应为数字');
        assert(typeof userBalance.data?.quotaTokens === 'number', 'quotaTokens 应为数字');
        assert(typeof userBalance.data?.frozen === 'boolean', 'frozen 应为布尔值');
        console.log('   OK:', userBalance.data);
        console.log('');

        // 6. /auth/me 包含配额字段
        console.log('6. /auth/me 包含 frozen/quotaTokens/usedTokens');
        const me = await request('/auth/me', {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        assert(me.ok, `auth/me 失败: ${me.status}`);
        assert(me.data?.user?.frozen !== undefined, 'me user 应包含 frozen');
        assert(me.data?.user?.quotaTokens !== undefined, 'me user 应包含 quotaTokens');
        assert(me.data?.user?.usedTokens !== undefined, 'me user 应包含 usedTokens');
        console.log('   OK:', me.data.user);
        console.log('');

        console.log('=== 全部测试通过 ===');
    } catch (err) {
        console.error('测试失败:', err.message);
        process.exit(1);
    }
}

main();
