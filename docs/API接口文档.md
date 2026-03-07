# 新增接口说明（2025-03-07）

仅包含本次新增与变更的接口，供前端对接使用。

---

## 1. 查询当前用户余额（客户端用）

**GET** `/api/user/balance`

**鉴权**：`Authorization: Bearer <用户 token>`

**说明**：返回当前登录用户的用量、配额、冻结状态，无需传参。

**成功响应**（200）：
```json
{
  "success": true,
  "usedTokens": 37130,
  "quotaTokens": 1000000,
  "frozen": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| usedTokens | number | 已使用 Token 数 |
| quotaTokens | number | 总配额 |
| frozen | boolean | 是否已冻结 |

**失败**：401 未提供/无效 Token；404 用户不存在（code: `USER_NOT_FOUND`）

---

## 2. 管理员按邮箱查询用户余额

**GET** `/api/admin/usage/balance?email=xxx`

**鉴权**：`Authorization: Bearer <管理员 token>`

**查询参数**：`email`（必填，用户邮箱）

**成功响应**（200）：
```json
{
  "success": true,
  "user": {
    "id": 3,
    "email": "test6@qq.com",
    "usedTokens": 37130,
    "quotaTokens": 1000000,
    "frozen": false
  }
}
```

**失败**：400 未传/格式错误（code: `MISSING_EMAIL` / `INVALID_EMAIL`）；401 未登录或非管理员；404 用户不存在（code: `USER_NOT_FOUND`）

---

## 3. 登录与 /auth/me 返回字段扩展

**涉及接口**：`POST /auth/login`、`POST /auth/license`、`GET /auth/me`

上述接口返回的 `user` 对象**新增**以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| frozen | boolean | 是否已冻结 |
| quotaTokens | number | 总配额（Token 数） |
| usedTokens | number | 已使用 Token 数 |

前端可在登录后及发问前直接使用这些字段判断是否允许发送；也可再调 `GET /api/user/balance` 做二次校验。

---

## 4. 推荐前端逻辑

- **登录后**：从 `user` 读取 `frozen`、`quotaTokens`、`usedTokens` 并展示/缓存。
- **发问前**：调用 `GET /api/user/balance`，若 `frozen === true` 或 `usedTokens >= quotaTokens` 则禁止发送并提示。
- **回答后**：可再次调用 `GET /api/user/balance` 更新界面用量。
