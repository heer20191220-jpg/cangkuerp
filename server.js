const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const VOLUME_DIVISOR = 6000;
const DEFAULT_TENANT_ID = "tenant_default";
const ENCRYPTION_KEY = crypto.createHash("sha256")
  .update(process.env.ERP_SECRET_KEY || `warehouse-erp-local-key:${ROOT}`)
  .digest();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

let db = null;
let writeQueue = Promise.resolve();

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function defaultHsCodes() {
  return [
    { id: "hs_001", terms: ["隔尿垫", "尿垫"], code: "9619009000", label: "母婴护理" },
    { id: "hs_002", terms: ["卸扣", "扣具"], code: "7326909000", label: "五金配件" },
    { id: "hs_003", terms: ["电话手表", "智能手表", "手表"], code: "8517629900", label: "通讯设备" },
    { id: "hs_004", terms: ["手机壳", "保护壳", "手机套"], code: "3926909090", label: "塑料制品" },
    { id: "hs_005", terms: ["数据线", "充电线", "连接线"], code: "8544421900", label: "线缆" },
    { id: "hs_006", terms: ["充电器", "电源"], code: "8504409999", label: "电源设备" },
    { id: "hs_007", terms: ["耳机"], code: "8518300000", label: "音频设备" },
    { id: "hs_008", terms: ["键盘"], code: "8471607100", label: "电脑配件" },
    { id: "hs_009", terms: ["鼠标"], code: "8471607200", label: "电脑配件" },
    { id: "hs_010", terms: ["玩具", "模型", "积木"], code: "9503008900", label: "玩具" },
    { id: "hs_011", terms: ["衣服", "上衣", "裤子", "裙子", "外套", "T恤", "卫衣"], code: "6109909060", label: "服装" },
    { id: "hs_012", terms: ["背包", "手提包", "钱包", "包袋", "妈咪包"], code: "4202920000", label: "包袋" },
    { id: "hs_013", terms: ["收纳盒", "餐具", "杯子", "碗", "盘子"], code: "3924900000", label: "家居用品" },
    { id: "hs_014", terms: ["项链", "手链", "耳环", "戒指", "发夹"], code: "7117190000", label: "饰品" },
    { id: "hs_015", terms: ["木盒", "木架", "木制品"], code: "4421999090", label: "木制品" },
    { id: "hs_016", terms: ["玻璃瓶", "玻璃罐", "玻璃容器", "空容器"], code: "7010909000", label: "玻璃制容器" },
    { id: "hs_017", terms: ["塑料瓶", "塑料罐", "塑料容器"], code: "3923300000", label: "塑料包装容器" },
    { id: "hs_018", terms: ["贴纸", "标签", "不干胶"], code: "4821100000", label: "纸制标签" },
    { id: "hs_019", terms: ["礼物盒", "礼品盒", "包装盒", "纸盒"], code: "4819200000", label: "纸制包装盒" },
    { id: "hs_020", terms: ["毛巾", "浴巾", "方巾"], code: "6302609000", label: "毛巾制品" },
    { id: "hs_021", terms: ["袜子"], code: "6115960000", label: "针织袜" },
    { id: "hs_022", terms: ["帽子", "棒球帽"], code: "6505009900", label: "帽类" },
    { id: "hs_023", terms: ["宠物绳", "牵引绳", "宠物项圈"], code: "4201000090", label: "宠物用品" },
    { id: "hs_024", terms: ["化妆刷", "刷子"], code: "9603290090", label: "刷类制品" },
    { id: "hs_025", terms: ["镜子", "化妆镜"], code: "7009920000", label: "玻璃镜" }
  ];
}

function seedDb() {
  return {
    users: [
      { id: "user_admin", username: "admin", displayName: "管理员", role: "admin", tenantId: DEFAULT_TENANT_ID, passwordHash: sha256("admin123"), createdAt: nowIso() },
      { id: "user_entry", username: "luru", displayName: "录入员", role: "operator", tenantId: DEFAULT_TENANT_ID, passwordHash: sha256("123456"), createdAt: nowIso() }
    ],
    sessions: [],
    products: [],
    domesticShipments: [],
    shops: [],
    storeBindings: [],
    oauthStates: [],
    hsCodes: defaultHsCodes(),
    logs: []
  };
}

async function loadDb() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    db = seedDb();
    await saveDb();
    return;
  }

  db = JSON.parse(await fsp.readFile(DB_PATH, "utf8"));
  db.sessions ||= [];
  db.logs ||= [];
  db.products ||= [];
  db.domesticShipments ||= [];
  db.shops ||= [];
  db.storeBindings ||= [];
  db.oauthStates ||= [];
  db.shops = normalizeShops(db.shops);
  db.hsCodes = hasBrokenChinese(db.hsCodes) ? defaultHsCodes() : (db.hsCodes || defaultHsCodes());
  db.users = normalizeUsers(db.users);
  db.sessions = db.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
  db.oauthStates = db.oauthStates.filter((item) => new Date(item.expires_at).getTime() > Date.now());
  await saveDb();
}

function hasBrokenChinese(value) {
  const text = JSON.stringify(value || "");
  return text.includes("�") || text.includes("鍟") || text.includes("浠") || text.includes("绠");
}

function normalizeUsers(users = []) {
  const result = users.length ? users : seedDb().users;
  for (const user of result) {
    if (user.id === "user_admin" || user.username === "admin") user.displayName = "管理员";
    if (user.id === "user_entry" || user.username === "luru") user.displayName = "录入员";
    user.tenantId ||= DEFAULT_TENANT_ID;
  }
  return result;
}

function normalizeShops(shops = []) {
  return shops.map((shop) => {
    const platform = normalizePlatformType(shop.platform || shop.platformType || "mercadolibre");
    const authType = normalizeAuthType(shop.auth_type || shop.authType || defaultAuthType(platform));
    const statusMap = { "未连接": "disconnected", "已连接": "connected", "连接失败": "failed" };
    return {
      ...shop,
      tenant_id: shop.tenant_id || shop.tenantId || DEFAULT_TENANT_ID,
      platform,
      shop_name: shop.shop_name || shop.shopName || "",
      seller_id: shop.seller_id || shop.sellerId || shop.shopAccount || "",
      auth_type: authType,
      access_token_encrypted: shop.access_token_encrypted || "",
      refresh_token_encrypted: shop.refresh_token_encrypted || "",
      api_key_encrypted: shop.api_key_encrypted || shop.encryptedApiKey || "",
      api_secret_encrypted: shop.api_secret_encrypted || shop.encryptedApiSecret || "",
      token_expires_at: shop.token_expires_at || shop.tokenExpiresAt || "",
      status: statusMap[shop.status] || shop.status || "disconnected",
      last_sync_at: shop.last_sync_at || shop.lastSyncAt || "",
      last_error: shop.last_error || shop.statusMessage || "",
      created_at: shop.created_at || shop.createdAt || nowIso(),
      updated_at: shop.updated_at || shop.updatedAt || nowIso(),
      deleted_at: shop.deleted_at || shop.deletedAt || ""
    };
  });
}

function saveDb() {
  writeQueue = writeQueue.then(() => fsp.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8"));
  return writeQueue;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function sendCsv(res, filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    "Cache-Control": "no-store"
  });
  res.end(`\uFEFF${csv}`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sendExcelHtml(res, filename, headers, rows) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; font-family: "Microsoft YaHei", Arial, sans-serif; font-size: 12px; }
    th, td { border: 1px solid #999; padding: 6px; vertical-align: middle; mso-number-format: "\\@"; }
    th { background: #eaf4f0; font-weight: 700; }
    img { width: 72px; height: 72px; object-fit: contain; display: block; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell) => {
        if (cell && typeof cell === "object" && cell.type === "image") {
          return `<td>${cell.src ? `<img src="${escapeHtml(cell.src)}" alt="">` : ""}</td>`;
        }
        return `<td>${escapeHtml(cell)}</td>`;
      }).join("")}</tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;
  res.writeHead(200, {
    "Content-Type": "application/vnd.ms-excel; charset=utf-8",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    "Cache-Control": "no-store"
  });
  res.end(`\uFEFF${html}`);
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  return Object.fromEntries(cookieHeader.split(";").map((pair) => {
    const index = pair.indexOf("=");
    if (index === -1) return ["", ""];
    return [pair.slice(0, index).trim(), decodeURIComponent(pair.slice(index + 1))];
  }).filter(([key]) => key));
}

function getSession(req) {
  const token = parseCookies(req).erp_session;
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
  const user = db.users.find((item) => item.id === session.userId);
  return user ? { token, user } : null;
}

function publicUser(user) {
  return { id: user.id, username: user.username, displayName: user.displayName, role: user.role, tenantId: getTenantId(user) };
}

function getTenantId(user) {
  return user.tenantId || DEFAULT_TENANT_ID;
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) sendJson(res, 401, { error: "请先登录" });
  return session;
}

function requireWritable(req, res) {
  const session = requireAuth(req, res);
  if (!session) return null;
  if (session.user.role === "viewer") {
    sendJson(res, 403, { error: "当前账号没有写入权限" });
    return null;
  }
  return session;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("请求内容过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

function compactChinese(value, maxLength = 20) {
  return String(value || "").trim().replace(/\s+/g, "").slice(0, maxLength);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function lookupHsCode(zhName) {
  const cleanName = compactChinese(zhName);
  if (!cleanName) return { code: "待查询", label: "待查询" };
  const matched = db.hsCodes.find((item) => item.terms.some((term) => {
    const cleanTerm = compactChinese(term);
    return cleanName.includes(cleanTerm) || cleanTerm.includes(cleanName);
  }));
  return matched ? { code: matched.code, label: matched.label } : { code: "待确认", label: "未匹配" };
}

async function lookupHsCodeWithOnline(zhName) {
  const local = lookupHsCode(zhName);
  if (local.code !== "待确认") return local;

  const online = await queryOnlineHsCode(zhName).catch(() => null);
  if (!online) return local;

  cacheHsCode(zhName, online);
  return online;
}

function cacheHsCode(zhName, result) {
  if (!result.code || db.hsCodes.some((item) => item.code === result.code && item.terms.includes(zhName))) return;
  db.hsCodes.push({
    id: createId("hs"),
    terms: [compactChinese(zhName)],
    code: result.code,
    label: result.label || "在线匹配"
  });
}

async function queryOnlineHsCode(zhName) {
  const cleanName = compactChinese(zhName);
  if (!cleanName) return null;

  const urls = [
    `https://hs.bianmachaxun.com/?word=${encodeURIComponent(cleanName)}`,
    `https://www.hs-bianma.com/hscode2_${encodeURIComponent(cleanName)}.htm`
  ];

  for (const url of urls) {
    const html = await fetchText(url).catch(() => "");
    const result = pickHsCodeFromHtml(html, cleanName);
    if (result) return { ...result, source: url };
  }
  return null;
}

async function fetchText(url, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 WarehouseERP/1.0",
        "Accept": "text/html,application/xhtml+xml,text/plain",
        ...headers
      }
    });
    if (!response.ok) return "";
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function pickHsCodeFromHtml(html, zhName) {
  if (!html) return null;
  const lines = decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const chapterHint = findChapterHint(lines);
  const candidates = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/\b(\d{10})\b/);
    if (!match) continue;
    const code = match[1];
    if (chapterHint && !code.startsWith(chapterHint)) continue;
    const nearby = lines.slice(Math.max(0, index - 8), index + 16).join(" ");
    if (!nearby.includes(zhName)) continue;
    const label = lines.slice(index + 1, index + 12)
      .filter(Boolean)
      .find((line) => isUsefulHsLabel(line)) || nearby;
    candidates.push({ code, label: label.slice(0, 40), score: scoreHsCandidate(zhName, `${label} ${nearby}`, index) });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return best ? { code: best.code, label: `在线匹配：${best.label}` } : null;
}

function findChapterHint(lines) {
  const text = lines.slice(0, 180).join(" ");
  const match = text.match(/重点章节\s*【?(\d{4})】?/);
  return match ? match[1] : "";
}

function isUsefulHsLabel(line) {
  if (!line || /^\d{10}$/.test(line)) return false;
  if (/^\[[^\]]+\]$/.test(line)) return false;
  return !["类注", "章注", "子目注释", "详情", "4位", "6位", "注册登录", "后查看"].some((word) => line.includes(word));
}

function scoreHsCandidate(zhName, label, index) {
  let score = 1000 - index;
  const cleanName = compactChinese(zhName);
  const cleanLabel = compactChinese(label, 80);
  if (cleanLabel.includes(cleanName)) score += 1000;
  for (const char of cleanName) {
    if (cleanLabel.includes(char)) score += 20;
  }
  return score;
}

async function collect1688Product(url) {
  const safeUrl = normalize1688Url(url);
  const pages = await fetch1688CandidatePages(safeUrl);
  if (pages.length === 0) throw new Error("1688 页面无法访问，可能需要登录或被网站限制。");

  const merged = pages.reduce((result, page) => {
    const title = cleanupCollectedText(pickMetaContent(page.html, "og:title") || pickTitle(page.html));
    const imageUrls = pickImageUrls(page.html);
    const variants = pick1688Variants(page.html);
    return {
      title: result.title || title,
      images: [...new Set([...result.images, ...imageUrls])],
      variants: result.variants.length ? result.variants : variants
    };
  }, { title: "", images: [], variants: [] });

  if (!merged.title && merged.images.length === 0 && merged.variants.length === 0) {
    throw new Error("1688 页面被拦截或没有公开商品数据，未采集到主图和变体。");
  }

  return {
    purchaseUrl: safeUrl,
    title: merged.title,
    mainImage: merged.images[0] || "",
    images: merged.images.slice(0, 12),
    variants: merged.variants
  };
}

async function fetch1688CandidatePages(safeUrl) {
  const urls = [safeUrl];
  const mobileUrl = to1688MobileUrl(safeUrl);
  if (mobileUrl) urls.push(mobileUrl);

  const pages = [];
  for (const url of urls) {
    const html = await fetchText(url, url.includes("m.1688.com") ? mobile1688Headers() : desktop1688Headers()).catch(() => "");
    if (!html || is1688PunishPage(html)) continue;
    pages.push({ url, html });
  }
  return pages;
}

function to1688MobileUrl(safeUrl) {
  const match = safeUrl.match(/\/offer\/(\d+)\.html/i);
  return match ? `https://m.1688.com/offer/${match[1]}.html` : "";
}

function is1688PunishPage(html) {
  return html.includes("_____tmd_____") || html.includes("x5secdata") || html.includes("/punish?") || html.includes("验证码");
}

function desktop1688Headers() {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 Edg/125.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": "https://www.1688.com/"
  };
}

function mobile1688Headers() {
  return {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": "https://m.1688.com/"
  };
}

function normalize1688Url(value) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("请先填写 1688 采购链接。");
  const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  if (!/(^|\.)1688\.com$/i.test(url.hostname)) throw new Error("只支持 1688.com 的商品链接。");
  return url.toString();
}

function pickMetaContent(html, property) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  return decodeHtml(html.match(pattern)?.[1] || "");
}

function pickTitle(html) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function cleanupCollectedText(value) {
  return decodeHtml(String(value || ""))
    .replace(/\s+/g, " ")
    .replace(/[-_]?阿里巴巴1688.*$/i, "")
    .trim();
}

function normalizeImageUrl(value) {
  let url = decodeHtml(String(value || "").replace(/\\\//g, "/").trim());
  url = url.replace(/_(?:\d+x\d+|sum|\.webp).*$/i, "");
  if (!url) return "";
  if (url.startsWith("//")) url = `https:${url}`;
  if (url.startsWith("http://")) url = url.replace("http://", "https://");
  return /^https:\/\/[^"'\s]+$/i.test(url) ? url : "";
}

function pickImageUrls(html) {
  const urls = new Set();
  const metaImage = normalizeImageUrl(pickMetaContent(html, "og:image"));
  if (metaImage) urls.add(metaImage);

  const text = html.replace(/\\\//g, "/");
  for (const match of text.matchAll(/(?:https?:)?\/\/[^"'\s\\]+(?:alicdn|alibaba|cbu01)[^"'\s\\]+\.(?:jpg|jpeg|png|webp)(?:_[^"'\s\\]*)?/gi)) {
    const url = normalizeImageUrl(match[0]);
    if (url && !url.includes("60x60") && !url.includes("32x32")) urls.add(url);
    if (urls.size >= 30) break;
  }
  return [...urls];
}

function pick1688Variants(html) {
  const variants = new Map();
  const text = decodeHtml(html
    .replace(/\\u([0-9a-f]{4})/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\\\//g, "/"));

  const addVariant = (name, image = "", force = false) => {
    const cleanName = cleanupCollectedText(name);
    const cleanImage = normalizeImageUrl(image);
    if (!cleanName) return;
    if (variants.has(cleanName)) {
      if (cleanImage && !variants.get(cleanName).image) variants.get(cleanName).image = cleanImage;
      return;
    }
    if (!force && !isModelVariantName(cleanName)) return;
    variants.set(cleanName, { name: cleanName, image: cleanImage });
  };

  const imagePairs = [
    ...text.matchAll(/"name"\s*:\s*"([^"]{1,60})"[\s\S]{0,260}?"(?:imageUrl|image|originalImage)"\s*:\s*"([^"]+)"/gi),
    ...text.matchAll(/"(?:imageUrl|image|originalImage)"\s*:\s*"([^"]+)"[\s\S]{0,260}?"name"\s*:\s*"([^"]{1,60})"/gi)
  ];

  for (const match of imagePairs) {
    const first = match[1] || "";
    const second = match[2] || "";
    const name = first.includes("/") || first.includes(".jpg") ? second : first;
    const image = normalizeImageUrl(first.includes("/") || first.includes(".jpg") ? first : second);
    addVariant(name, image);
    if (variants.size >= 40) break;
  }

  for (const segment of pickSkuModelSegments(text)) {
    for (const match of segment.matchAll(/"(?:name|value|valueName|skuName|specName|propValue|text)"\s*:\s*"([^"]{1,50})"/gi)) {
      const name = cleanupCollectedText(match[1]);
      if (isUsefulVariantName(name)) addVariant(name, "", true);
      if (variants.size >= 40) break;
    }
    if (variants.size >= 40) break;
  }

  for (const match of text.matchAll(/M\s*\d{1,3}\s*(?:\u6b27\u89c4|\u7f8e\u89c4|\u6fb3\u89c4|\u65e5\u89c4|\u82f1\u89c4|\u56fd\u89c4|\u5fb7\u89c4|\u6b27\u6807|\u7f8e\u6807|\u82f1\u6807|\u6fb3\u6807)/gi)) {
    addVariant(match[0].replace(/\s+/g, ""), "", true);
    if (variants.size >= 40) break;
  }

  if (variants.size === 0) {
    for (const match of text.matchAll(/"(?:skuName|specName|valueName|propValue|name)"\s*:\s*"([^"]{1,40})"/gi)) {
      addVariant(match[1]);
      if (variants.size >= 40) break;
    }
  }

  return [...variants.values()].slice(0, 40);
}

function pickSkuModelSegments(text) {
  const segments = [];
  const labels = [
    "\u578b\u53f7", "\u89c4\u683c", "\u6b3e\u5f0f", "\u989c\u8272", "\u5c3a\u7801",
    "\u5957\u9910", "\u63d2\u5934", "\u7248\u672c"
  ];
  for (const label of labels) {
    let start = text.indexOf(label);
    while (start >= 0 && segments.length < 8) {
      segments.push(text.slice(Math.max(0, start - 300), start + 5000));
      start = text.indexOf(label, start + label.length);
    }
  }
  return segments;
}

function isModelVariantName(name) {
  if (!isUsefulVariantName(name)) return false;
  if (/^M\s*\d{1,3}/i.test(name)) return true;
  return /(\u6b27\u89c4|\u7f8e\u89c4|\u6fb3\u89c4|\u65e5\u89c4|\u82f1\u89c4|\u56fd\u89c4|\u5fb7\u89c4|\u6b27\u6807|\u7f8e\u6807|\u82f1\u6807|\u6fb3\u6807|\u63d2\u5934|\u578b\u53f7|\u89c4\u683c|\u5957\u9910|\u5355\u7535|\u53cc\u7535|\u88f8\u673a|\u7535\u6c60|\u5145\u7535\u5668|\u7ea2\u8272|\u9ed1\u8272|\u767d\u8272|\u84dd\u8272|\u7eff\u8272|\u7070\u8272)/.test(name);
}

function isUsefulVariantName(name) {
  if (!name || /^\d+$/.test(name)) return false;
  if (name.length > 40) return false;
  if (["\u578b\u53f7", "\u89c4\u683c", "\u6b3e\u5f0f", "\u989c\u8272", "\u5c3a\u7801", "\u5957\u9910", "\u7248\u672c"].includes(name)) return false;
  if (/\d+(?:\.\d+)?\s*(?:\u5143|\u4e2a\u53ef\u552e|\u4ef6|\u6761|\u5e74|kg|cm)/i.test(name)) return false;
  return ![
    "加采购车", "立即订购", "立即购买", "立即下单", "加入进货单", "收藏", "分享", "起批量", "成交",
    "价格", "优惠", "物流", "地址", "客服", "登录", "注册", "查看", "请选择",
    "个可售", "退货包运费", "售后延长", "晚发必赔", "跨境无忧", "咨询客服", "问题反馈"
  ].some((word) => name.includes(word));
}

function translate(value, pairs, fallback) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "-";
  const matched = pairs.find(([term]) => cleanValue.includes(term));
  return matched ? matched[1] : fallback;
}

const nameTranslations = [
  ["隔尿垫", "Changing Pad"], ["卸扣", "Shackle"], ["电话手表", "Smart Phone Watch"],
  ["智能手表", "Smart Watch"], ["手机壳", "Mobile Phone Case"], ["保护壳", "Protective Case"],
  ["数据线", "Data Cable"], ["充电线", "Charging Cable"], ["充电器", "Charger"],
  ["耳机", "Earphones"], ["键盘", "Keyboard"], ["鼠标", "Mouse"], ["玩具", "Toy"],
  ["模型", "Model"], ["衣服", "Garment"], ["背包", "Backpack"], ["手提包", "Handbag"],
  ["钱包", "Wallet"], ["妈咪包", "Diaper Bag"], ["收纳盒", "Storage Box"], ["杯子", "Cup"],
  ["碗", "Bowl"], ["盘子", "Plate"]
];

const materialTranslations = [
  ["纤维", "Textile Fiber"], ["布", "Fabric"], ["棉", "Cotton"], ["涤纶", "Polyester"],
  ["塑料", "Plastic"], ["硅胶", "Silicone"], ["橡胶", "Rubber"], ["钢铁", "Steel"],
  ["不锈钢", "Stainless Steel"], ["合金", "Alloy"], ["木", "Wood"], ["纸", "Paper"],
  ["皮革", "Leather"], ["电子", "Electronic Components"]
];

const useTranslations = [
  ["防漏", "For Leakage Protection"], ["连接", "For Connecting"], ["固定", "For Fastening"],
  ["通话", "For Calling"], ["定位", "For Positioning"], ["保护", "For Protection"],
  ["收纳", "For Storage"], ["穿着", "For Wearing"], ["装饰", "For Decoration"],
  ["充电", "For Charging"], ["传输", "For Data Transfer"], ["娱乐", "For Entertainment"],
  ["日用", "For Daily Use"]
];

async function buildProduct(input, user, existingProduct = null) {
  const length = toNumber(input.length);
  const width = toNumber(input.width);
  const height = toNumber(input.height);
  const weight = toNumber(input.weight);
  const price = toNumber(input.price);
  const volumeCbm = length * width * height / 1000000;
  const volumeWeight = length * width * height / VOLUME_DIVISOR;
  const chargeWeight = Math.max(weight, volumeWeight);
  const zhName = compactChinese(input.zhName);
  const materialZh = compactChinese(input.materialZh);
  const useZh = compactChinese(input.useZh);
  const hsResult = await lookupHsCodeWithOnline(zhName);
  const storeName = String(input.storeName || "").trim();
  const customName = String(input.customName || "").trim();
  const purchaseUrl = String(input.purchaseUrl || "").trim();
  const mainImage = String(input.mainImage || "").trim();
  const variants = normalizeVariants(input.variants);

  return {
    id: existingProduct?.id || createId("prod"),
    storeName,
    customName,
    purchaseUrl,
    mainImage,
    variants,
    declarationName: storeName && customName ? `${storeName}-${customName}` : customName || storeName,
    zhName,
    enName: translate(zhName, nameTranslations, "General Merchandise"),
    materialZh,
    materialEn: translate(materialZh, materialTranslations, "To Be Confirmed"),
    useZh,
    useEn: translate(useZh, useTranslations, "For Daily Use"),
    category: String(input.category || "普货").trim(),
    length,
    width,
    height,
    weight,
    price,
    volumeCbm: round(volumeCbm, 6),
    chargeWeight: round(chargeWeight, 2),
    hsCode: hsResult.code,
    hsLabel: hsResult.label,
    createdAt: existingProduct?.createdAt || nowIso(),
    createdBy: existingProduct?.createdBy || user.id,
    updatedAt: nowIso(),
    updatedBy: user.id
  };
}

function normalizeVariants(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        name: String(item?.name || "").trim(),
        image: String(item?.image || item?.imageUrl || "").trim()
      }))
      .filter((item) => item.name || item.image)
      .slice(0, 80);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      return normalizeVariants(JSON.parse(value));
    } catch {
      return value.split(/\n+/)
        .map((line) => {
          const [name, image] = line.split(/\s*,\s*/);
          return { name: String(name || "").trim(), image: String(image || "").trim() };
        })
        .filter((item) => item.name || item.image)
        .slice(0, 80);
    }
  }
  return [];
}

function validateProduct(product) {
  const missing = [];
  ["storeName", "customName", "zhName", "materialZh", "useZh", "category"].forEach((field) => {
    if (!product[field]) missing.push(field);
  });
  if (missing.length > 0) return `缺少必填字段：${missing.join(", ")}`;
  if (product.length <= 0 || product.width <= 0 || product.height <= 0 || product.weight <= 0) return "长宽高和重量必须大于 0";
  return null;
}

function normalizeMatchText(value) {
  return String(value || "").trim().replace(/\s+/g, "").toLowerCase();
}

function findProductMatchByChineseName(value) {
  const query = normalizeMatchText(value);
  if (!query) return null;
  const scored = db.products.map((product) => {
    const fields = [product.zhName, product.customName, product.declarationName, product.storeName]
      .map(normalizeMatchText)
      .filter(Boolean);
    let score = 0;
    for (const field of fields) {
      if (field === query) score = Math.max(score, 100);
      else if (field.includes(query)) score = Math.max(score, 80);
      else if (query.includes(field)) score = Math.max(score, Math.min(70, field.length * 3));
    }
    return { product, score };
  }).filter((item) => item.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.product || null;
}

function publicProductMatch(product) {
  if (!product) return null;
  return {
    id: product.id,
    storeName: product.storeName || "",
    customName: product.customName || "",
    purchaseUrl: product.purchaseUrl || "",
    mainImage: product.mainImage || "",
    variants: Array.isArray(product.variants) ? product.variants : [],
    declarationName: product.declarationName || "",
    zhName: product.zhName || "",
    enName: product.enName || "",
    materialZh: product.materialZh || "",
    materialEn: product.materialEn || "",
    useZh: product.useZh || "",
    useEn: product.useEn || "",
    category: product.category || "",
    length: product.length || 0,
    width: product.width || 0,
    height: product.height || 0,
    weight: product.weight || 0,
    price: product.price || 0,
    volumeCbm: product.volumeCbm || 0,
    chargeWeight: product.chargeWeight || 0,
    hsCode: product.hsCode || "",
    hsLabel: product.hsLabel || ""
  };
}

function buildShipmentLine(input = {}, index = 0) {
  const lineType = input.lineType === "product" ? "product" : "box";
  const length = toNumber(input.length);
  const width = toNumber(input.width);
  const height = toNumber(input.height);
  const actualWeight = toNumber(input.actualWeight ?? input.weight);
  const volumeCbm = length * width * height / 1000000;
  const volumeWeight = length * width * height / VOLUME_DIVISOR;
  const chargeWeight = Math.max(actualWeight, volumeWeight);
  const productNameZh = compactChinese(input.productNameZh || input.zhName || input.productName, 60);
  const matchedProduct = input.productId
    ? db.products.find((product) => product.id === input.productId) || findProductMatchByChineseName(productNameZh)
    : findProductMatchByChineseName(productNameZh);
  const matched = publicProductMatch(matchedProduct);

  return {
    id: input.id || createId("shipline"),
    lineType,
    boxNo: String(input.boxNo || input.cartonNo || index + 1).trim(),
    productNameZh,
    quantity: toNumber(input.quantity),
    productId: matched?.id || "",
    matchedProduct: matched,
    declarationName: matched?.declarationName || productNameZh,
    zhName: matched?.zhName || productNameZh,
    enName: matched?.enName || "",
    materialZh: matched?.materialZh || "",
    materialEn: matched?.materialEn || "",
    useZh: matched?.useZh || "",
    useEn: matched?.useEn || "",
    category: matched?.category || "",
    hsCode: matched?.hsCode || "",
    hsLabel: matched?.hsLabel || "",
    length,
    width,
    height,
    actualWeight: round(actualWeight, 3),
    volumeCbm: round(volumeCbm, 6),
    volumeWeight: round(volumeWeight, 2),
    chargeWeight: round(chargeWeight, 2),
    remark: String(input.remark || "").trim()
  };
}

function summarizeShipmentLines(lines) {
  const boxes = new Map();
  for (const line of lines) {
    const key = String(line.boxNo || "").trim() || line.id;
    if (!boxes.has(key)) boxes.set(key, line);
  }
  const boxLines = [...boxes.values()];
  return {
    boxCount: boxLines.length,
    productCount: lines.filter((line) => line.productNameZh).length,
    totalCbm: round(boxLines.reduce((sum, line) => sum + toNumber(line.volumeCbm), 0), 6),
    totalActualWeight: round(boxLines.reduce((sum, line) => sum + toNumber(line.actualWeight), 0), 3),
    totalVolumeWeight: round(boxLines.reduce((sum, line) => sum + toNumber(line.volumeWeight), 0), 2),
    totalChargeWeight: round(boxLines.reduce((sum, line) => sum + toNumber(line.chargeWeight), 0), 2)
  };
}

function buildDomesticShipment(input, user, existingShipment = null) {
  const lines = (Array.isArray(input.lines) ? input.lines : [])
    .map((line, index) => buildShipmentLine(line, index))
    .filter((line) => line.lineType === "product"
      ? Boolean(line.productNameZh)
      : (line.productNameZh || line.length || line.width || line.height || line.actualWeight));
  const summary = summarizeShipmentLines(lines);
  const now = nowIso();
  return {
    id: existingShipment?.id || createId("shipment"),
    tenantId: existingShipment?.tenantId || getTenantId(user),
    shipmentNo: String(input.shipmentNo || existingShipment?.shipmentNo || `DS${Date.now()}`).trim(),
    shippedAt: String(input.shippedAt || input.shipped_at || "").trim(),
    logisticsProvider: String(input.logisticsProvider || input.logistics_provider || "").trim(),
    logisticsMethod: ["air", "sea"].includes(input.logisticsMethod || input.logistics_method) ? (input.logisticsMethod || input.logistics_method) : "air",
    shipper: String(input.shipper || "").trim(),
    storeName: String(input.storeName || input.store_name || "").trim(),
    trackingNo: String(input.trackingNo || input.tracking_no || "").trim(),
    customNo: String(input.customNo || input.custom_no || "").trim(),
    platformShipmentNo: String(input.platformShipmentNo || input.platform_shipment_no || "").trim(),
    title: String(input.title || input.customNo || input.trackingNo || existingShipment?.title || "").trim(),
    status: String(input.status || existingShipment?.status || "draft").trim(),
    receiver: String(input.receiver || "").trim(),
    address: String(input.address || "").trim(),
    remark: String(input.remark || "").trim(),
    lines,
    ...summary,
    createdAt: existingShipment?.createdAt || now,
    createdBy: existingShipment?.createdBy || user.id,
    updatedAt: now,
    updatedBy: user.id,
    deletedAt: existingShipment?.deletedAt || ""
  };
}

function validateDomesticShipment(shipment) {
  if (!shipment.logisticsProvider) return "请填写物流商";
  if (!shipment.logisticsMethod) return "请选择物流方式";
  if (!shipment.shipper) return "请填写发货人";
  if (!shipment.storeName) return "请填写店铺名";
  if (!shipment.lines.length) return "请至少录入一行箱子数据";
  const invalidBox = shipment.lines.find((line) => line.lineType !== "product" && (line.length <= 0 || line.width <= 0 || line.height <= 0 || line.actualWeight <= 0));
  if (invalidBox) return `箱号 ${invalidBox.boxNo || "-"} 缺少长宽高或实重`;
  const productLines = shipment.lines.filter((line) => line.productNameZh);
  if (!productLines.length) return "请至少录入一个产品中文名";
  const invalidProduct = productLines.find((line) => line.length <= 0 || line.width <= 0 || line.height <= 0 || line.actualWeight <= 0);
  if (invalidProduct) return `箱号 ${invalidProduct.boxNo || "-"} 的产品缺少箱子长宽高或实重`;
  return null;
}

function findTenantShipment(user, id, includeDeleted = false) {
  const tenantId = getTenantId(user);
  return db.domesticShipments.find((shipment) => shipment.id === id && shipment.tenantId === tenantId && (includeDeleted || !shipment.deletedAt));
}

function addLog(user, action, targetId, detail) {
  db.logs.unshift({ id: createId("log"), userId: user.id, username: user.username, action, targetId, detail, createdAt: nowIso() });
  db.logs = db.logs.slice(0, 1000);
}

function encryptSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  const [version, ivText, tagText, encryptedText] = text.split(":");
  if (version !== "v1" || !ivText || !tagText || !encryptedText) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function maskSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 8) return `${text.slice(0, 2)}****${text.slice(-2)}`;
  return `${text.slice(0, 7)}****${text.slice(-4)}`;
}

function bindingForShop(shopId) {
  return db.storeBindings.find((binding) => binding.shopId === shopId && !binding.deletedAt);
}

function sanitizeShop(shop) {
  const apiKey = decryptSecret(shop.api_key_encrypted);
  const apiSecret = decryptSecret(shop.api_secret_encrypted);
  const accessToken = decryptSecret(shop.access_token_encrypted);
  const refreshToken = decryptSecret(shop.refresh_token_encrypted);
  return {
    id: shop.id,
    tenant_id: shop.tenant_id,
    platform: shop.platform,
    shop_name: shop.shop_name,
    seller_id: shop.seller_id,
    auth_type: shop.auth_type,
    status: shop.status,
    token_expires_at: shop.token_expires_at || "",
    last_sync_at: shop.last_sync_at || "",
    last_error: shop.last_error || "",
    api_key_masked: maskSecret(apiKey),
    api_secret_masked: maskSecret(apiSecret),
    access_token_masked: maskSecret(accessToken),
    refresh_token_masked: maskSecret(refreshToken),
    has_api_key: Boolean(apiKey),
    has_api_secret: Boolean(apiSecret),
    has_access_token: Boolean(accessToken),
    has_refresh_token: Boolean(refreshToken),
    created_at: shop.created_at,
    updated_at: shop.updated_at,
    deleted_at: shop.deleted_at || ""
  };
}

function findTenantShop(user, id, includeDeleted = false) {
  const tenantId = getTenantId(user);
  return db.shops.find((shop) => (shop.id === id || shop.shopName === id) && getShopTenantId(shop) === tenantId && (includeDeleted || !shop.deleted_at));
}

function normalizeShopPayload(body, existingShop = null, user = null) {
  const now = nowIso();
  const platform = normalizePlatformType(body.platform || body.platformType || existingShop?.platform || "mercadolibre");
  const authType = normalizeAuthType(body.auth_type || body.authType || existingShop?.auth_type || defaultAuthType(platform));
  return {
    id: existingShop?.id || createId("shop"),
    tenant_id: existingShop?.tenant_id || existingShop?.tenantId || getTenantId(user),
    platform,
    shop_name: String(body.shop_name || body.shopName || "").trim(),
    seller_id: String(body.seller_id || body.sellerId || body.shopAccount || "").trim(),
    auth_type: authType,
    access_token_encrypted: existingShop?.access_token_encrypted || "",
    refresh_token_encrypted: existingShop?.refresh_token_encrypted || "",
    api_key_encrypted: existingShop?.api_key_encrypted || "",
    api_secret_encrypted: existingShop?.api_secret_encrypted || "",
    token_expires_at: String(body.token_expires_at || body.tokenExpiresAt || existingShop?.token_expires_at || "").trim(),
    status: existingShop?.status || "disconnected",
    last_sync_at: existingShop?.last_sync_at || "",
    last_error: existingShop?.last_error || "",
    created_at: existingShop?.created_at || existingShop?.createdAt || now,
    created_by: existingShop?.created_by || existingShop?.createdBy || user.id,
    updated_at: now,
    updated_by: user.id,
    deleted_at: existingShop?.deleted_at || existingShop?.deletedAt || ""
  };
}

function validateShopPayload(shop) {
  const missing = [];
  if (!shop.shop_name) missing.push("店铺名称");
  if (!shop.platform) missing.push("平台类型");
  if (!shop.seller_id) missing.push("Seller ID/店铺账号");
  if (!shop.auth_type) missing.push("授权方式");
  if (!marketplaceAdapters[shop.platform]) missing.push("支持的平台");
  return missing.length ? `缺少必填字段：${missing.join("、")}` : null;
}

function applyShopSecrets(shop, body) {
  const apiKey = String(body.api_key || body.apiKey || "").trim();
  const apiSecret = String(body.api_secret || body.apiSecret || "").trim();
  const accessToken = String(body.access_token || body.accessToken || "").trim();
  const refreshToken = String(body.refresh_token || body.refreshToken || "").trim();
  if (apiKey) shop.api_key_encrypted = encryptSecret(apiKey);
  if (apiSecret) shop.api_secret_encrypted = encryptSecret(apiSecret);
  if (accessToken) shop.access_token_encrypted = encryptSecret(accessToken);
  if (refreshToken) shop.refresh_token_encrypted = encryptSecret(refreshToken);
  return shop;
}

function getShopCredentials(shop) {
  return {
    apiKey: decryptSecret(shop.api_key_encrypted),
    apiSecret: decryptSecret(shop.api_secret_encrypted),
    accessToken: decryptSecret(shop.access_token_encrypted),
    refreshToken: decryptSecret(shop.refresh_token_encrypted)
  };
}

function normalizePlatformType(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (["mercadolibre", "mercadolibre美客多", "美客多"].includes(normalized)) return "mercadolibre";
  if (normalized === "tiktokshop") return "tiktokshop";
  return normalized;
}

function normalizeAuthType(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "_");
  return ["oauth", "api_key", "manual"].includes(normalized) ? normalized : "manual";
}

function defaultAuthType(platform) {
  if (platform === "mercadolibre") return "oauth";
  if (["noon", "takealot"].includes(platform)) return "api_key";
  return "manual";
}

function getShopTenantId(shop) {
  return shop.tenant_id || shop.tenantId || DEFAULT_TENANT_ID;
}

function assertSecretRequirements(shop, isCreate = false) {
  const credentials = getShopCredentials(shop);
  if (shop.auth_type === "oauth") {
    if (isCreate && !credentials.accessToken && !credentials.refreshToken) return "OAuth 店铺至少需要 access_token 或 refresh_token";
  }
  if (shop.auth_type === "api_key") {
    if (isCreate && !credentials.apiKey) return "API Key 店铺必须填写 API Key";
  }
  return null;
}

class MarketplaceAdapter {
  async testConnection() {
    throw new Error("该平台暂未实现测试连接");
  }

  async refreshToken() {
    throw new Error("该平台暂不支持刷新 token");
  }

  async fetchOrders() {
    throw new Error("订单同步适配器待接入");
  }

  async fetchProducts() {
    throw new Error("商品同步适配器待接入");
  }

  async updateStock() {
    throw new Error("库存同步适配器待接入");
  }
}

class MercadoLibreAdapter extends MarketplaceAdapter {
  async testConnection(shop) {
    const credentials = getShopCredentials(shop);
    if (!credentials.accessToken) throw new Error("缺少 Mercado Libre access_token");
    const response = await fetch("https://api.mercadolibre.com/users/me", {
      headers: { "Authorization": `Bearer ${credentials.accessToken}`, "Accept": "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`Mercado Libre 返回 ${response.status}`);
    const profile = await response.json().catch(() => ({}));
    return { ok: true, message: `Mercado Libre 连接成功${profile.id ? `，Seller ID ${profile.id}` : ""}` };
  }

  async refreshToken(shop) {
    const credentials = getShopCredentials(shop);
    if (!credentials.refreshToken) throw new Error("缺少 refresh_token");
    if (!credentials.apiKey || !credentials.apiSecret) throw new Error("刷新 token 需要 Client ID/API Key 和 API Secret");
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: credentials.apiKey,
      client_secret: credentials.apiSecret,
      refresh_token: credentials.refreshToken
    });
    const response = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body,
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Mercado Libre 刷新失败 ${response.status}`);
    if (data.access_token) shop.access_token_encrypted = encryptSecret(data.access_token);
    if (data.refresh_token) shop.refresh_token_encrypted = encryptSecret(data.refresh_token);
    if (data.expires_in) shop.token_expires_at = new Date(Date.now() + Number(data.expires_in) * 1000).toISOString();
    return { ok: true, message: "Mercado Libre token 已刷新" };
  }
}

class NoonAdapter extends MarketplaceAdapter {
  async testConnection(shop) {
    const credentials = getShopCredentials(shop);
    if (!credentials.apiKey || !credentials.apiSecret) throw new Error("noon 需要 API Key 和 API Secret");
    if (credentials.apiKey.length < 8 || credentials.apiSecret.length < 8) throw new Error("noon 密钥长度过短");
    return { ok: true, message: "noon 密钥格式已通过，正式 API 适配器待接入" };
  }
}

class TakealotAdapter extends MarketplaceAdapter {
  async testConnection(shop) {
    const credentials = getShopCredentials(shop);
    if (!shop.seller_id) throw new Error("takealot 需要 Seller ID");
    if (!credentials.apiKey) throw new Error("takealot 需要 API Key");
    if (credentials.apiKey.length < 8) throw new Error("takealot API Key 长度过短");
    return { ok: true, message: "takealot 密钥格式已通过，正式 API 适配器待接入" };
  }
}

const marketplaceAdapters = {
  mercadolibre: new MercadoLibreAdapter(),
  noon: new NoonAdapter(),
  takealot: new TakealotAdapter()
};

function getMarketplaceAdapter(platform) {
  const adapter = marketplaceAdapters[normalizePlatformType(platform)];
  if (!adapter) throw new Error("暂不支持该平台");
  return adapter;
}

function getRequestOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${req.headers.host}`;
}

function mercadoLibreRedirectUri(req) {
  return `${getRequestOrigin(req)}/oauth/mercadolibre/callback`;
}

function createMercadoLibreAuthUrl(req, user, body) {
  const clientId = String(body.client_id || body.clientId || body.api_key || body.apiKey || "").trim();
  const clientSecret = String(body.client_secret || body.clientSecret || body.api_secret || body.apiSecret || "").trim();
  const shopName = String(body.shop_name || body.shopName || "").trim();
  const sellerId = String(body.seller_id || body.sellerId || "").trim();
  if (!clientId) throw new Error("缺少 Mercado Libre Client ID / API Key");
  if (!clientSecret) throw new Error("缺少 Mercado Libre Client Secret / API Secret");

  const state = crypto.randomBytes(24).toString("hex");
  db.oauthStates.unshift({
    state,
    tenant_id: getTenantId(user),
    user_id: user.id,
    platform: "mercadolibre",
    shop_name: shopName,
    seller_id: sellerId,
    client_id_encrypted: encryptSecret(clientId),
    client_secret_encrypted: encryptSecret(clientSecret),
    redirect_uri: mercadoLibreRedirectUri(req),
    created_at: nowIso(),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
  db.oauthStates = db.oauthStates.slice(0, 100);

  const url = new URL("https://auth.mercadolibre.com/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", mercadoLibreRedirectUri(req));
  url.searchParams.set("state", state);
  return { authUrl: url.toString(), state, redirectUri: mercadoLibreRedirectUri(req), expiresIn: 600 };
}

async function exchangeMercadoLibreCode(code, oauthState) {
  const clientId = decryptSecret(oauthState.client_id_encrypted);
  const clientSecret = decryptSecret(oauthState.client_secret_encrypted);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: oauthState.redirect_uri
  });
  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body,
    signal: AbortSignal.timeout(12000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error_description || `Mercado Libre 授权失败 ${response.status}`);
  return { ...data, clientId, clientSecret };
}

async function fetchMercadoLibreProfile(accessToken) {
  const response = await fetch("https://api.mercadolibre.com/users/me", {
    headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
    signal: AbortSignal.timeout(10000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Mercado Libre 用户信息获取失败 ${response.status}`);
  return data;
}

function upsertMercadoLibreShopFromOAuth(oauthState, tokenData, profile, user) {
  const tenantId = oauthState.tenant_id;
  const sellerId = String(profile.id || oauthState.seller_id || tokenData.user_id || "").trim();
  const shopName = oauthState.shop_name || profile.nickname || `Mercado Libre ${sellerId}`;
  let shop = db.shops.find((item) => getShopTenantId(item) === tenantId && item.platform === "mercadolibre" && item.seller_id === sellerId && !item.deleted_at);
  const now = nowIso();
  if (!shop) {
    shop = {
      id: createId("shop"),
      tenant_id: tenantId,
      platform: "mercadolibre",
      shop_name: shopName,
      seller_id: sellerId,
      auth_type: "oauth",
      access_token_encrypted: "",
      refresh_token_encrypted: "",
      api_key_encrypted: "",
      api_secret_encrypted: "",
      token_expires_at: "",
      status: "connected",
      last_sync_at: "",
      last_error: "",
      created_at: now,
      created_by: user.id,
      updated_at: now,
      updated_by: user.id,
      deleted_at: ""
    };
    db.shops.unshift(shop);
    db.storeBindings.unshift({
      id: createId("binding"),
      tenant_id: tenantId,
      shop_id: shop.id,
      platform: "mercadolibre",
      auth_type: "oauth",
      capabilities: ["testConnection", "refreshToken", "fetchOrders", "fetchProducts", "updateStock"],
      created_at: now,
      updated_at: now,
      deleted_at: ""
    });
  }

  shop.shop_name = shopName;
  shop.seller_id = sellerId;
  shop.auth_type = "oauth";
  shop.access_token_encrypted = tokenData.access_token ? encryptSecret(tokenData.access_token) : shop.access_token_encrypted;
  shop.refresh_token_encrypted = tokenData.refresh_token ? encryptSecret(tokenData.refresh_token) : shop.refresh_token_encrypted;
  shop.api_key_encrypted = encryptSecret(tokenData.clientId);
  shop.api_secret_encrypted = encryptSecret(tokenData.clientSecret);
  shop.token_expires_at = tokenData.expires_in ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString() : shop.token_expires_at;
  shop.status = "connected";
  shop.last_error = "";
  shop.updated_at = now;
  shop.updated_by = user.id;
  return shop;
}

function oauthResultPage(title, message, ok = true) {
  const color = ok ? "#0f8a7a" : "#d74f5a";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title><style>
    body{font-family:"Microsoft YaHei",Arial,sans-serif;background:#f6f8f3;color:#17211c;display:grid;place-items:center;min-height:100vh;margin:0}
    main{width:min(520px,calc(100vw - 32px));background:white;border:1px solid #dce5df;border-radius:8px;padding:24px;box-shadow:0 14px 34px rgba(18,32,26,.08)}
    h1{margin:0 0 12px;color:${color};font-size:24px}p{line-height:1.7}.button{display:inline-flex;margin-top:14px;padding:10px 14px;background:#0f8a7a;color:white;border-radius:8px;text-decoration:none;font-weight:700}
  </style></head><body><main><h1>${title}</h1><p>${message}</p><a class="button" href="/">返回 ERP</a><script>setTimeout(()=>{location.href="/"},2500)</script></main></body></html>`;
}

async function handleApi(req, res, pathname) {
  try {
    if (pathname === "/api/login" && req.method === "POST") {
      const body = await readBody(req);
      const user = db.users.find((item) => item.username === String(body.username || "").trim());
      if (!user || user.passwordHash !== sha256(String(body.password || ""))) return sendJson(res, 401, { error: "账号或密码错误" });

      const token = crypto.randomBytes(32).toString("hex");
      db.sessions.push({ token, userId: user.id, createdAt: nowIso(), expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
      await saveDb();
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": `erp_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
        "Cache-Control": "no-store"
      });
      res.end(JSON.stringify({ user: publicUser(user) }));
      return;
    }

    if (pathname === "/api/logout" && req.method === "POST") {
      const session = getSession(req);
      if (session) {
        db.sessions = db.sessions.filter((item) => item.token !== session.token);
        await saveDb();
      }
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": "erp_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
        "Cache-Control": "no-store"
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (pathname === "/api/me" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      return sendJson(res, 200, { user: publicUser(session.user) });
    }

    if (pathname === "/api/products" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const url = new URL(req.url, `http://${req.headers.host}`);
      const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
      const products = db.products.filter((product) => {
        if (!q) return true;
        return [product.storeName, product.customName, product.zhName, product.enName, product.category, product.hsCode]
          .some((value) => String(value || "").toLowerCase().includes(q));
      }).slice(0, 300);
      return sendJson(res, 200, { products });
    }

    if (pathname === "/api/products" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const product = await buildProduct(await readBody(req), session.user);
      const error = validateProduct(product);
      if (error) return sendJson(res, 400, { error });
      db.products.unshift(product);
      addLog(session.user, "create_product", product.id, `新增商品 ${product.declarationName}`);
      await saveDb();
      return sendJson(res, 201, { product });
    }

    if (pathname === "/api/products/batch" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const rows = Array.isArray(body.products) ? body.products : [];
      if (!rows.length) return sendJson(res, 400, { error: "没有可导入的商品" });
      if (rows.length > 500) return sendJson(res, 400, { error: "单次最多导入 500 条" });

      const created = [];
      const errors = [];
      rows.forEach((row, index) => {
        created.push({ row, index });
      });

      const productsToCreate = [];
      for (const item of created) {
        const product = await buildProduct(item.row, session.user);
        const error = validateProduct(product);
        if (error) errors.push({ row: item.index + 2, error });
        else productsToCreate.push(product);
      }
      if (errors.length) return sendJson(res, 400, { error: "导入数据有错误", errors });

      db.products.unshift(...productsToCreate);
      addLog(session.user, "batch_create_product", "batch", `批量导入 ${productsToCreate.length} 个商品`);
      await saveDb();
      return sendJson(res, 201, { products: productsToCreate, count: productsToCreate.length });
    }

    if (pathname === "/api/products/match" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const url = new URL(req.url, `http://${req.headers.host}`);
      const product = findProductMatchByChineseName(url.searchParams.get("name") || "");
      return sendJson(res, 200, { product: publicProductMatch(product) });
    }

    if (pathname === "/api/domestic-shipments" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const tenantId = getTenantId(session.user);
      const shipments = db.domesticShipments
        .filter((shipment) => shipment.tenantId === tenantId && !shipment.deletedAt)
        .map((shipment) => ({
          id: shipment.id,
          shipmentNo: shipment.shipmentNo,
          shippedAt: shipment.shippedAt || "",
          logisticsProvider: shipment.logisticsProvider || "",
          logisticsMethod: shipment.logisticsMethod || "",
          storeName: shipment.storeName || "",
          trackingNo: shipment.trackingNo || "",
          customNo: shipment.customNo || "",
          platformShipmentNo: shipment.platformShipmentNo || "",
          title: shipment.title,
          status: shipment.status,
          boxCount: shipment.boxCount,
          productCount: shipment.productCount || 0,
          totalCbm: shipment.totalCbm,
          totalActualWeight: shipment.totalActualWeight,
          totalChargeWeight: shipment.totalChargeWeight,
          updatedAt: shipment.updatedAt,
          createdAt: shipment.createdAt
        }));
      return sendJson(res, 200, { shipments });
    }

    if (pathname === "/api/domestic-shipments" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const shipment = buildDomesticShipment(await readBody(req), session.user);
      const error = validateDomesticShipment(shipment);
      if (error) return sendJson(res, 400, { error });
      db.domesticShipments.unshift(shipment);
      addLog(session.user, "create_domestic_shipment", shipment.id, `新增国内发货单 ${shipment.shipmentNo}`);
      await saveDb();
      return sendJson(res, 201, { shipment });
    }

    const domesticShipmentMatch = pathname.match(/^\/api\/domestic-shipments\/([^/]+)(?:\/(packing-list))?$/);
    if (domesticShipmentMatch && req.method === "GET" && domesticShipmentMatch[2] === "packing-list") {
      const session = requireAuth(req, res);
      if (!session) return;
      const shipment = findTenantShipment(session.user, domesticShipmentMatch[1]);
      if (!shipment) return sendJson(res, 404, { error: "发货单不存在" });
      const headers = [
        "箱号", "箱长cm", "箱宽cm", "箱高cm", "箱实重kg", "箱CBM", "箱体积重kg", "箱计费重kg",
        "箱内产品中文名", "数量",
        "产品图片", "产品库ID", "店铺名", "自定义商品名", "1688采购链接", "主图链接", "变体信息",
        "申报名", "中文品名", "英文品名", "中文材质", "英文材质", "中文用途", "英文用途",
        "产品类别", "产品长cm", "产品宽cm", "产品高cm", "产品重量kg", "采购价RMB",
        "产品体积m3", "产品计费重kg", "海关编码", "海关编码标签"
      ];
      const exportLines = shipment.lines.filter((line) => line.productNameZh);
      const rows = exportLines.map((line) => {
        const storedProduct = line.productId ? db.products.find((product) => product.id === line.productId) : null;
        const product = publicProductMatch(storedProduct) || line.matchedProduct || {};
        return [
          line.boxNo,
          line.length,
          line.width,
          line.height,
          line.actualWeight,
          line.volumeCbm,
          line.volumeWeight,
          line.chargeWeight,
          line.productNameZh,
          line.quantity || "",
          { type: "image", src: product.mainImage || "" },
          product.id || line.productId || "",
          product.storeName || "",
          product.customName || "",
          product.purchaseUrl || "",
          product.mainImage || "",
          JSON.stringify(product.variants || []),
          product.declarationName || line.declarationName || "",
          product.zhName || line.zhName || "",
          product.enName || line.enName || "",
          product.materialZh || line.materialZh || "",
          product.materialEn || line.materialEn || "",
          product.useZh || line.useZh || "",
          product.useEn || line.useEn || "",
          product.category || line.category || "",
          product.length || "",
          product.width || "",
          product.height || "",
          product.weight || "",
          product.price || "",
          product.volumeCbm || "",
          product.chargeWeight || "",
          product.hsCode || line.hsCode || "",
          product.hsLabel || line.hsLabel || ""
        ];
      });
      rows.push([
        "合计", "", "", "", shipment.totalActualWeight, shipment.totalCbm, shipment.totalVolumeWeight, shipment.totalChargeWeight,
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ]);
      return sendExcelHtml(res, `国内发货箱单_${shipment.shipmentNo}.xls`, headers, rows);
    }

    if (domesticShipmentMatch && req.method === "GET" && !domesticShipmentMatch[2]) {
      const session = requireAuth(req, res);
      if (!session) return;
      const shipment = findTenantShipment(session.user, domesticShipmentMatch[1]);
      if (!shipment) return sendJson(res, 404, { error: "发货单不存在" });
      return sendJson(res, 200, { shipment });
    }

    if (domesticShipmentMatch && req.method === "PUT" && !domesticShipmentMatch[2]) {
      const session = requireWritable(req, res);
      if (!session) return;
      const shipment = findTenantShipment(session.user, domesticShipmentMatch[1]);
      if (!shipment) return sendJson(res, 404, { error: "发货单不存在" });
      const updated = buildDomesticShipment(await readBody(req), session.user, shipment);
      const error = validateDomesticShipment(updated);
      if (error) return sendJson(res, 400, { error });
      Object.assign(shipment, updated);
      addLog(session.user, "update_domestic_shipment", shipment.id, `修改国内发货单 ${shipment.shipmentNo}`);
      await saveDb();
      return sendJson(res, 200, { shipment });
    }

    if (domesticShipmentMatch && req.method === "DELETE" && !domesticShipmentMatch[2]) {
      const session = requireWritable(req, res);
      if (!session) return;
      const shipment = findTenantShipment(session.user, domesticShipmentMatch[1]);
      if (!shipment) return sendJson(res, 404, { error: "发货单不存在" });
      shipment.deletedAt = nowIso();
      shipment.updatedAt = shipment.deletedAt;
      shipment.updatedBy = session.user.id;
      addLog(session.user, "delete_domestic_shipment", shipment.id, `删除国内发货单 ${shipment.shipmentNo}`);
      await saveDb();
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === "/api/shops" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const tenantId = getTenantId(session.user);
      const shops = db.shops
        .filter((shop) => getShopTenantId(shop) === tenantId && !shop.deleted_at)
        .map(sanitizeShop);
      return sendJson(res, 200, { shops });
    }

    if (pathname === "/api/shops/mercadolibre/auth-url" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const result = createMercadoLibreAuthUrl(req, session.user, body);
      addLog(session.user, "create_mercadolibre_auth_url", "mercadolibre", "生成 Mercado Libre 授权链接");
      await saveDb();
      return sendJson(res, 200, result);
    }

    if (pathname === "/api/shops" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const shop = normalizeShopPayload(body, null, session.user);
      applyShopSecrets(shop, body);
      const error = validateShopPayload(shop);
      if (error) return sendJson(res, 400, { error });
      const secretError = assertSecretRequirements(shop, true);
      if (secretError) return sendJson(res, 400, { error: secretError });
      db.shops.unshift(shop);
      db.storeBindings.unshift({
        id: createId("binding"),
        tenant_id: shop.tenant_id,
        shop_id: shop.id,
        platform: shop.platform,
        auth_type: shop.auth_type,
        capabilities: ["testConnection", "refreshToken", "fetchOrders", "fetchProducts", "updateStock"],
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: ""
      });
      addLog(session.user, "create_shop", shop.id, `新增店铺 ${shop.shop_name}`);
      await saveDb();
      return sendJson(res, 201, { shop: sanitizeShop(shop) });
    }

    const shopMatch = pathname.match(/^\/api\/shops\/([^/]+)(?:\/(test-connection|refresh-token))?$/);
    if (shopMatch && req.method === "GET" && !shopMatch[2]) {
      const session = requireAuth(req, res);
      if (!session) return;
      const shop = findTenantShop(session.user, shopMatch[1]);
      if (!shop) return sendJson(res, 404, { error: "店铺不存在" });
      return sendJson(res, 200, { shop: sanitizeShop(shop) });
    }

    if (shopMatch && req.method === "PUT" && !shopMatch[2]) {
      const session = requireWritable(req, res);
      if (!session) return;
      const shop = findTenantShop(session.user, shopMatch[1]);
      if (!shop) return sendJson(res, 404, { error: "店铺不存在" });
      const body = await readBody(req);
      const updated = normalizeShopPayload(body, shop, session.user);
      applyShopSecrets(updated, body);
      const error = validateShopPayload(updated);
      if (error) return sendJson(res, 400, { error });
      Object.assign(shop, updated);
      const binding = db.storeBindings.find((item) => item.shop_id === shop.id && !item.deleted_at);
      if (binding) {
        binding.platform = shop.platform;
        binding.auth_type = shop.auth_type;
        binding.updated_at = nowIso();
      }
      addLog(session.user, "update_shop", shop.id, `修改店铺 ${shop.shop_name}`);
      await saveDb();
      return sendJson(res, 200, { shop: sanitizeShop(shop) });
    }

    if (shopMatch && req.method === "DELETE" && !shopMatch[2]) {
      const session = requireWritable(req, res);
      if (!session) return;
      const shop = findTenantShop(session.user, shopMatch[1]);
      if (!shop) return sendJson(res, 404, { error: "店铺不存在" });
      const deletedAt = nowIso();
      shop.deleted_at = deletedAt;
      shop.status = "disconnected";
      shop.last_error = "店铺已删除";
      shop.updated_at = deletedAt;
      shop.updated_by = session.user.id;
      const binding = db.storeBindings.find((item) => item.shop_id === shop.id && !item.deleted_at);
      if (binding) {
        binding.deleted_at = deletedAt;
        binding.updated_at = deletedAt;
        binding.updated_by = session.user.id;
      }
      addLog(session.user, "delete_shop", shop.id, `删除店铺 ${shop.shop_name}`);
      await saveDb();
      return sendJson(res, 200, { ok: true });
    }

    if (shopMatch && req.method === "POST" && shopMatch[2] === "test-connection") {
      const session = requireWritable(req, res);
      if (!session) return;
      const shop = findTenantShop(session.user, shopMatch[1]);
      if (!shop) return sendJson(res, 404, { error: "店铺不存在" });
      try {
        const result = await getMarketplaceAdapter(shop.platform).testConnection(shop);
        shop.status = "connected";
        shop.last_error = "";
        shop.updated_at = nowIso();
        shop.updated_by = session.user.id;
        addLog(session.user, "test_shop_connection", shop.id, `测试店铺连接成功 ${shop.shop_name}`);
        await saveDb();
        return sendJson(res, 200, { shop: sanitizeShop(shop), result });
      } catch (error) {
        shop.status = "failed";
        shop.last_error = error.message || "连接失败";
        shop.updated_at = nowIso();
        shop.updated_by = session.user.id;
        addLog(session.user, "test_shop_connection_failed", shop.id, `测试店铺连接失败 ${shop.shop_name}: ${shop.last_error}`);
        await saveDb();
        return sendJson(res, 400, { error: shop.last_error, shop: sanitizeShop(shop) });
      }
    }

    if (shopMatch && req.method === "POST" && shopMatch[2] === "refresh-token") {
      const session = requireWritable(req, res);
      if (!session) return;
      const shop = findTenantShop(session.user, shopMatch[1]);
      if (!shop) return sendJson(res, 404, { error: "店铺不存在" });
      try {
        const result = await getMarketplaceAdapter(shop.platform).refreshToken(shop);
        shop.status = "connected";
        shop.last_error = "";
        shop.updated_at = nowIso();
        shop.updated_by = session.user.id;
        addLog(session.user, "refresh_shop_token", shop.id, `刷新店铺 token ${shop.shop_name}`);
        await saveDb();
        return sendJson(res, 200, { shop: sanitizeShop(shop), result });
      } catch (error) {
        shop.status = "failed";
        shop.last_error = error.message || "刷新 token 失败";
        shop.updated_at = nowIso();
        shop.updated_by = session.user.id;
        addLog(session.user, "refresh_shop_token_failed", shop.id, `刷新店铺 token 失败 ${shop.shop_name}: ${shop.last_error}`);
        await saveDb();
        return sendJson(res, 400, { error: shop.last_error, shop: sanitizeShop(shop) });
      }
    }

    if (pathname === "/api/collect/1688" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const collected = await collect1688Product(body.url);
      return sendJson(res, 200, { product: collected });
    }

    const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch && req.method === "PUT") {
      const session = requireWritable(req, res);
      if (!session) return;
      const product = db.products.find((item) => item.id === productMatch[1]);
      if (!product) return sendJson(res, 404, { error: "商品不存在" });
      const updated = await buildProduct(await readBody(req), session.user, product);
      const error = validateProduct(updated);
      if (error) return sendJson(res, 400, { error });
      Object.assign(product, updated);
      addLog(session.user, "update_product", product.id, `修改商品 ${product.declarationName}`);
      await saveDb();
      return sendJson(res, 200, { product });
    }

    if (productMatch && req.method === "DELETE") {
      const session = requireWritable(req, res);
      if (!session) return;
      const index = db.products.findIndex((item) => item.id === productMatch[1]);
      if (index === -1) return sendJson(res, 404, { error: "商品不存在" });
      const [product] = db.products.splice(index, 1);
      addLog(session.user, "delete_product", product.id, `删除商品 ${product.declarationName}`);
      await saveDb();
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === "/api/hs-codes/lookup" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const url = new URL(req.url, `http://${req.headers.host}`);
      const result = await lookupHsCodeWithOnline(url.searchParams.get("name") || "");
      if (result.code !== "待确认" && result.code !== "待查询") await saveDb();
      return sendJson(res, 200, result);
    }

    if (pathname === "/api/hs-codes" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      return sendJson(res, 200, { hsCodes: db.hsCodes });
    }

    if (pathname === "/api/logs" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      return sendJson(res, 200, { logs: db.logs.slice(0, 100) });
    }

    sendJson(res, 404, { error: "接口不存在" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "服务器错误" });
  }
}

function safeStaticPath(pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decoded = decodeURIComponent(requestedPath);
  const filePath = path.normalize(path.join(ROOT, decoded));
  return filePath.startsWith(ROOT) ? filePath : null;
}

async function serveStatic(req, res, pathname) {
  const filePath = safeStaticPath(pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

async function handleMercadoLibreCallback(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  try {
    if (error) throw new Error(errorDescription || error);
    if (!code || !state) throw new Error("授权回调缺少 code 或 state");

    const oauthState = db.oauthStates.find((item) => item.state === state && item.platform === "mercadolibre");
    if (!oauthState) throw new Error("授权状态已失效，请重新发起授权");
    if (new Date(oauthState.expires_at).getTime() < Date.now()) throw new Error("授权链接已过期，请重新发起授权");

    const user = db.users.find((item) => item.id === oauthState.user_id) || db.users.find((item) => item.role === "admin");
    if (!user) throw new Error("找不到发起授权的 ERP 用户");

    const tokenData = await exchangeMercadoLibreCode(code, oauthState);
    const profile = await fetchMercadoLibreProfile(tokenData.access_token);
    const shop = upsertMercadoLibreShopFromOAuth(oauthState, tokenData, profile, user);
    db.oauthStates = db.oauthStates.filter((item) => item.state !== state);
    addLog(user, "bind_mercadolibre_shop", shop.id, `绑定 Mercado Libre 店铺 ${shop.shop_name}`);
    await saveDb();

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(oauthResultPage("美客多授权成功", `店铺「${shop.shop_name}」已自动绑定，Seller ID：${shop.seller_id}。`));
  } catch (callbackError) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(oauthResultPage("美客多授权失败", callbackError.message || "授权失败，请回到 ERP 重新生成授权链接。", false));
  }
}

async function main() {
  await loadDb();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/oauth/mercadolibre/callback") return handleMercadoLibreCallback(req, res);
    if (url.pathname.startsWith("/api/")) return handleApi(req, res, url.pathname);
    serveStatic(req, res, url.pathname);
  });
  server.listen(PORT, HOST, () => {
    console.log(`Warehouse ERP is running: http://localhost:${PORT}`);
    console.log(`LAN users can visit: http://THIS_COMPUTER_IP:${PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
