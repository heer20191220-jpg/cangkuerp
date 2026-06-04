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
      { id: "user_admin", username: "admin", displayName: "管理员", role: "admin", passwordHash: sha256("admin123"), createdAt: nowIso() },
      { id: "user_entry", username: "luru", displayName: "录入员", role: "operator", passwordHash: sha256("123456"), createdAt: nowIso() }
    ],
    sessions: [],
    products: [],
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
  db.hsCodes = hasBrokenChinese(db.hsCodes) ? defaultHsCodes() : (db.hsCodes || defaultHsCodes());
  db.users = normalizeUsers(db.users);
  db.sessions = db.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
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
  }
  return result;
}

function saveDb() {
  writeQueue = writeQueue.then(() => fsp.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8"));
  return writeQueue;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
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
  return { id: user.id, username: user.username, displayName: user.displayName, role: user.role };
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

function addLog(user, action, targetId, detail) {
  db.logs.unshift({ id: createId("log"), userId: user.id, username: user.username, action, targetId, detail, createdAt: nowIso() });
  db.logs = db.logs.slice(0, 1000);
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

async function main() {
  await loadDb();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
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
