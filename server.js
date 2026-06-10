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
const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000;
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

function formatDateOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
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
    storeInventory: [],
    storeOrders: [],
    storeOrderItems: [],
    fbpoOrders: [],
    fbpoOrderItems: [],
    shops: [],
    storeBindings: [],
    oauthStates: [],
    syncLogs: [],
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
  db.storeInventory ||= [];
  db.storeOrders ||= [];
  db.storeOrderItems ||= [];
  db.fbpoOrders ||= [];
  db.fbpoOrderItems ||= [];
  db.shops ||= [];
  db.storeBindings ||= [];
  db.oauthStates ||= [];
  db.syncLogs ||= [];
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
      user_id: shop.user_id || shop.userId || "",
      warehouse_code: shop.warehouse_code || shop.warehouseCode || "",
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
    table { border-collapse: collapse; table-layout: fixed; font-family: "Microsoft YaHei", Arial, sans-serif; font-size: 12px; }
    tr { height: 86px; }
    th, td { border: 1px solid #999; padding: 6px; vertical-align: middle; mso-number-format: "\\@"; white-space: normal; }
    th { height: 28px; background: #eaf4f0; font-weight: 700; text-align: center; }
    td.image-cell { width: 88px; height: 86px; padding: 2px; text-align: center; vertical-align: middle; background: #fff; }
    td.image-cell img { width: 78px; height: 78px; object-fit: contain; display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map((row) => `<tr>${row.map((cell) => {
        if (cell && typeof cell === "object" && cell.type === "image") {
          return `<td class="image-cell">${cell.src ? `<img src="${escapeHtml(cell.src)}" alt="">` : ""}</td>`;
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

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cellRef(colIndex, rowIndex) {
  let col = "";
  let index = colIndex + 1;
  while (index > 0) {
    const mod = (index - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    index = Math.floor((index - mod) / 26);
  }
  return `${col}${rowIndex + 1}`;
}

async function sendXlsx(res, filename, headers, rows, imageColumnIndex = -1) {
  const allRows = [headers, ...rows];
  const images = [];
  if (imageColumnIndex >= 0) {
    let imageIndex = 1;
    for (let rowIndex = 1; rowIndex < allRows.length; rowIndex += 1) {
      const cell = allRows[rowIndex][imageColumnIndex];
      if (!cell || typeof cell !== "object" || cell.type !== "image" || !cell.src) continue;
      const image = await loadXlsxImage(cell.src, imageIndex);
      if (!image) continue;
      images.push({ ...image, rowIndex, colIndex: imageColumnIndex, relId: `rId${imageIndex}` });
      imageIndex += 1;
    }
  }
  const sheetXml = buildWorksheetXml(allRows, imageColumnIndex, images.length > 0);
  const contentTypesXml = buildContentTypesXml(images);
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="箱单" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const sheetRelsXml = images.length ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>` : "";
  const drawingXml = images.length ? buildDrawingXml(images) : "";
  const drawingRelsXml = images.length ? buildDrawingRelsXml(images) : "";

  const files = [
    ["[Content_Types].xml", Buffer.from(contentTypesXml)],
    ["_rels/.rels", Buffer.from(rootRelsXml)],
    ["xl/workbook.xml", Buffer.from(workbookXml)],
    ["xl/_rels/workbook.xml.rels", Buffer.from(workbookRelsXml)],
    ["xl/worksheets/sheet1.xml", Buffer.from(sheetXml)]
  ];
  if (images.length) {
    files.push(["xl/worksheets/_rels/sheet1.xml.rels", Buffer.from(sheetRelsXml)]);
    files.push(["xl/drawings/drawing1.xml", Buffer.from(drawingXml)]);
    files.push(["xl/drawings/_rels/drawing1.xml.rels", Buffer.from(drawingRelsXml)]);
    for (const image of images) files.push([`xl/media/${image.fileName}`, image.buffer]);
  }

  res.writeHead(200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    "Cache-Control": "no-store"
  });
  res.end(createZip(files));
}

function buildWorksheetXml(rows, imageColumnIndex, hasDrawing = false) {
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const cols = Array.from({ length: maxCols }, (_, index) => {
    const width = index === imageColumnIndex ? 14 : index <= 8 ? 12 : 18;
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join("");
  const sheetData = rows.map((row, rowIndex) => {
    const height = rowIndex === 0 ? 24 : 70;
    const cells = row.map((cell, colIndex) => buildXlsxCell(cell, colIndex, rowIndex, imageColumnIndex)).join("");
    return `<row r="${rowIndex + 1}" ht="${height}" customHeight="1">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><cols>${cols}</cols><sheetData>${sheetData}</sheetData>${hasDrawing ? '<drawing r:id="rId1"/>' : ""}</worksheet>`;
}

function buildXlsxCell(cell, colIndex, rowIndex, imageColumnIndex) {
  const ref = cellRef(colIndex, rowIndex);
  if (cell && typeof cell === "object" && cell.type === "image") {
    return `<c r="${ref}" t="inlineStr"><is><t></t></is></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`;
}
function buildContentTypesXml(images = []) {
  const hasPng = images.some((image) => image.ext === "png");
  const hasJpeg = images.some((image) => image.ext === "jpeg");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${hasPng ? '<Default Extension="png" ContentType="image/png"/>' : ""}${hasJpeg ? '<Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="jpg" ContentType="image/jpeg"/>' : ""}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>${images.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ""}</Types>`;
}

function buildDrawingXml(images) {
  const anchors = images.map((image, index) => {
    const id = index + 1;
    const fromCol = image.colIndex;
    const fromRow = image.rowIndex;
    return `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${fromCol}</xdr:col><xdr:colOff>45720</xdr:colOff><xdr:row>${fromRow}</xdr:row><xdr:rowOff>45720</xdr:rowOff></xdr:from><xdr:to><xdr:col>${fromCol + 1}</xdr:col><xdr:colOff>-45720</xdr:colOff><xdr:row>${fromRow + 1}</xdr:row><xdr:rowOff>-45720</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${id}" name="ProductImage${id}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${image.relId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors}</xdr:wsDr>`;
}

function buildDrawingRelsXml(images) {
  const rels = images.map((image) => `<Relationship Id="${image.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${image.fileName}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}
async function loadXlsxImage(src, index) {
  let buffer = null;
  let type = "";
  const dataMatch = String(src).match(/^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/i);
  if (dataMatch) {
    type = dataMatch[1].toLowerCase();
    buffer = Buffer.from(dataMatch[2], "base64");
  } else if (/^https?:\/\//i.test(src)) {
    const response = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0 WarehouseERP/1.0" } });
    if (!response.ok) return null;
    type = String(response.headers.get("content-type") || "").toLowerCase();
    buffer = Buffer.from(await response.arrayBuffer());
  }
  if (!buffer) return null;
  const isPng = type.includes("png") || buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = type.includes("jpeg") || type.includes("jpg") || (buffer[0] === 0xff && buffer[1] === 0xd8);
  if (!isPng && !isJpeg) return null;
  const ext = isPng ? "png" : "jpeg";
  return { buffer, ext, fileName: `image${index}.${ext}` };
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameBuffer = Buffer.from(name);
    const fileCrc = crc32(data);
    const local = Buffer.alloc(30 + nameBuffer.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(fileCrc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuffer.copy(local, 30);
    locals.push(local, data);

    const central = Buffer.alloc(46 + nameBuffer.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(fileCrc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuffer.copy(central, 46);
    centrals.push(central);

    offset += local.length + data.length;
  }

  const centralSize = centrals.reduce((sum, item) => sum + item.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, end]);
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
      if (body.length > 50 * 1024 * 1024) {
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
  const manualHsCode = String(input.hsCode || input.hs_code || "").trim();
  const hsResult = manualHsCode
    ? { code: manualHsCode, label: "手动输入" }
    : await lookupHsCodeWithOnline(zhName);
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

function productAssetKey(storeName, productName, zhName) {
  return [storeName, productName || zhName].map((item) => normalizeMatchText(item)).join("|");
}

function findProductForAsset(storeName, productName, zhName) {
  const storeQuery = normalizeMatchText(storeName);
  const query = normalizeMatchText(productName || zhName);
  if (!query) return null;
  const scored = db.products.map((product) => {
    const productStore = normalizeMatchText(product.storeName);
    const names = [product.customName, product.zhName, product.declarationName].map(normalizeMatchText).filter(Boolean);
    let score = 0;
    if (storeQuery && productStore === storeQuery) score += 30;
    else if (storeQuery && productStore.includes(storeQuery)) score += 15;
    for (const name of names) {
      if (name === query) score = Math.max(score, 100 + score);
      else if (name.includes(query) || query.includes(name)) score = Math.max(score, 70 + score);
    }
    return { product, score };
  }).filter((item) => item.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.product || null;
}

function createEmptyAssetBucket(storeName, product, fallbackName) {
  const customName = product?.customName || fallbackName || "";
  const zhName = product?.zhName || fallbackName || "";
  const price = toNumber(product?.price);
  return {
    storeName: storeName || product?.storeName || "未分配店铺",
    productId: product?.id || "",
    productName: customName,
    zhName,
    image: product?.mainImage || "",
    price,
    matched: Boolean(product?.id),
    quantities: { inStock: 0, pending: 0, shipped: 0, overseas: 0 },
    values: { inStock: 0, pending: 0, shipped: 0, overseas: 0 }
  };
}

function addAssetQuantity(bucket, stage, quantity) {
  const qty = toNumber(quantity);
  bucket.quantities[stage] += qty;
  bucket.values[stage] += qty * toNumber(bucket.price);
}

function summarizeAssetBucket(bucket) {
  const totalQuantity = Object.values(bucket.quantities).reduce((sum, value) => sum + toNumber(value), 0);
  const totalValue = Object.values(bucket.values).reduce((sum, value) => sum + toNumber(value), 0);
  return {
    ...bucket,
    quantities: Object.fromEntries(Object.entries(bucket.quantities).map(([key, value]) => [key, round(value, 2)])),
    values: Object.fromEntries(Object.entries(bucket.values).map(([key, value]) => [key, round(value, 2)])),
    totalQuantity: round(totalQuantity, 2),
    totalValue: round(totalValue, 2)
  };
}

function buildStoreAssets(user) {
  const tenantId = getTenantId(user);
  const buckets = new Map();
  const totals = {
    quantities: { inStock: 0, pending: 0, shipped: 0, overseas: 0 },
    values: { inStock: 0, pending: 0, shipped: 0, overseas: 0 }
  };
  const getBucket = (storeName, product, fallbackName) => {
    const key = product?.id ? `${storeName || product.storeName}|${product.id}` : productAssetKey(storeName, fallbackName, fallbackName);
    if (!buckets.has(key)) buckets.set(key, createEmptyAssetBucket(storeName, product, fallbackName));
    return buckets.get(key);
  };

  for (const item of db.storeInventory.filter((row) => (row.tenantId || DEFAULT_TENANT_ID) === tenantId)) {
    const product = item.productId ? db.products.find((entry) => entry.id === item.productId) : findProductForAsset(item.storeName, item.productName, item.zhName);
    const bucket = getBucket(item.storeName, product, item.productName || item.zhName);
    addAssetQuantity(bucket, "inStock", item.quantity);
  }

  for (const shipment of db.domesticShipments.filter((item) => item.tenantId === tenantId && !item.deletedAt)) {
    const status = shipment.status === "draft" ? "pending" : shipment.status;
    const stage = status === "pending" ? "pending" : status === "shipped" ? "shipped" : status === "overseas_arrived" ? "overseas" : "";
    if (!stage) continue;
    for (const line of shipment.lines || []) {
      if (!line.productNameZh) continue;
      const product = line.productId ? db.products.find((entry) => entry.id === line.productId) : findProductForAsset(shipment.storeName, line.productNameZh, line.zhName);
      const storeName = shipment.storeName || product?.storeName || "未分配店铺";
      const bucket = getBucket(storeName, product, line.productNameZh);
      addAssetQuantity(bucket, stage, line.quantity);
    }
  }

  const items = [...buckets.values()].map(summarizeAssetBucket).sort((a, b) => a.storeName.localeCompare(b.storeName, "zh-CN") || a.productName.localeCompare(b.productName, "zh-CN"));
  for (const item of items) {
    for (const stage of Object.keys(totals.quantities)) {
      totals.quantities[stage] += item.quantities[stage];
      totals.values[stage] += item.values[stage];
    }
  }
  const groupedItems = new Map();
  for (const item of items) {
    if (!groupedItems.has(item.storeName)) groupedItems.set(item.storeName, []);
    groupedItems.get(item.storeName).push(item);
  }
  const storeGroups = [];
  for (const [storeName, groupItems] of groupedItems) {
    const summary = {
      storeName,
      quantities: { inStock: 0, pending: 0, shipped: 0, overseas: 0 },
      values: { inStock: 0, pending: 0, shipped: 0, overseas: 0 }
    };
    for (const item of groupItems) {
      for (const stage of Object.keys(summary.quantities)) {
        summary.quantities[stage] += item.quantities[stage];
        summary.values[stage] += item.values[stage];
      }
    }
    summary.totalQuantity = round(Object.values(summary.quantities).reduce((sum, value) => sum + value, 0), 2);
    summary.totalValue = round(Object.values(summary.values).reduce((sum, value) => sum + value, 0), 2);
    storeGroups.push({
      ...summary,
      quantities: Object.fromEntries(Object.entries(summary.quantities).map(([key, value]) => [key, round(value, 2)])),
      values: Object.fromEntries(Object.entries(summary.values).map(([key, value]) => [key, round(value, 2)])),
      items: groupItems
    });
  }
  totals.totalQuantity = round(Object.values(totals.quantities).reduce((sum, value) => sum + value, 0), 2);
  totals.totalValue = round(Object.values(totals.values).reduce((sum, value) => sum + value, 0), 2);
  return {
    summary: {
      quantities: Object.fromEntries(Object.entries(totals.quantities).map(([key, value]) => [key, round(value, 2)])),
      values: Object.fromEntries(Object.entries(totals.values).map(([key, value]) => [key, round(value, 2)])),
      totalQuantity: totals.totalQuantity,
      totalValue: totals.totalValue
    },
    stores: storeGroups
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
  const allowedShipmentStatuses = new Set(["pending", "shipped", "overseas_arrived", "warehouse_delivered", "cancelled"]);
  const allowedInspectionStatuses = new Set(["none", "inspection", "passed"]);
  const rawStatus = input.status === "draft" ? "pending" : String(input.status || existingShipment?.status || "pending").trim();
  const inspectionStatus = String(input.inspectionStatus || input.inspection_status || existingShipment?.inspectionStatus || "none").trim();
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
    status: allowedShipmentStatuses.has(rawStatus) ? rawStatus : "pending",
    inspectionStatus: allowedInspectionStatuses.has(inspectionStatus) ? inspectionStatus : "none",
    outboundWarehouse: String(input.outboundWarehouse || input.outbound_warehouse || existingShipment?.outboundWarehouse || "").trim(),
    inboundWarehouse: String(input.inboundWarehouse || input.inbound_warehouse || existingShipment?.inboundWarehouse || "").trim(),
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
    user_id: shop.user_id || "",
    warehouse_code: shop.warehouse_code || "",
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
    user_id: String(body.user_id || body.userId || existingShop?.user_id || "").trim(),
    warehouse_code: String(body.warehouse_code || body.warehouseCode || existingShop?.warehouse_code || "").trim(),
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

function parseNoonCredential(body) {
  const source = body.credential_json || body.credentialJson || body.noon_credential_json || body.noonCredentialJson;
  if (!source) return null;
  const credential = typeof source === "string" ? JSON.parse(source) : source;
  const keyId = String(credential.key_id || credential.keyId || "").trim();
  const privateKey = String(credential.private_key || credential.privateKey || "").trim();
  if (!keyId || !privateKey) throw new Error("noon JSON 凭证缺少 key_id 或 private_key");
  if (!privateKey.includes("PRIVATE KEY")) throw new Error("noon private_key 格式不正确");
  return { keyId, privateKey };
}

function applyShopSecrets(shop, body) {
  const noonCredential = normalizePlatformType(shop.platform) === "noon" ? parseNoonCredential(body) : null;
  const apiKey = String(noonCredential?.keyId || body.api_key || body.apiKey || "").trim();
  const apiSecret = String(noonCredential?.privateKey || body.api_secret || body.apiSecret || "").trim();
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

function toMoney(value) {
  const number = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

function pickFirstValue(source, keys) {
  for (const key of keys) {
    const parts = key.split(".");
    let value = source;
    for (const part of parts) value = value && typeof value === "object" ? value[part] : undefined;
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function safeJsonSize(value, max = 12000) {
  const text = JSON.stringify(value || {});
  return text.length > max ? { truncated: true, text: text.slice(0, max) } : value;
}

function publicStoreOrder(order) {
  return {
    id: order.id,
    tenantId: order.tenantId,
    shopId: order.shopId,
    shopName: order.shopName,
    platform: order.platform,
    orderNo: order.orderNo || order.platform_order_no || "",
    orderTime: order.orderTime || "",
    status: order.status || "",
    currency: order.currency || "",
    salesAmount: toMoney(order.salesAmount),
    commissionFee: toMoney(order.commissionFee),
    logisticsFee: toMoney(order.logisticsFee),
    netAmount: toMoney(order.netAmount),
    syncedAt: order.syncedAt || "",
    updatedAt: order.updatedAt || ""
  };
}

function summarizeStoreOrders(orders) {
  return orders.reduce((summary, order) => {
    summary.count += 1;
    summary.salesAmount += toMoney(order.salesAmount);
    summary.commissionFee += toMoney(order.commissionFee);
    summary.logisticsFee += toMoney(order.logisticsFee);
    summary.netAmount += toMoney(order.netAmount);
    return summary;
  }, { count: 0, salesAmount: 0, commissionFee: 0, logisticsFee: 0, netAmount: 0 });
}

function normalizeMarketplaceOrder(rawOrder, shop) {
  const orderNo = String(pickFirstValue(rawOrder, [
    "po_nr", "poNr", "orderNo", "order_no", "order_nr", "order_number", "orderNumber", "id", "order.id"
  ])).trim();
  const salesAmount = toMoney(pickFirstValue(rawOrder, [
    "salesAmount", "sales_amount", "total", "total_amount", "grand_total", "order_total", "amount", "payment.total", "financial.salesAmount"
  ]));
  const commissionFee = toMoney(pickFirstValue(rawOrder, [
    "commissionFee", "commission_fee", "platform_commission", "commission", "fees.commission", "financial.commissionFee"
  ]));
  const logisticsFee = toMoney(pickFirstValue(rawOrder, [
    "logisticsFee", "logistics_fee", "shipping_fee", "shippingFee", "delivery_fee", "fees.shipping", "financial.logisticsFee"
  ]));
  const netAmount = toMoney(pickFirstValue(rawOrder, [
    "netAmount", "net_amount", "payout", "settlement_amount", "financial.netAmount"
  ])) || Math.round((salesAmount - commissionFee - logisticsFee + Number.EPSILON) * 100) / 100;
  return {
    tenantId: getShopTenantId(shop),
    shopId: shop.id,
    shopName: shop.shop_name,
    platform: shop.platform,
    orderNo,
    remoteId: orderNo || String(pickFirstValue(rawOrder, ["id", "uid"])).trim(),
    orderTime: String(pickFirstValue(rawOrder, ["orderTime", "order_time", "created_at", "createdAt", "date_created", "placed_at", "po_date"]) || "").trim(),
    status: String(pickFirstValue(rawOrder, ["status", "order_status", "state"]) || "").trim(),
    currency: String(pickFirstValue(rawOrder, ["currency", "currency_code", "payment.currency"]) || "").trim(),
    salesAmount,
    commissionFee,
    logisticsFee,
    netAmount,
    raw: safeJsonSize(rawOrder),
    syncedAt: nowIso(),
    updatedAt: nowIso()
  };
}

function upsertStoreOrders(rawOrders, shop) {
  let count = 0;
  for (const rawOrder of rawOrders) {
    const normalized = normalizeMarketplaceOrder(rawOrder, shop);
    if (!normalized.orderNo && !normalized.remoteId) continue;
    const existing = db.storeOrders.find((order) =>
      order.tenantId === normalized.tenantId &&
      order.platform === normalized.platform &&
      order.shopId === normalized.shopId &&
      (order.orderNo === normalized.orderNo || order.remoteId === normalized.remoteId)
    );
    if (existing) {
      Object.assign(existing, normalized, { id: existing.id, createdAt: existing.createdAt || nowIso() });
    } else {
      db.storeOrders.unshift({ id: createId("order"), createdAt: nowIso(), ...normalized });
    }
    count += 1;
  }
  return count;
}

function getOrderLines(rawOrder) {
  const lines = rawOrder.order_lines || rawOrder.orderLines || rawOrder.lines || rawOrder.items || rawOrder.order_items || [];
  return Array.isArray(lines) ? lines : [];
}

function normalizeNoonFbpiOrder(rawOrder, shop) {
  const platformOrderNo = String(pickFirstValue(rawOrder, [
    "mp_order_nr", "mpOrderNr", "order_nr", "orderNo", "order_no", "orderNumber", "id"
  ])).trim();
  const salesAmount = toMoney(pickFirstValue(rawOrder, [
    "salesAmount", "sales_amount", "total", "total_amount", "order_total", "grand_total", "amount", "payment.total"
  ]));
  const commissionFee = toMoney(pickFirstValue(rawOrder, [
    "commissionFee", "commission_fee", "platform_commission", "commission", "fees.commission"
  ]));
  const logisticsFee = toMoney(pickFirstValue(rawOrder, [
    "logisticsFee", "logistics_fee", "shipping_fee", "shippingFee", "delivery_fee", "fees.shipping"
  ]));
  const netAmount = toMoney(pickFirstValue(rawOrder, [
    "netAmount", "net_amount", "payout", "settlement_amount"
  ])) || round(salesAmount - commissionFee - logisticsFee, 2);
  return {
    tenantId: getShopTenantId(shop),
    shopId: shop.id,
    shopName: shop.shop_name,
    platform: "Noon",
    platform_order_no: platformOrderNo,
    orderNo: platformOrderNo,
    remoteId: platformOrderNo,
    orderTime: String(pickFirstValue(rawOrder, ["created_at", "createdAt", "order_date", "orderDate", "orderTime", "created"]) || "").trim(),
    status: String(pickFirstValue(rawOrder, ["status", "order_status", "state"]) || "").trim(),
    currency: String(pickFirstValue(rawOrder, ["currency", "currency_code", "payment.currency"]) || "").trim(),
    warehouseCode: shop.warehouse_code || "",
    salesAmount,
    commissionFee,
    logisticsFee,
    netAmount,
    raw_json: rawOrder,
    raw: safeJsonSize(rawOrder),
    syncedAt: nowIso(),
    updatedAt: nowIso()
  };
}

function normalizeNoonFbpiOrderItem(line, order) {
  const partnerSku = String(pickFirstValue(line, ["partner_sku", "partnerSku", "sku", "seller_sku", "sellerSku"]) || "").trim();
  const matchedProduct = findProductByPartnerSku(partnerSku, order.tenantId);
  return {
    tenantId: order.tenantId,
    shopId: order.shopId,
    platform: order.platform,
    platform_order_no: order.platform_order_no,
    orderNo: order.platform_order_no,
    partnerSku,
    qty: toMoney(pickFirstValue(line, ["qty", "quantity", "ordered_qty", "orderedQty"])),
    unitPrice: toMoney(pickFirstValue(line, ["unit_price", "unitPrice", "price", "unit_cost", "unitCost"])),
    productId: matchedProduct?.id || "",
    productName: matchedProduct?.customName || matchedProduct?.declarationName || "",
    matchStatus: matchedProduct ? "matched" : "pending_match",
    raw_json: line,
    raw: safeJsonSize(line),
    syncedAt: order.syncedAt,
    updatedAt: order.updatedAt
  };
}

function upsertNoonFbpiOrders(rawOrders, shop) {
  let count = 0;
  for (const rawOrder of rawOrders) {
    const order = normalizeNoonFbpiOrder(rawOrder, shop);
    if (!order.platform_order_no) continue;
    const existing = db.storeOrders.find((item) =>
      item.tenantId === order.tenantId &&
      item.platform === "Noon" &&
      item.platform_order_no === order.platform_order_no
    );
    if (existing) Object.assign(existing, order, { id: existing.id, createdAt: existing.createdAt || nowIso() });
    else db.storeOrders.unshift({ id: createId("order"), createdAt: nowIso(), ...order });

    const items = getOrderLines(rawOrder).map((line) => normalizeNoonFbpiOrderItem(line, order)).filter((item) => item.partnerSku);
    db.storeOrderItems = db.storeOrderItems.filter((item) => !(item.tenantId === order.tenantId && item.platform === "Noon" && item.platform_order_no === order.platform_order_no));
    db.storeOrderItems.unshift(...items.map((item) => ({ id: createId("order_item"), createdAt: nowIso(), ...item })));
    count += 1;
  }
  return count;
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_\-（）()\/\\]+/g, "");
}

function pickRowValue(row, headerMap, aliases) {
  for (const alias of aliases) {
    const index = headerMap.get(normalizeHeader(alias));
    if (index !== undefined) return row[index];
  }
  return "";
}

function rowsToObjects(rows) {
  const headerRowIndex = rows.findIndex((row) => row.some((cell) => String(cell || "").trim()));
  if (headerRowIndex < 0) return [];
  const headers = rows[headerRowIndex].map((cell) => String(cell || "").trim());
  const headerMap = new Map(headers.map((header, index) => [normalizeHeader(header), index]));
  return rows.slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => ({ row, headerMap }));
}

function normalizeFbnReportOrder(source, shop, user) {
  const { row, headerMap } = source;
  const orderNo = String(pickRowValue(row, headerMap, [
    "order_nr", "order no", "order number", "mp_order_nr", "订单号", "订单编号"
  ]) || "").trim();
  const partnerSku = String(pickRowValue(row, headerMap, [
    "partner_sku", "seller sku", "sku", "商家sku", "商品sku", "sku编码"
  ]) || "").trim();
  const matchedProduct = findProductByPartnerSku(partnerSku, getTenantId(user));
  const salesAmount = toMoney(pickRowValue(row, headerMap, [
    "sales", "sale amount", "sales amount", "item price", "gross sales", "销售额", "销售收入", "商品金额"
  ]));
  const commissionFee = toMoney(pickRowValue(row, headerMap, [
    "commission", "platform commission", "commission fee", "平台佣金", "佣金"
  ]));
  const logisticsFee = toMoney(pickRowValue(row, headerMap, [
    "shipping fee", "logistics fee", "delivery fee", "物流费", "运费", "配送费"
  ]));
  const netAmount = toMoney(pickRowValue(row, headerMap, [
    "net amount", "payout", "settlement amount", "净收入", "结算金额", "应收金额"
  ])) || round(salesAmount - commissionFee - logisticsFee, 2);
  const quantity = toMoney(pickRowValue(row, headerMap, ["qty", "quantity", "数量", "件数"])) || 1;
  const currency = String(pickRowValue(row, headerMap, ["currency", "currency code", "币种"]) || "").trim();
  const status = String(pickRowValue(row, headerMap, ["status", "order status", "状态", "订单状态"]) || "").trim();
  const orderTime = String(pickRowValue(row, headerMap, ["created_at", "order date", "date", "订单时间", "下单时间", "日期"]) || "").trim();
  return {
    order: {
      tenantId: getTenantId(user),
      shopId: shop?.id || "",
      shopName: shop?.shop_name || "noon FBN",
      platform: "Noon",
      platform_order_no: orderNo,
      orderNo,
      remoteId: orderNo,
      orderTime,
      status,
      currency,
      salesAmount,
      commissionFee,
      logisticsFee,
      netAmount,
      source: "fbn_report",
      raw_json: Object.fromEntries([...headerMap.entries()].map(([key, index]) => [key, row[index]])),
      syncedAt: nowIso(),
      updatedAt: nowIso()
    },
    item: {
      tenantId: getTenantId(user),
      shopId: shop?.id || "",
      platform: "Noon",
      platform_order_no: orderNo,
      orderNo,
      partnerSku,
      qty: quantity,
      unitPrice: quantity ? round(salesAmount / quantity, 2) : salesAmount,
      productId: matchedProduct?.id || "",
      productName: matchedProduct?.customName || matchedProduct?.declarationName || "",
      matchStatus: matchedProduct ? "matched" : "pending_match",
      source: "fbn_report",
      raw_json: Object.fromEntries([...headerMap.entries()].map(([key, index]) => [key, row[index]])),
      syncedAt: nowIso(),
      updatedAt: nowIso()
    }
  };
}

function importFbnReportRows(rows, user) {
  const tenantId = getTenantId(user);
  const shop = db.shops.find((item) => getShopTenantId(item) === tenantId && normalizePlatformType(item.platform) === "noon" && !item.deleted_at);
  const sources = rowsToObjects(rows);
  let count = 0;
  let itemCount = 0;
  const touchedOrders = new Set();
  for (const source of sources) {
    const { order, item } = normalizeFbnReportOrder(source, shop, user);
    if (!order.platform_order_no) continue;
    if (!touchedOrders.has(order.platform_order_no)) {
      db.storeOrderItems = db.storeOrderItems.filter((entry) => !(entry.tenantId === tenantId && entry.platform === "Noon" && entry.platform_order_no === order.platform_order_no && entry.source === "fbn_report"));
      touchedOrders.add(order.platform_order_no);
    }
    const existing = db.storeOrders.find((entry) => entry.tenantId === tenantId && entry.platform === "Noon" && entry.platform_order_no === order.platform_order_no);
    if (existing) {
      const firstLineInImport = touchedOrders.has(`${order.platform_order_no}:reset`) ? false : true;
      if (firstLineInImport) {
        Object.assign(existing, { ...order, id: existing.id, createdAt: existing.createdAt || nowIso(), salesAmount: 0, commissionFee: 0, logisticsFee: 0, netAmount: 0 });
        touchedOrders.add(`${order.platform_order_no}:reset`);
      }
      existing.salesAmount = round(toMoney(existing.salesAmount) + toMoney(order.salesAmount), 2);
      existing.commissionFee = round(toMoney(existing.commissionFee) + toMoney(order.commissionFee), 2);
      existing.logisticsFee = round(toMoney(existing.logisticsFee) + toMoney(order.logisticsFee), 2);
      existing.netAmount = round(toMoney(existing.netAmount) + toMoney(order.netAmount), 2);
    } else {
      db.storeOrders.unshift({ id: createId("order"), createdAt: nowIso(), ...order });
      touchedOrders.add(`${order.platform_order_no}:reset`);
      count += 1;
    }
    if (item.partnerSku) {
      db.storeOrderItems.unshift({ id: createId("order_item"), createdAt: nowIso(), ...item });
      itemCount += 1;
    }
  }
  return { count, itemCount, rowCount: sources.length };
}

function normalizeSku(value) {
  return String(value || "").trim().replace(/\s+/g, "").toLowerCase();
}

function findProductByPartnerSku(partnerSku, tenantId = DEFAULT_TENANT_ID) {
  const sku = normalizeSku(partnerSku);
  if (!sku) return null;
  return db.products.find((product) => {
    if (product.tenantId && product.tenantId !== tenantId) return false;
    return [product.sku, product.partnerSku, product.customName, product.declarationName]
      .some((value) => normalizeSku(value) === sku);
  }) || null;
}

function unwrapNoonPoPayload(raw) {
  if (!raw || typeof raw !== "object") return {};
  return raw.data?.po || raw.data?.purchase_order || raw.po || raw.purchase_order || raw.data || raw;
}

function getNoonPoLines(po) {
  const lines = po.po_lines || po.poLines || po.lines || po.items || po.order_lines || [];
  return Array.isArray(lines) ? lines : [];
}

function normalizeFbpoPo(raw, shop, requestedPoNr = "") {
  const po = unwrapNoonPoPayload(raw);
  const poNr = String(po.po_nr || po.poNr || requestedPoNr || "").trim();
  return {
    tenantId: getShopTenantId(shop),
    shopId: shop.id,
    shopName: shop.shop_name,
    poNr,
    merchantCode: String(po.merchant_code || po.merchantCode || "").trim(),
    warehouseCode: String(po.warehouse_code || po.warehouseCode || "").trim(),
    currency: String(po.po_currency || po.currency || po.poCurrency || "").trim(),
    status: String(po.po_status || po.status || po.poStatus || "").trim(),
    releaseDate: String(po.po_release_date || po.release_date || po.releaseDate || "").trim(),
    rawJson: raw,
    syncedAt: nowIso(),
    updatedAt: nowIso()
  };
}

function normalizeFbpoPoItem(line, order) {
  const partnerSku = String(line.partner_sku || line.partnerSku || line.sku || "").trim();
  const matchedProduct = findProductByPartnerSku(partnerSku, order.tenantId);
  return {
    tenantId: order.tenantId,
    shopId: order.shopId,
    poNr: order.poNr,
    partnerSku,
    qty: toMoney(line.qty || line.quantity || line.ordered_qty || line.orderedQty),
    unitCost: toMoney(line.unit_cost || line.unitCost || line.cost || line.price),
    productId: matchedProduct?.id || "",
    productName: matchedProduct?.customName || matchedProduct?.declarationName || "",
    matchStatus: matchedProduct ? "matched" : "pending_match",
    rawJson: line,
    syncedAt: order.syncedAt,
    updatedAt: order.updatedAt
  };
}

function addSyncLog(user, payload) {
  db.syncLogs.unshift({
    id: createId("sync_log"),
    tenantId: getTenantId(user),
    module: payload.module || "sync",
    platform: payload.platform || "",
    shopId: payload.shopId || "",
    shopName: payload.shopName || "",
    target: payload.target || "",
    status: payload.status || "success",
    message: payload.message || "",
    detail: payload.detail || null,
    createdAt: nowIso(),
    createdBy: user.id
  });
  db.syncLogs = db.syncLogs.slice(0, 2000);
}

function upsertFbpoPo(raw, shop, requestedPoNr = "") {
  const order = normalizeFbpoPo(raw, shop, requestedPoNr);
  if (!order.poNr) throw new Error("FBPO 返回数据缺少 po_nr");
  const existing = db.fbpoOrders.find((item) => item.tenantId === order.tenantId && item.poNr === order.poNr);
  if (existing) Object.assign(existing, order, { id: existing.id, createdAt: existing.createdAt || nowIso() });
  else db.fbpoOrders.unshift({ id: createId("fbpo"), createdAt: nowIso(), ...order });

  const po = unwrapNoonPoPayload(raw);
  const items = getNoonPoLines(po).map((line) => normalizeFbpoPoItem(line, order)).filter((item) => item.partnerSku);
  db.fbpoOrderItems = db.fbpoOrderItems.filter((item) => !(item.tenantId === order.tenantId && item.poNr === order.poNr));
  db.fbpoOrderItems.unshift(...items.map((item) => ({ id: createId("fbpo_item"), createdAt: nowIso(), ...item })));
  return { order, items };
}

function publicFbpoOrder(order) {
  const items = db.fbpoOrderItems.filter((item) => item.tenantId === order.tenantId && item.poNr === order.poNr);
  return {
    id: order.id,
    poNr: order.poNr,
    merchantCode: order.merchantCode,
    warehouseCode: order.warehouseCode,
    currency: order.currency,
    status: order.status,
    releaseDate: order.releaseDate,
    shopName: order.shopName || "",
    itemCount: items.length,
    pendingMatchCount: items.filter((item) => item.matchStatus !== "matched").length,
    totalQty: items.reduce((sum, item) => sum + toMoney(item.qty), 0),
    totalCost: items.reduce((sum, item) => sum + toMoney(item.qty) * toMoney(item.unitCost), 0),
    syncedAt: order.syncedAt,
    items: items.map((item) => ({
      partnerSku: item.partnerSku,
      qty: item.qty,
      unitCost: item.unitCost,
      productId: item.productId,
      productName: item.productName,
      matchStatus: item.matchStatus
    }))
  };
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createNoonJwt(credentials) {
  const header = { alg: "RS256", typ: "JWT", kid: credentials.apiKey };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: credentials.apiKey, sub: credentials.apiKey, iat: now, exp: now + 300 };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), credentials.apiSecret)
    .toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${signingInput}.${signature}`;
}

function extractOrderArray(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["fbpi_orders", "fbpiOrders", "orders", "items", "data", "results", "list"]) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractOrderArray(value);
      if (nested.length) return nested;
    }
  }
  return [];
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
    if (isCreate && shop.platform === "noon" && !credentials.apiSecret) return "noon 店铺必须上传 JSON 凭证或填写 private_key";
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
  async fetchOrders(shop, options = {}) {
    const credentials = getShopCredentials(shop);
    if (!credentials.accessToken) throw new Error("Missing Mercado Libre access_token");
    const endpoint = process.env.MERCADOLIBRE_ORDERS_URL || "https://api.mercadolibre.com/orders/search";
    const url = new URL(endpoint);
    if (shop.seller_id) url.searchParams.set("seller", shop.seller_id);
    const dateFrom = options.dateFrom || options.date_from || options.created_after || options.createdAfter;
    const dateTo = options.dateTo || options.date_to || options.created_before || options.createdBefore;
    if (dateFrom) url.searchParams.set("order.date_created.from", new Date(dateFrom).toISOString());
    if (dateTo) url.searchParams.set("order.date_created.to", new Date(dateTo).toISOString());
    if (options.limit) url.searchParams.set("limit", String(options.limit));
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${credentials.accessToken}`, "Accept": "application/json" },
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `Mercado Libre orders sync failed ${response.status}`);
    const orders = Array.isArray(data.results) ? data.results : extractOrderArray(data);
    return { orders, message: `Mercado Libre returned ${orders.length} orders`, responseKeys: Object.keys(data || {}).slice(0, 12) };
  }
}

class NoonAdapter extends MarketplaceAdapter {
  async testConnection(shop) {
    const credentials = getShopCredentials(shop);
    if (!credentials.apiKey || !credentials.apiSecret) throw new Error("noon 需要 API Key 和 API Secret");
    if (credentials.apiKey.length < 8 || credentials.apiSecret.length < 8) throw new Error("noon 密钥长度过短");
    if (!credentials.apiSecret.includes("PRIVATE KEY")) throw new Error("noon private_key 格式不正确，请上传 JSON 凭证文件");
    return { ok: true, message: "noon JSON 凭证格式已通过" };
  }

  async fetchOrders(shop, options = {}) {
    const credentials = getShopCredentials(shop);
    if (!credentials.apiKey || !credentials.apiSecret) throw new Error("noon 需要 JSON 凭证中的 key_id 和 private_key");
    const poNumbers = Array.isArray(options.poNumbers) ? options.poNumbers.map((item) => String(item).trim()).filter(Boolean) : [];
    const endpoint = process.env.NOON_PO_GET_URL || process.env.NOON_ORDERS_URL || "https://noon-api-gateway.noon.partners/fbpo/v1/po/:po_nr/get";
    if (endpoint.includes(":po_nr") && !poNumbers.length) {
      throw new Error("这个 noon 接口是单个 PO 查询接口，请先在订单页输入 noon PO号 后再同步。");
    }

    const headers = {
      "Accept": "application/json",
      "Authorization": `Bearer ${createNoonJwt(credentials)}`,
      "X-API-Key": credentials.apiKey
    };
    const orders = [];
    const targets = endpoint.includes(":po_nr") ? poNumbers : [""];
    for (const poNumber of targets) {
      const url = new URL(endpoint.replace(":po_nr", encodeURIComponent(poNumber)));
      if (!endpoint.includes(":po_nr") && shop.seller_id) url.searchParams.set("seller_id", shop.seller_id);
      if (!endpoint.includes(":po_nr") && options.dateFrom) url.searchParams.set("date_from", options.dateFrom);
      if (!endpoint.includes(":po_nr") && options.dateTo) url.searchParams.set("date_to", options.dateTo);
      const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${createNoonJwt(credentials)}`,
        "X-API-Key": credentials.apiKey
      },
      signal: AbortSignal.timeout(20000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || `noon PO ${poNumber || ""} 同步失败 ${response.status}`);
      const extracted = extractOrderArray(data);
      if (extracted.length) orders.push(...extracted);
      else orders.push({ ...data, po_nr: poNumber || data.po_nr || data.poNr });
    }
    return { orders, message: `noon 返回 ${orders.length} 单` };
  }

  async fetchFbpoPo(shop, poNumber) {
    const credentials = getShopCredentials(shop);
    if (!credentials.apiKey || !credentials.apiSecret) throw new Error("noon 需要 JSON 凭证中的 key_id 和 private_key");
    const cleanPo = String(poNumber || "").trim();
    if (!cleanPo) throw new Error("缺少 noon PO号");
    const endpoint = process.env.NOON_FBPO_GET_PO_URL || "https://noon-api-gateway.noon.partners/fbpo/v1/po/:po_nr/get";
    const url = new URL(endpoint.replace(":po_nr", encodeURIComponent(cleanPo)));
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${createNoonJwt(credentials)}`,
        "X-API-Key": credentials.apiKey
      },
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `noon FBPO ${cleanPo} 同步失败 ${response.status}`);
    return data;
  }

  async fetchFbpiOrders(shop, options = {}) {
    const credentials = getShopCredentials(shop);
    if (!credentials.apiKey || !credentials.apiSecret) throw new Error("noon 需要 JSON 凭证中的 key_id 和 private_key");
    const warehouseCode = String(options.warehouse_code || options.warehouseCode || shop.warehouse_code || "").trim();
    const createdAfter = String(options.created_after || options.createdAfter || "").trim();
    const createdBefore = String(options.created_before || options.createdBefore || "").trim();
    if (!createdAfter || !createdBefore) throw new Error("同步订单需要 created_after 和 created_before");
    const endpoints = process.env.NOON_FBPI_ORDERS_LIST_URL
      ? [process.env.NOON_FBPI_ORDERS_LIST_URL]
      : [
          "https://noon-api-gateway.noon.partners/v1/fbpi-orders/list",
          "https://noon-api-gateway.noon.partners/fbpi/v1/fbpi-orders/list"
        ];
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${createNoonJwt(credentials)}`,
      "X-API-Key": credentials.apiKey
    };
    const orders = [];
    const responseKeys = [];
    let nextToken = options.next_token || options.nextToken || "";
    let page = 0;
    do {
      page += 1;
      const body = {
        created_after: createdAfter,
        created_before: createdBefore
      };
      if (warehouseCode) body.warehouse_code = warehouseCode;
      let response = null;
      let data = null;
      let lastError = "";
      for (const endpoint of endpoints) {
        const url = new URL(endpoint);
        if (nextToken) url.searchParams.set("next_token", nextToken);
        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25000)
        });
        data = await response.json().catch(() => ({}));
        if (response.ok) break;
        lastError = data.message || data.error || `noon FBPI 订单同步失败 ${response.status}`;
        if (response.status !== 404) break;
      }
      if (!response.ok) throw new Error(lastError);
      if (data && typeof data === "object" && !Array.isArray(data)) responseKeys.push(Object.keys(data).slice(0, 12));
      orders.push(...extractOrderArray(data));
      nextToken = String(data.next_token || data.nextToken || data.data?.next_token || data.meta?.next_token || "").trim();
      if (page > 100) throw new Error("noon FBPI 分页超过 100 页，已停止以避免无限循环");
    } while (nextToken);
    return { orders, message: `noon FBPI 返回 ${orders.length} 单`, responseKeys };
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

function shouldRefreshShopToken(shop) {
  if (normalizePlatformType(shop.platform) !== "mercadolibre" || shop.auth_type !== "oauth") return false;
  const credentials = getShopCredentials(shop);
  if (!credentials.refreshToken) return false;
  if (!credentials.accessToken) return true;
  const expiresAt = new Date(shop.token_expires_at || 0).getTime();
  return !expiresAt || expiresAt - Date.now() <= TOKEN_REFRESH_WINDOW_MS;
}

async function ensureFreshShopToken(shop, adapter = getMarketplaceAdapter(shop.platform)) {
  if (!shouldRefreshShopToken(shop)) return { refreshed: false };
  const result = await adapter.refreshToken(shop);
  shop.status = "connected";
  shop.last_error = "";
  shop.updated_at = nowIso();
  return { refreshed: true, result };
}

function getRequestOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${req.headers.host}`;
}

function mercadoLibreRedirectUri(req) {
  return `${getRequestOrigin(req)}/api/mercadolibre/callback`;
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

  const url = new URL("https://global-selling.mercadolibre.com/authorization");
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
      user_id: "",
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
  shop.user_id = String(tokenData.user_id || profile.id || sellerId || "").trim();
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

    if (pathname === "/api/store-assets" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      return sendJson(res, 200, buildStoreAssets(session.user));
    }

    if (pathname === "/api/store-assets/in-stock" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const rows = Array.isArray(body.items) ? body.items : [];
      if (!rows.length) return sendJson(res, 400, { error: "没有可导入的在售库存" });
      if (rows.length > 1000) return sendJson(res, 400, { error: "单次最多导入 1000 条在售库存" });
      const tenantId = getTenantId(session.user);
      const imported = rows
        .map((row, index) => {
          const storeName = String(row.storeName || row.store_name || "").trim();
          const productName = String(row.productName || row.product_name || row.customName || "").trim();
          const zhName = String(row.zhName || row.zh_name || row.productNameZh || "").trim();
          const quantity = toNumber(row.quantity || row.inStock || row.stock);
          const product = findProductForAsset(storeName, productName, zhName);
          return {
            id: createId("stock"),
            tenantId,
            storeName: storeName || product?.storeName || "未分配店铺",
            productName: productName || product?.customName || zhName,
            zhName: zhName || product?.zhName || productName,
            productId: product?.id || "",
            quantity,
            source: "xlsx",
            rowNo: index + 2,
            updatedAt: nowIso(),
            updatedBy: session.user.id
          };
        })
        .filter((row) => (row.productName || row.zhName) && row.quantity > 0);
      if (!imported.length) return sendJson(res, 400, { error: "没有有效的在售库存行" });
      db.storeInventory = db.storeInventory.filter((row) => row.tenantId !== tenantId || row.source !== "xlsx");
      db.storeInventory.unshift(...imported);
      addLog(session.user, "import_store_inventory", "store_assets", `导入在售库存 ${imported.length} 条`);
      await saveDb();
      return sendJson(res, 201, { count: imported.length, assets: buildStoreAssets(session.user) });
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
          shipper: shipment.shipper || "",
          status: shipment.status || "pending",
          inspectionStatus: shipment.inspectionStatus || "none",
          outboundWarehouse: shipment.outboundWarehouse || "",
          inboundWarehouse: shipment.inboundWarehouse || "",
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
        "箱号", "行类型", "箱长cm", "箱宽cm", "箱高cm", "箱实重kg", "箱CBM", "箱体积重kg", "箱计费重kg",
        "箱内产品中文名", "数量", "产品图片", "产品名", "中文品名", "英文品名", "中文材质", "英文材质", "采购价RMB", "重量kg", "海关编码"
      ];
      const exportLines = shipment.lines.filter((line) => line.productNameZh);
      const exportedBoxes = new Set();
      const rows = exportLines.map((line) => {
        const storedProduct = line.productId ? db.products.find((product) => product.id === line.productId) : null;
        const product = publicProductMatch(storedProduct) || line.matchedProduct || {};
        const boxKey = String(line.boxNo || "").trim();
        const showBoxInfo = !boxKey || !exportedBoxes.has(boxKey);
        if (boxKey) exportedBoxes.add(boxKey);
        return [
          line.boxNo,
          line.lineType === "product" ? "产品" : "箱",
          showBoxInfo ? line.length : "",
          showBoxInfo ? line.width : "",
          showBoxInfo ? line.height : "",
          showBoxInfo ? line.actualWeight : "",
          showBoxInfo ? line.volumeCbm : "",
          showBoxInfo ? line.volumeWeight : "",
          showBoxInfo ? line.chargeWeight : "",
          line.productNameZh,
          line.quantity || "",
          { type: "image", src: product.mainImage || "" },
          product.customName || "",
          product.zhName || line.zhName || "",
          product.enName || line.enName || "",
          product.materialZh || line.materialZh || "",
          product.materialEn || line.materialEn || "",
          product.price || "",
          product.weight || "",
          product.hsCode || line.hsCode || ""
        ];
      });
      rows.push([
        "合计", "", "", "", "", shipment.totalActualWeight, shipment.totalCbm, shipment.totalVolumeWeight, shipment.totalChargeWeight,
        "", "", "", "", "", "", "", "", "", "", ""
      ]);
      return sendXlsx(res, `国内发货箱单_${shipment.shipmentNo}.xlsx`, headers, rows, 11);
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

    if (pathname === "/api/store-orders" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const tenantId = getTenantId(session.user);
      const platform = normalizePlatformType(url.searchParams.get("platform") || "");
      const shopQuery = String(url.searchParams.get("shop") || "").trim().toLowerCase();
      const keyword = String(url.searchParams.get("keyword") || "").trim().toLowerCase();
      const status = String(url.searchParams.get("status") || "").trim().toLowerCase();
      const orders = db.storeOrders
        .filter((order) => order.tenantId === tenantId)
        .filter((order) => !platform || normalizePlatformType(order.platform) === platform)
        .filter((order) => !shopQuery || String(order.shopName || "").toLowerCase().includes(shopQuery))
        .filter((order) => !keyword || String(order.orderNo || order.remoteId || "").toLowerCase().includes(keyword))
        .filter((order) => !status || String(order.status || "").toLowerCase().includes(status))
        .sort((a, b) => new Date(b.orderTime || b.syncedAt || 0) - new Date(a.orderTime || a.syncedAt || 0));
      return sendJson(res, 200, { orders: orders.map(publicStoreOrder), summary: summarizeStoreOrders(orders) });
    }

    if (pathname === "/api/store-orders/sync" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const requestedPlatform = normalizePlatformType(body.platform || "");
      const tenantId = getTenantId(session.user);
      const shops = db.shops
        .filter((shop) => getShopTenantId(shop) === tenantId && !shop.deleted_at)
        .filter((shop) => !requestedPlatform || shop.platform === requestedPlatform)
        .sort((a, b) => (a.platform === "noon" ? -1 : 0) - (b.platform === "noon" ? -1 : 0));
      if (!shops.length) return sendJson(res, 400, { error: requestedPlatform ? "没有可同步的该平台店铺" : "没有可同步的店铺" });

      let synced = 0;
      const errors = [];
      for (const shop of shops) {
        try {
          const adapter = getMarketplaceAdapter(shop.platform);
          await ensureFreshShopToken(shop, adapter);
          const result = shop.platform === "noon"
            ? await adapter.fetchFbpiOrders(shop, body)
            : await adapter.fetchOrders(shop, body);
          const count = shop.platform === "noon"
            ? upsertNoonFbpiOrders(result.orders || [], shop)
            : upsertStoreOrders(result.orders || [], shop);
          synced += count;
          shop.status = "connected";
          shop.last_sync_at = nowIso();
          shop.last_error = "";
          shop.updated_at = nowIso();
          shop.updated_by = session.user.id;
          addLog(session.user, "sync_store_orders", shop.id, `同步店铺订单 ${shop.shop_name} ${count} 单`);
          addSyncLog(session.user, {
            module: "store_orders",
            platform: shop.platform,
            shopId: shop.id,
            shopName: shop.shop_name,
            target: body.created_after && body.created_before ? `${body.created_after} ~ ${body.created_before}` : "manual",
            status: "success",
            message: `同步店铺订单成功 ${count} 单${result.message ? `，${result.message}` : ""}`,
            detail: { responseKeys: result.responseKeys || [] }
          });
        } catch (error) {
          shop.status = "failed";
          shop.last_error = error.message || "订单同步失败";
          shop.updated_at = nowIso();
          shop.updated_by = session.user.id;
          errors.push(`${shop.shop_name}: ${shop.last_error}`);
          addLog(session.user, "sync_store_orders_failed", shop.id, `同步店铺订单失败 ${shop.shop_name}: ${shop.last_error}`);
          addSyncLog(session.user, {
            module: "store_orders",
            platform: shop.platform,
            shopId: shop.id,
            shopName: shop.shop_name,
            target: body.created_after && body.created_before ? `${body.created_after} ~ ${body.created_before}` : "manual",
            status: "failed",
            message: shop.last_error
          });
        }
      }
      await saveDb();
      if (!synced && errors.length) return sendJson(res, 400, { error: errors.join("；"), synced, errors });
      return sendJson(res, 200, { synced, errors, message: errors.length ? `部分店铺失败：${errors.join("；")}` : "" });
    }

    if (pathname === "/api/store-orders/import-fbn-report" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return sendJson(res, 400, { error: "没有可导入的 FBN 报表数据" });
      const result = importFbnReportRows(rows, session.user);
      if (!result.count && !result.itemCount) return sendJson(res, 400, { error: "未识别到订单号，请确认报表包含 order_nr / order number / 订单号" });
      addSyncLog(session.user, {
        module: "store_orders",
        platform: "Noon",
        shopName: "FBN Report",
        target: "xlsx",
        status: "success",
        message: `导入 FBN 报表：订单 ${result.count} 单，明细 ${result.itemCount} 条`,
        detail: result
      });
      await saveDb();
      return sendJson(res, 201, result);
    }

    if (pathname === "/api/noon/fbpo/orders" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const tenantId = getTenantId(session.user);
      const keyword = String(url.searchParams.get("keyword") || "").trim().toLowerCase();
      const matchStatus = String(url.searchParams.get("matchStatus") || "").trim();
      let orders = db.fbpoOrders
        .filter((order) => order.tenantId === tenantId)
        .filter((order) => !keyword || [order.poNr, order.merchantCode, order.warehouseCode, order.status].some((value) => String(value || "").toLowerCase().includes(keyword)))
        .sort((a, b) => new Date(b.releaseDate || b.syncedAt || 0) - new Date(a.releaseDate || a.syncedAt || 0))
        .map(publicFbpoOrder);
      if (matchStatus === "pending_match") orders = orders.filter((order) => order.pendingMatchCount > 0);
      if (matchStatus === "matched") orders = orders.filter((order) => order.itemCount > 0 && order.pendingMatchCount === 0);
      return sendJson(res, 200, { orders });
    }

    if (pathname === "/api/noon/fbpo/sync" && req.method === "POST") {
      const session = requireWritable(req, res);
      if (!session) return;
      const body = await readBody(req);
      const poNumbers = Array.isArray(body.poNumbers) ? body.poNumbers.map((item) => String(item).trim()).filter(Boolean) : [];
      if (!poNumbers.length) return sendJson(res, 400, { error: "请先输入需要同步的 noon PO号" });
      const tenantId = getTenantId(session.user);
      const noonShops = db.shops.filter((shop) => getShopTenantId(shop) === tenantId && shop.platform === "noon" && !shop.deleted_at);
      const shop = body.shopId ? noonShops.find((item) => item.id === body.shopId) : noonShops[0];
      if (!shop) return sendJson(res, 400, { error: "请先在店铺管理中新增并授权 noon 店铺" });

      let synced = 0;
      const errors = [];
      const results = [];
      const adapter = getMarketplaceAdapter("noon");
      for (const poNumber of poNumbers) {
        try {
          const raw = await adapter.fetchFbpoPo(shop, poNumber);
          const result = upsertFbpoPo(raw, shop, poNumber);
          synced += 1;
          results.push(publicFbpoOrder(result.order));
          addSyncLog(session.user, {
            module: "noon_fbpo",
            platform: "noon",
            shopId: shop.id,
            shopName: shop.shop_name,
            target: poNumber,
            status: "success",
            message: `同步 FBPO PO ${result.order.poNr} 成功，明细 ${result.items.length} 条`,
            detail: { poNr: result.order.poNr, itemCount: result.items.length, pendingMatchCount: result.items.filter((item) => item.matchStatus !== "matched").length }
          });
        } catch (error) {
          errors.push(`${poNumber}: ${error.message}`);
          addSyncLog(session.user, {
            module: "noon_fbpo",
            platform: "noon",
            shopId: shop.id,
            shopName: shop.shop_name,
            target: poNumber,
            status: "failed",
            message: error.message
          });
        }
      }
      shop.last_sync_at = synced ? nowIso() : shop.last_sync_at;
      shop.last_error = errors[0] || "";
      shop.status = errors.length && !synced ? "failed" : "connected";
      shop.updated_at = nowIso();
      shop.updated_by = session.user.id;
      await saveDb();
      if (!synced && errors.length) return sendJson(res, 400, { error: errors.join("；"), synced, errors });
      return sendJson(res, 200, { synced, errors, orders: results });
    }

    if (pathname === "/api/sync-logs" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const moduleName = String(url.searchParams.get("module") || "").trim();
      const tenantId = getTenantId(session.user);
      const logs = db.syncLogs
        .filter((log) => log.tenantId === tenantId)
        .filter((log) => !moduleName || log.module === moduleName)
        .slice(0, 100);
      return sendJson(res, 200, { logs });
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
    if (url.pathname === "/api/mercadolibre/callback" || url.pathname === "/oauth/mercadolibre/callback") return handleMercadoLibreCallback(req, res);
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
