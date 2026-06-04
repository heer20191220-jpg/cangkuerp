const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const [, , username, password] = process.argv;

if (!username || !password) {
  console.log("用法：node set-password.js 用户名 新密码");
  console.log("示例：node set-password.js admin NewStrongPassword123");
  process.exit(1);
}

if (password.length < 8) {
  console.error("密码至少需要 8 位。");
  process.exit(1);
}

const dbPath = path.join(__dirname, "data", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const user = db.users.find((item) => item.username === username);

if (!user) {
  console.error(`未找到账号：${username}`);
  process.exit(1);
}

user.passwordHash = crypto.createHash("sha256").update(password).digest("hex");
db.sessions = [];
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

console.log(`账号 ${username} 的密码已修改，所有旧登录状态已失效。`);
