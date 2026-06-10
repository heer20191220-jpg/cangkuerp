const VOLUME_DIVISOR = 6000;

const englishNameMap = [
  ["隔尿垫", "Changing Pad"], ["卸扣", "Shackle"], ["电话手表", "Smart Phone Watch"],
  ["智能手表", "Smart Watch"], ["手机壳", "Mobile Phone Case"], ["保护壳", "Protective Case"],
  ["数据线", "Data Cable"], ["充电线", "Charging Cable"], ["充电器", "Charger"],
  ["耳机", "Earphones"], ["键盘", "Keyboard"], ["鼠标", "Mouse"], ["玩具", "Toy"],
  ["模型", "Model"], ["衣服", "Garment"], ["背包", "Backpack"], ["手提包", "Handbag"],
  ["钱包", "Wallet"], ["妈咪包", "Diaper Bag"], ["收纳盒", "Storage Box"], ["杯子", "Cup"],
  ["碗", "Bowl"], ["盘子", "Plate"], ["玻璃瓶", "Glass Bottle"], ["玻璃容器", "Glass Container"]
];

const materialMap = [
  ["纤维", "Textile Fiber"], ["布", "Fabric"], ["棉", "Cotton"], ["涤纶", "Polyester"],
  ["塑料", "Plastic"], ["硅胶", "Silicone"], ["橡胶", "Rubber"], ["钢铁", "Steel"],
  ["不锈钢", "Stainless Steel"], ["合金", "Alloy"], ["木", "Wood"], ["纸", "Paper"],
  ["皮革", "Leather"], ["电子", "Electronic Components"], ["玻璃", "Glass"]
];

const useMap = [
  ["防漏", "For Leakage Protection"], ["连接", "For Connecting"], ["固定", "For Fastening"],
  ["通话", "For Calling"], ["定位", "For Positioning"], ["保护", "For Protection"],
  ["收纳", "For Storage"], ["穿着", "For Wearing"], ["装饰", "For Decoration"],
  ["充电", "For Charging"], ["传输", "For Data Transfer"], ["娱乐", "For Entertainment"],
  ["日用", "For Daily Use"]
];

const csvHeaders = ["店铺名", "自定义商品名", "1688采购链接", "主图链接", "变体信息", "中文品名", "中文材质", "中文用途", "产品类别", "长cm", "宽cm", "高cm", "重量kg", "采购价RMB"];

const elements = {
  loginView: document.querySelector("#loginView"),
  appView: document.querySelector("#appView"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginMessage: document.querySelector("#loginMessage"),
  productsPage: document.querySelector("#productsPage"),
  shopsPage: document.querySelector("#shopsPage"),
  storeOrdersPage: document.querySelector("#storeOrdersPage"),
  domesticShipmentsPage: document.querySelector("#domesticShipmentsPage"),
  storeAssetsPage: document.querySelector("#storeAssetsPage"),
  productsNavButton: document.querySelector("#productsNavButton"),
  shopsNavButton: document.querySelector("#shopsNavButton"),
  storeOrdersNavButton: document.querySelector("#storeOrdersNavButton"),
  domesticShipmentsNavButton: document.querySelector("#domesticShipmentsNavButton"),
  storeAssetsNavButton: document.querySelector("#storeAssetsNavButton"),
  pageTabs: document.querySelector("#pageTabs"),
  pageTitle: document.querySelector("#pageTitle"),
  modal: document.querySelector("#productModal"),
  shopModal: document.querySelector("#shopModal"),
  domesticShipmentModal: document.querySelector("#domesticShipmentModal"),
  form: document.querySelector("#productForm"),
  shopForm: document.querySelector("#shopForm"),
  domesticShipmentForm: document.querySelector("#domesticShipmentForm"),
  formTitle: document.querySelector("#formTitle"),
  shopFormTitle: document.querySelector("#shopFormTitle"),
  domesticShipmentFormTitle: document.querySelector("#domesticShipmentFormTitle"),
  newProductButton: document.querySelector("#newProductButton"),
  newShopButton: document.querySelector("#newShopButton"),
  bindMercadoLibreButton: document.querySelector("#bindMercadoLibreButton"),
  newDomesticShipmentButton: document.querySelector("#newDomesticShipmentButton"),
  closeModalButton: document.querySelector("#closeModalButton"),
  closeShopModalButton: document.querySelector("#closeShopModalButton"),
  closeDomesticShipmentModalButton: document.querySelector("#closeDomesticShipmentModalButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  cancelShopButton: document.querySelector("#cancelShopButton"),
  cancelDomesticShipmentButton: document.querySelector("#cancelDomesticShipmentButton"),
  addDomesticShipmentBoxButton: document.querySelector("#addDomesticShipmentBoxButton"),
  addDomesticShipmentProductButton: document.querySelector("#addDomesticShipmentProductButton"),
  exportDomesticShipmentButton: document.querySelector("#exportDomesticShipmentButton"),
  testShopConnectionButton: document.querySelector("#testShopConnectionButton"),
  refreshShopTokenButton: document.querySelector("#refreshShopTokenButton"),
  startMercadoLibreAuthButton: document.querySelector("#startMercadoLibreAuthButton"),
  exportButton: document.querySelector("#exportButton"),
  downloadTemplateButton: document.querySelector("#downloadTemplateButton"),
  batchFileInput: document.querySelector("#batchFileInput"),
  collect1688Button: document.querySelector("#collect1688Button"),
  mainImageUpload: document.querySelector("#mainImageUpload"),
  mainImageFile: document.querySelector("#mainImageFile"),
  mainImageUrlInput: document.querySelector("#mainImageUrlInput"),
  clearImageButton: document.querySelector("#clearImageButton"),
  mainImagePreview: document.querySelector("#mainImagePreview"),
  collectStatus: document.querySelector("#collectStatus"),
  variantPreview: document.querySelector("#variantPreview"),
  variantDropdown: document.querySelector("#variantDropdown"),
  variantSummary: document.querySelector("#variantSummary"),
  manualVariantName: document.querySelector("#manualVariantName"),
  manualVariantPaste: document.querySelector("#manualVariantPaste"),
  manualVariantButton: document.querySelector("#manualVariantButton"),
  logoutButton: document.querySelector("#logoutButton"),
  clearProductsButton: document.querySelector("#clearProductsButton"),
  searchInput: document.querySelector("#searchInput"),
  productRows: document.querySelector("#productRows"),
  shopRows: document.querySelector("#shopRows"),
  storeOrderRows: document.querySelector("#storeOrderRows"),
  syncLogRows: document.querySelector("#syncLogRows"),
  storeOrderSummary: document.querySelector("#storeOrderSummary"),
  storeOrderMessage: document.querySelector("#storeOrderMessage"),
  fbnReportFileInput: document.querySelector("#fbnReportFileInput"),
  viewOrderSyncLogsButton: document.querySelector("#viewOrderSyncLogsButton"),
  orderSearchButton: document.querySelector("#orderSearchButton"),
  orderResetButton: document.querySelector("#orderResetButton"),
  domesticShipmentRows: document.querySelector("#domesticShipmentRows"),
  domesticShipmentLineRows: document.querySelector("#domesticShipmentLineRows"),
  domesticShipmentSummary: document.querySelector("#domesticShipmentSummary"),
  shipmentStatusTabs: document.querySelector("#shipmentStatusTabs"),
  shipmentSearchButton: document.querySelector("#shipmentSearchButton"),
  shipmentResetButton: document.querySelector("#shipmentResetButton"),
  storeAssetSummary: document.querySelector("#storeAssetSummary"),
  storeAssetRows: document.querySelector("#storeAssetRows"),
  storeAssetMessage: document.querySelector("#storeAssetMessage"),
  assetSearchButton: document.querySelector("#assetSearchButton"),
  assetResetButton: document.querySelector("#assetResetButton"),
  downloadStoreInventoryTemplateButton: document.querySelector("#downloadStoreInventoryTemplateButton"),
  storeInventoryFileInput: document.querySelector("#storeInventoryFileInput"),
  productCount: document.querySelector("#productCount"),
  userBadge: document.querySelector("#userBadge"),
  ruleLabel: document.querySelector("#ruleLabel"),
  formMessage: document.querySelector("#formMessage"),
  shopMessage: document.querySelector("#shopMessage"),
  domesticShipmentMessage: document.querySelector("#domesticShipmentMessage"),
  shopMaskedPreview: document.querySelector("#shopMaskedPreview"),
  fields: {
    storeName: document.querySelector("#storeName"),
    customName: document.querySelector("#customName"),
    purchaseUrl: document.querySelector("#purchaseUrl"),
    mainImage: document.querySelector("#mainImage"),
    variantsJson: document.querySelector("#variantsJson"),
    zhName: document.querySelector("#zhName"),
    materialZh: document.querySelector("#materialZh"),
    useZh: document.querySelector("#useZh"),
    category: document.querySelector("#category"),
    hsCodeManual: document.querySelector("#hsCodeManual"),
    length: document.querySelector("#length"),
    width: document.querySelector("#width"),
    height: document.querySelector("#height"),
    weight: document.querySelector("#weight"),
    price: document.querySelector("#price")
  },
  shopFields: {
    shopName: document.querySelector("#shopName"),
    platformType: document.querySelector("#platformType"),
    authType: document.querySelector("#shopAuthType"),
    shopAccount: document.querySelector("#shopAccount"),
    noonWarehouseRow: document.querySelector("#noonWarehouseRow"),
    noonWarehouseCode: document.querySelector("#shopNoonWarehouseCode"),
    apiKey: document.querySelector("#shopApiKey"),
    apiSecret: document.querySelector("#shopApiSecret"),
    noonCredentialRow: document.querySelector("#noonCredentialRow"),
    noonCredentialFile: document.querySelector("#shopNoonCredentialFile"),
    accessToken: document.querySelector("#shopAccessToken"),
    refreshToken: document.querySelector("#shopRefreshToken"),
    tokenExpiresAt: document.querySelector("#shopTokenExpiresAt"),
    remark: document.querySelector("#shopRemark")
  },
  domesticShipmentFields: {
    shippedAt: document.querySelector("#domesticShipmentShippedAt"),
    logisticsProvider: document.querySelector("#domesticShipmentLogisticsProvider"),
    logisticsMethod: document.querySelector("#domesticShipmentLogisticsMethod"),
    shipper: document.querySelector("#domesticShipmentShipper"),
    storeName: document.querySelector("#domesticShipmentStoreName"),
    trackingNo: document.querySelector("#domesticShipmentTrackingNo"),
    customNo: document.querySelector("#domesticShipmentCustomNo"),
    platformShipmentNo: document.querySelector("#domesticShipmentPlatformShipmentNo"),
    status: document.querySelector("#domesticShipmentStatus"),
    inspectionStatus: document.querySelector("#domesticShipmentInspectionStatus"),
    outboundWarehouse: document.querySelector("#domesticShipmentOutboundWarehouse"),
    inboundWarehouse: document.querySelector("#domesticShipmentInboundWarehouse")
  },
  shipmentFilters: {
    shipmentNo: document.querySelector("#shipmentFilterNo"),
    shipper: document.querySelector("#shipmentFilterShipper"),
    trackingNo: document.querySelector("#shipmentFilterTracking"),
    outboundWarehouse: document.querySelector("#shipmentFilterOutboundWarehouse"),
    inboundWarehouse: document.querySelector("#shipmentFilterInboundWarehouse"),
    logisticsMethod: document.querySelector("#shipmentFilterLogisticsMethod")
  },
  assetFilters: {
    store: document.querySelector("#assetFilterStore"),
    product: document.querySelector("#assetFilterProduct")
  },
  orderFilters: {
    platform: document.querySelector("#orderFilterPlatform"),
    shop: document.querySelector("#orderFilterShop"),
    keyword: document.querySelector("#orderFilterKeyword"),
    status: document.querySelector("#orderFilterStatus")
  },
  output: {
    generatedEnName: document.querySelector("#generatedEnName"),
    hsCode: document.querySelector("#hsCode"),
    chargeWeight: document.querySelector("#chargeWeight"),
    volume: document.querySelector("#volume"),
    useEn: document.querySelector("#useEn"),
    materialEn: document.querySelector("#materialEn"),
    categoryPreview: document.querySelector("#categoryPreview")
  }
};

let products = [];
let shops = [];
let storeOrders = { orders: [], summary: null };
let syncLogs = [];
let domesticShipments = [];
let storeAssets = { summary: null, stores: [] };
let shipmentLines = [];
let activePage = "products";
let openPageTabs = ["products"];
let activeShipmentStatusFilter = "";
let editingId = null;
let editingShopId = null;
let editingDomesticShipmentId = null;
let previewTimer = null;
let collectedVariants = [];
let selectedVariantNames = new Set();

async function requestApi(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.errors) && data.errors.some((item) => item?.row || item?.error)
      ? `：${data.errors.map((item) => item?.row ? `第${item.row}行 ${item.error || ""}` : item?.error).filter(Boolean).join("；")}`
      : "";
    throw new Error((data.error || "请求失败") + detail);
  }
  return data;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeShortChinese(value) {
  return String(value || "").trim().replace(/\s+/g, "").slice(0, 20);
}

function translateByMap(value, map, fallback) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "-";
  const matched = map.find(([term]) => cleanValue.includes(term));
  return matched ? matched[1] : fallback;
}

async function lookupHsCode(zhName) {
  if (!zhName) return { code: "待查询", label: "待查询" };
  return requestApi(`/api/hs-codes/lookup?name=${encodeURIComponent(zhName)}`);
}

function getFormInput() {
  return {
    storeName: elements.fields.storeName.value.trim(),
    customName: elements.fields.customName.value.trim(),
    purchaseUrl: elements.fields.purchaseUrl.value.trim(),
    mainImage: elements.fields.mainImage.value.trim(),
    variants: parseVariantsInput(),
    zhName: normalizeShortChinese(elements.fields.zhName.value),
    materialZh: normalizeShortChinese(elements.fields.materialZh.value),
    useZh: normalizeShortChinese(elements.fields.useZh.value),
    category: elements.fields.category.value,
    hsCode: elements.fields.hsCodeManual.value.trim(),
    length: toNumber(elements.fields.length.value),
    width: toNumber(elements.fields.width.value),
    height: toNumber(elements.fields.height.value),
    weight: toNumber(elements.fields.weight.value),
    price: toNumber(elements.fields.price.value)
  };
}

function parseVariantsInput() {
  const value = elements.fields.variantsJson.value.trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("变体信息必须是数组");
    return parsed
      .map((item) => ({
        name: String(item.name || "").trim(),
        image: String(item.image || item.imageUrl || "").trim()
      }))
      .filter((item) => item.name || item.image)
      .slice(0, 80);
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

function syncVariantsJson() {
  const selected = collectedVariants
    .filter((variant) => selectedVariantNames.has(variant.name))
    .map((variant) => ({ name: variant.name, image: variant.image || "" }));
  elements.fields.variantsJson.value = selected.length ? JSON.stringify(selected, null, 2) : "";
}

function setVariantOptions(variants = [], selectAll = true) {
  const seen = new Set();
  collectedVariants = variants
    .map((variant) => ({
      name: String(variant.name || "").trim(),
      image: String(variant.image || variant.imageUrl || "").trim()
    }))
    .filter((variant) => {
      if (!variant.name || seen.has(variant.name)) return false;
      seen.add(variant.name);
      return true;
    })
    .slice(0, 80);
  selectedVariantNames = new Set(selectAll ? collectedVariants.map((variant) => variant.name) : []);
  syncVariantsJson();
  renderVariantDropdown();
  updateAssetPreview();
}

function renderVariantDropdown() {
  const count = selectedVariantNames.size;
  elements.variantSummary.textContent = collectedVariants.length ? `已选择 ${count}/${collectedVariants.length} 个变体` : "未添加变体";
  if (!collectedVariants.length) {
    elements.variantDropdown.innerHTML = `<p class="variant-empty">手动添加后显示在这里</p>`;
    return;
  }
  elements.variantDropdown.innerHTML = collectedVariants.map((variant, index) => `
    <label class="variant-option">
      <input type="checkbox" value="${escapeHtml(variant.name)}" ${selectedVariantNames.has(variant.name) ? "checked" : ""}>
      ${variant.image ? `<img src="${escapeHtml(variant.image)}" alt="">` : `<span class="variant-image-placeholder"></span>`}
      <span class="variant-name">${escapeHtml(variant.name)}</span>
      <button type="button" data-remove-variant="${escapeHtml(variant.name)}">删除</button>
    </label>
  `).join("");
}

function addVariants(variants) {
  setVariantOptions([...collectedVariants, ...variants], true);
  schedulePreviewUpdate();
}

function removeVariant(name) {
  collectedVariants = collectedVariants.filter((variant) => variant.name !== name);
  selectedVariantNames.delete(name);
  syncVariantsJson();
  renderVariantDropdown();
  updateAssetPreview();
}

function parseManualVariantText(value) {
  const variants = [];
  const seen = new Set();
  const add = (name) => {
    const cleanName = String(name || "")
      .replace(/[+\-−]\s*\d*$/g, "")
      .replace(/^(尺寸|型号|规格|颜色|款式|尺码)\s*/g, "")
      .trim();
    if (!cleanName || seen.has(cleanName)) return;
    if (!isLikelyVariantName(cleanName)) return;
    seen.add(cleanName);
    variants.push({ name: cleanName, image: "" });
  };
  const text = String(value || "").replace(/\r/g, "\n");
  for (const match of text.matchAll(/M\s*\d{1,3}\s*(?:欧规|美规|澳规|日规|英规|国规|德规|欧标|美标|英标|澳标)/gi)) add(match[0].replace(/\s+/g, ""));
  for (const match of text.matchAll(/[\u4e00-\u9fa5A-Za-z0-9]{1,24}款\s*\d+/g)) add(match[0].replace(/\s+/g, ""));
  for (const line of text.split(/\n+/)) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    const beforePrice = normalized.split(/￥|¥|库存|价格|起批|个可售/)[0].trim();
    const parts = beforePrice.split(/\s+/).filter(Boolean);
    const candidate = parts.find((part) => isLikelyVariantName(part)) || beforePrice;
    add(candidate);
  }
  return variants.slice(0, 80);
}

function isLikelyVariantName(name) {
  if (!name || name.length > 40 || /^\d+$/.test(name)) return false;
  if (/^(尺寸|型号|规格|颜色|款式|尺码|包装定制|默认原包装|商家赠送)$/.test(name)) return false;
  if (/￥|¥|库存|价格|运费|客服|立即|采购车|下单|收藏|起批|个可售/.test(name)) return false;
  return /^M\s*\d{1,3}/i.test(name) || /款\s*\d+|欧规|美规|澳规|日规|英规|国规|德规|红色|黑色|白色|蓝色|绿色|灰色|尺寸|型号|规格/.test(name) || name.length <= 24;
}

function importManualVariants() {
  const typed = elements.manualVariantName.value.trim();
  const variants = typed ? [{ name: typed, image: "" }] : parseManualVariantText(elements.manualVariantPaste.value);
  if (!variants.length) {
    setMessage("没有识别到可添加的变体。", true);
    return;
  }
  addVariants(variants);
  elements.manualVariantName.value = "";
  elements.manualVariantPaste.value = "";
  elements.collectStatus.textContent = `已添加：${variants.length} 个变体`;
  setMessage("");
}

function updateAssetPreview() {
  const mainImage = elements.fields.mainImage.value.trim();
  elements.mainImagePreview.src = mainImage;
  elements.mainImagePreview.classList.toggle("visible", Boolean(mainImage));
  elements.mainImageUpload.classList.toggle("has-image", Boolean(mainImage));
  if (elements.mainImageUrlInput.value !== mainImage && /^https?:\/\//i.test(mainImage)) elements.mainImageUrlInput.value = mainImage;
  const variants = parseVariantsInput();
  elements.variantPreview.innerHTML = variants.slice(0, 12).map((variant) => `
    <span class="variant-chip">
      ${variant.image ? `<img src="${escapeHtml(variant.image)}" alt="">` : ""}
      ${escapeHtml(variant.name || "未命名")}
    </span>
  `).join("");
}

function setMainImage(value) {
  elements.fields.mainImage.value = value || "";
  updateAssetPreview();
}

function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("请选择图片文件。"));
    if (file.size > 4 * 1024 * 1024) return reject(new Error("图片不能超过 4MB。"));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
}

async function handleImageFile(file) {
  try {
    const dataUrl = await imageFileToDataUrl(file);
    elements.mainImageUrlInput.value = "";
    setMainImage(dataUrl);
    elements.collectStatus.textContent = "主图已添加";
    setMessage("");
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function collect1688() {
  const url = elements.fields.purchaseUrl.value.trim();
  if (!url) {
    setMessage("请先填写 1688 采购链接。", true);
    elements.collectStatus.textContent = "缺少链接";
    return;
  }

  elements.collect1688Button.disabled = true;
  elements.collectStatus.textContent = "正在采集...";
  try {
    const data = await requestApi("/api/collect/1688", { method: "POST", body: JSON.stringify({ url }) });
    const collected = data.product;
    elements.fields.purchaseUrl.value = collected.purchaseUrl || url;
    if (collected.mainImage) setMainImage(collected.mainImage);
    setVariantOptions(collected.variants || [], true);
    elements.collectStatus.textContent = `采集完成：${collected.variants?.length || 0} 个变体`;
    schedulePreviewUpdate();
  } catch (error) {
    elements.collectStatus.textContent = "采集失败";
    setMessage(error.message, true);
  } finally {
    elements.collect1688Button.disabled = false;
  }
}

function buildPreviewProduct() {
  const input = getFormInput();
  const volumeCbm = input.length * input.width * input.height / 1000000;
  const volumeWeight = input.length * input.width * input.height / VOLUME_DIVISOR;
  const chargeWeight = Math.max(input.weight, volumeWeight);
  return {
    ...input,
    declarationName: input.storeName && input.customName ? `${input.storeName}-${input.customName}` : input.customName || input.storeName || "-",
    enName: translateByMap(input.zhName, englishNameMap, "General Merchandise"),
    materialEn: translateByMap(input.materialZh, materialMap, "To Be Confirmed"),
    useEn: translateByMap(input.useZh, useMap, "For Daily Use"),
    volumeCbm: round(volumeCbm, 6),
    chargeWeight: round(chargeWeight, 2)
  };
}

async function updatePreview() {
  const generated = buildPreviewProduct();
  elements.output.generatedEnName.textContent = generated.enName;
  elements.output.chargeWeight.textContent = `${generated.chargeWeight.toFixed(2)} kg`;
  elements.output.volume.textContent = `${generated.volumeCbm.toFixed(6)} m3`;
  elements.output.useEn.textContent = generated.useEn;
  elements.output.materialEn.textContent = generated.materialEn;
  elements.output.categoryPreview.textContent = generated.category || "普货";
  const manualHsCode = elements.fields.hsCodeManual.value.trim();
  if (manualHsCode) {
    elements.output.hsCode.textContent = manualHsCode;
    elements.ruleLabel.textContent = "\u624b\u52a8\u8f93\u5165";
    return;
  }
  try {
    const hsResult = await lookupHsCode(generated.zhName);
    elements.output.hsCode.textContent = hsResult.code;
    elements.ruleLabel.textContent = hsResult.label;
  } catch {
    elements.output.hsCode.textContent = "查询失败";
    elements.ruleLabel.textContent = "离线";
  }
}

function schedulePreviewUpdate() {
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(updatePreview, 350);
}

function showApp(user) {
  elements.loginView.classList.add("hidden");
  elements.appView.classList.remove("hidden");
  elements.userBadge.textContent = `${user.displayName}（${roleName(user.role)}）`;
}

function showLogin() {
  closeProductModal();
  elements.appView.classList.add("hidden");
  elements.loginView.classList.remove("hidden");
}

function roleName(role) {
  return ({ admin: "管理员", operator: "录入员", viewer: "查看员" })[role] || role;
}

async function loadProducts() {
  const q = elements.searchInput.value.trim();
  const data = await requestApi(`/api/products?q=${encodeURIComponent(q)}`);
  products = data.products;
  renderProducts();
}

async function loadShops() {
  const data = await requestApi("/api/shops");
  shops = data.shops;
  renderShops();
}

async function loadStoreOrders() {
  const params = new URLSearchParams();
  const platform = elements.orderFilters.platform.value;
  const shop = elements.orderFilters.shop.value.trim();
  const keyword = elements.orderFilters.keyword.value.trim();
  const status = elements.orderFilters.status.value.trim();
  if (platform) params.set("platform", platform);
  if (shop) params.set("shop", shop);
  if (keyword) params.set("keyword", keyword);
  if (status) params.set("status", status);
  const query = params.toString();
  storeOrders = await requestApi(`/api/store-orders${query ? `?${query}` : ""}`);
  renderStoreOrders();
}

async function loadSyncLogs() {
  const data = await requestApi("/api/sync-logs");
  syncLogs = data.logs || [];
  renderSyncLogs();
}

async function loadDomesticShipments() {
  const data = await requestApi("/api/domestic-shipments");
  domesticShipments = data.shipments;
  renderDomesticShipments();
}

async function loadStoreAssets() {
  storeAssets = await requestApi("/api/store-assets");
  renderStoreAssets();
}

function renderProducts() {
  elements.productCount.textContent = `${products.length} 个产品`;
  if (products.length === 0) {
    elements.productRows.innerHTML = '<tr class="empty-row"><td colspan="10">暂无产品</td></tr>';
    return;
  }
  elements.productRows.innerHTML = products.map((product) => `
    <tr>
      <td>${product.mainImage ? `<img class="product-thumb" src="${escapeHtml(product.mainImage)}" alt="">` : '<span class="muted-cell">无</span>'}</td>
      <td>${escapeHtml(product.storeName)}</td>
      <td>${escapeHtml(product.customName)}</td>
      <td>${escapeHtml(product.zhName)}</td>
      <td>${escapeHtml(product.enName)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.hsCode)}</td>
      <td>${Number(product.chargeWeight).toFixed(2)} kg</td>
      <td>￥${Number(product.price).toFixed(2)}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-action="edit" data-id="${product.id}">编辑</button>
          <button type="button" data-action="delete" data-id="${product.id}">删除</button>
        </div>
      </td>
    </tr>
  `).join("");
}

const assetStageMeta = [
  ["inStock", "\u5728\u552e"],
  ["pending", "\u672a\u53d1\u8d27"],
  ["shipped", "\u5df2\u53d1\u8d27"],
  ["overseas", "\u672a\u9001\u4ed3"]
];

function formatMoney(value) {
  return `\u00a5${Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(value) {
  return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function renderAssetMetric(quantity, value) {
  return `<div class="asset-metric"><strong>${formatQty(quantity)}</strong><span>${formatMoney(value)}</span></div>`;
}

function filterStoreAssets() {
  const storeQuery = elements.assetFilters.store.value.trim().toLowerCase();
  const productQuery = elements.assetFilters.product.value.trim().toLowerCase();
  return (storeAssets.stores || []).map((store) => {
    const storeMatched = !storeQuery || store.storeName.toLowerCase().includes(storeQuery);
    const items = (store.items || []).filter((item) => {
      const productMatched = !productQuery || [item.productName, item.zhName].some((value) => String(value || "").toLowerCase().includes(productQuery));
      return storeMatched && productMatched;
    });
    return { ...store, items };
  }).filter((store) => store.items.length);
}

function renderStoreAssets() {
  const summary = storeAssets.summary || { quantities: {}, values: {}, totalQuantity: 0, totalValue: 0 };
  elements.storeAssetSummary.innerHTML = [
    `<article class="asset-summary-card total"><span>\u5168\u90e8\u603b\u8d27\u503c</span><strong>${formatMoney(summary.totalValue)}</strong><small>${formatQty(summary.totalQuantity)} 件</small></article>`,
    ...assetStageMeta.map(([stage, label]) => `<article class="asset-summary-card"><span>${label}</span><strong>${formatMoney(summary.values?.[stage])}</strong><small>${formatQty(summary.quantities?.[stage])} 件</small></article>`)
  ].join("");

  const stores = filterStoreAssets();
  if (!stores.length) {
    elements.storeAssetRows.innerHTML = '<tr class="empty-row"><td colspan="9">\u6682\u65e0\u5e97\u94fa\u8d44\u4ea7</td></tr>';
    return;
  }

  elements.storeAssetRows.innerHTML = stores.map((store) => {
    const storeHeader = `
      <tr class="asset-store-row">
        <td colspan="2">${escapeHtml(store.storeName)}</td>
        ${assetStageMeta.map(([stage]) => `<td>${renderAssetMetric(store.quantities?.[stage], store.values?.[stage])}</td>`).join("")}
        <td>${renderAssetMetric(store.totalQuantity, store.totalValue)}</td>
        <td colspan="2"></td>
      </tr>
    `;
    const itemRows = store.items.map((item) => `
      <tr class="asset-product-row">
        <td><strong>${escapeHtml(item.productName || item.zhName || "-")}</strong><span>${escapeHtml(item.zhName || "")}</span></td>
        <td>${item.image ? `<img class="product-thumb" src="${escapeHtml(item.image)}" alt="">` : '<span class="muted-cell">\u65e0</span>'}</td>
        ${assetStageMeta.map(([stage]) => `<td>${formatQty(item.quantities?.[stage])}</td>`).join("")}
        <td><strong>${formatQty(item.totalQuantity)}</strong></td>
        <td>${formatMoney(item.price)}</td>
        <td><span class="match-pill ${item.matched ? "matched" : ""}">${item.matched ? "\u5df2\u5339\u914d" : "\u672a\u5339\u914d"}</span></td>
      </tr>
    `).join("");
    const storeFooter = `
      <tr class="asset-total-row">
        <td colspan="2">${escapeHtml(store.storeName)} \u6c47\u603b</td>
        ${assetStageMeta.map(([stage]) => `<td>${renderAssetMetric(store.quantities?.[stage], store.values?.[stage])}</td>`).join("")}
        <td>${renderAssetMetric(store.totalQuantity, store.totalValue)}</td>
        <td colspan="2"></td>
      </tr>
    `;
    return storeHeader + itemRows + storeFooter;
  }).join("") + `
    <tr class="asset-grand-total-row">
      <td colspan="2">\u5168\u90e8\u5e97\u94fa\u6c47\u603b</td>
      ${assetStageMeta.map(([stage]) => `<td>${renderAssetMetric(summary.quantities?.[stage], summary.values?.[stage])}</td>`).join("")}
      <td>${renderAssetMetric(summary.totalQuantity, summary.totalValue)}</td>
      <td colspan="2"></td>
    </tr>
  `;
}

const shipmentStatusMeta = {
  pending: { label: "\u5f85\u53d1\u8d27", className: "pending" },
  shipped: { label: "\u5df2\u53d1\u8d27", className: "shipped" },
  overseas_arrived: { label: "\u5df2\u5230\u6d77\u5916\u4ed3", className: "arrived" },
  warehouse_delivered: { label: "\u5df2\u9001\u4ed3", className: "delivered" },
  cancelled: { label: "\u5df2\u53d6\u6d88", className: "cancelled" }
};

const inspectionStatusMeta = {
  none: { label: "\u672a\u67e5\u9a8c", className: "none" },
  inspection: { label: "\u67e5\u9a8c\u4e2d", className: "inspection" },
  passed: { label: "\u5df2\u653e\u884c", className: "passed" }
};

function normalizeShipmentStatus(status) {
  return shipmentStatusMeta[status] ? status : status === "draft" ? "pending" : "pending";
}

function normalizeInspectionStatus(status) {
  return inspectionStatusMeta[status] ? status : "none";
}

function getFilteredDomesticShipments() {
  const filters = {
    shipmentNo: elements.shipmentFilters.shipmentNo.value.trim().toLowerCase(),
    shipper: elements.shipmentFilters.shipper.value.trim().toLowerCase(),
    trackingNo: elements.shipmentFilters.trackingNo.value.trim().toLowerCase(),
    outboundWarehouse: elements.shipmentFilters.outboundWarehouse.value.trim().toLowerCase(),
    inboundWarehouse: elements.shipmentFilters.inboundWarehouse.value.trim().toLowerCase(),
    logisticsMethod: elements.shipmentFilters.logisticsMethod.value
  };
  return domesticShipments.filter((shipment) => {
    const status = normalizeShipmentStatus(shipment.status);
    if (activeShipmentStatusFilter && status !== activeShipmentStatusFilter) return false;
    if (filters.logisticsMethod && shipment.logisticsMethod !== filters.logisticsMethod) return false;
    if (filters.shipmentNo && !String(shipment.shipmentNo || shipment.customNo || "").toLowerCase().includes(filters.shipmentNo)) return false;
    if (filters.shipper && !String(shipment.shipper || "").toLowerCase().includes(filters.shipper)) return false;
    if (filters.trackingNo && !String(shipment.trackingNo || shipment.platformShipmentNo || "").toLowerCase().includes(filters.trackingNo)) return false;
    if (filters.outboundWarehouse && !String(shipment.outboundWarehouse || "").toLowerCase().includes(filters.outboundWarehouse)) return false;
    if (filters.inboundWarehouse && !String(shipment.inboundWarehouse || "").toLowerCase().includes(filters.inboundWarehouse)) return false;
    return true;
  });
}

function renderShipmentStatusTabs() {
  const counts = domesticShipments.reduce((acc, shipment) => {
    const status = normalizeShipmentStatus(shipment.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  elements.shipmentStatusTabs.innerHTML = Object.entries(shipmentStatusMeta).map(([status, meta]) => `
    <button class="shipment-status-tab ${meta.className} ${activeShipmentStatusFilter === status ? "active" : ""}" type="button" data-shipment-status-tab="${status}">
      <span>${escapeHtml(meta.label)}</span>
      <strong>${counts[status] || 0}</strong>
    </button>
  `).join("");
}

function renderDomesticShipments() {
  renderShipmentStatusTabs();
  const visibleShipments = getFilteredDomesticShipments();
  if (visibleShipments.length === 0) {
    elements.domesticShipmentRows.innerHTML = '<tr class="empty-row"><td colspan="13">\u6682\u65e0\u53d1\u8d27\u5355</td></tr>';
    return;
  }

  elements.domesticShipmentRows.innerHTML = visibleShipments.map((shipment) => {
    const shipmentStatus = normalizeShipmentStatus(shipment.status);
    const inspectionStatus = normalizeInspectionStatus(shipment.inspectionStatus);
    return `
    <tr>
      <td>${escapeHtml(formatDateOnly(shipment.shippedAt))}</td>
      <td>${escapeHtml(shipment.storeName || "-")}</td>
      <td>${escapeHtml(shipment.logisticsProvider || "-")}</td>
      <td>${escapeHtml(shipment.logisticsMethod === "sea" ? "\u6d77\u8fd0" : "\u7a7a\u8fd0")}</td>
      <td>${escapeHtml(shipment.trackingNo || shipment.customNo || shipment.platformShipmentNo || "-")}</td>
      <td><span class="shipment-pill ${shipmentStatusMeta[shipmentStatus].className}">${escapeHtml(shipmentStatusMeta[shipmentStatus].label)}</span></td>
      <td><span class="inspection-pill ${inspectionStatusMeta[inspectionStatus].className}">${escapeHtml(inspectionStatusMeta[inspectionStatus].label)}</span></td>
      <td>${Number(shipment.boxCount || 0)}</td>
      <td>${Number(shipment.productCount || 0)}</td>
      <td>${Number(shipment.totalCbm || 0).toFixed(6)}</td>
      <td>${Number(shipment.totalChargeWeight || 0).toFixed(2)} kg</td>
      <td>${escapeHtml(formatDateTime(shipment.updatedAt))}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-shipment-action="export" data-id="${shipment.id}">\u5bfc\u51fa</button>
          <button type="button" data-shipment-action="edit" data-id="${shipment.id}">\u7f16\u8f91</button>
          <button type="button" data-shipment-action="delete" data-id="${shipment.id}">\u5220\u9664</button>
        </div>
      </td>
    </tr>
  `;
  }).join("");
}
function renderShops() {
  if (shops.length === 0) {
    elements.shopRows.innerHTML = '<tr class="empty-row"><td colspan="10">暂无店铺</td></tr>';
    return;
  }

  elements.shopRows.innerHTML = shops.map((shop) => `
    <tr>
      <td>${escapeHtml(shop.shop_name)}</td>
      <td>${escapeHtml(platformLabel(shop.platform))}</td>
      <td>${escapeHtml(shop.seller_id)}</td>
      <td>${escapeHtml(authTypeLabel(shop.auth_type))}</td>
      <td>${escapeHtml(shop.api_key_masked || "未填写")}</td>
      <td>${escapeHtml(shop.access_token_masked || "未填写")}</td>
      <td><span class="status-pill ${statusClass(shop.status)}">${escapeHtml(shopBindingStatusLabel(shop))}</span></td>
      <td>${escapeHtml(formatDateTime(shop.last_sync_at))}</td>
      <td>${escapeHtml(shop.last_error || "-")}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-shop-action="test" data-id="${shop.id}">测试</button>
          <button type="button" data-shop-action="refresh" data-id="${shop.id}">刷新</button>
          <button type="button" data-shop-action="edit" data-id="${shop.id}">编辑</button>
          <button type="button" data-shop-action="delete" data-id="${shop.id}">删除</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderStoreOrders() {
  const summary = storeOrders.summary || { count: 0, salesAmount: 0, commissionFee: 0, logisticsFee: 0, netAmount: 0 };
  elements.storeOrderSummary.innerHTML = [
    ["订单数", `${Number(summary.count || 0).toLocaleString("zh-CN")} 单`, "全部平台订单"],
    ["销售额收入", formatMoney(summary.salesAmount), "订单总销售额"],
    ["平台佣金支出", formatMoney(summary.commissionFee), "平台扣佣"],
    ["物流费支出", formatMoney(summary.logisticsFee), "订单物流费用"],
    ["净收入", formatMoney(summary.netAmount), "销售额 - 佣金 - 物流"]
  ].map(([label, value, hint], index) => `
    <article class="order-summary-card ${index === 4 ? "total" : ""}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${hint}</small>
    </article>
  `).join("");

  const orders = storeOrders.orders || [];
  if (!orders.length) {
    elements.storeOrderRows.innerHTML = '<tr class="empty-row"><td colspan="11">暂无店铺订单</td></tr>';
    return;
  }
  elements.storeOrderRows.innerHTML = orders.map((order) => `
    <tr>
      <td>${escapeHtml(platformLabel(order.platform))}</td>
      <td>${escapeHtml(order.shopName || "-")}</td>
      <td><strong>${escapeHtml(order.orderNo || "-")}</strong></td>
      <td>${escapeHtml(formatDateTime(order.orderTime))}</td>
      <td><span class="order-status-pill">${escapeHtml(order.status || "-")}</span></td>
      <td>${formatMoney(order.salesAmount)}</td>
      <td>${formatMoney(order.commissionFee)}</td>
      <td>${formatMoney(order.logisticsFee)}</td>
      <td><strong>${formatMoney(order.netAmount)}</strong></td>
      <td>${escapeHtml(order.currency || "-")}</td>
      <td>${escapeHtml(formatDateTime(order.syncedAt))}</td>
    </tr>
  `).join("");
}

function renderSyncLogs() {
  if (!syncLogs.length) {
    elements.syncLogRows.innerHTML = '<tr class="empty-row"><td colspan="6">暂无同步日志</td></tr>';
    return;
  }
  elements.syncLogRows.innerHTML = syncLogs.map((log) => `
    <tr>
      <td>${escapeHtml(formatDateTime(log.createdAt))}</td>
      <td>${escapeHtml(platformLabel(log.platform))}</td>
      <td>${escapeHtml(log.shopName || "-")}</td>
      <td>${escapeHtml(log.target || "-")}</td>
      <td><span class="status-pill ${log.status === "success" ? "connected" : "failed"}">${escapeHtml(log.status || "-")}</span></td>
      <td>${escapeHtml(log.message || "-")}</td>
    </tr>
  `).join("");
}

function statusClass(status) {
  if (status === "connected") return "connected";
  if (status === "failed") return "failed";
  return "pending";
}

function shopBindingStatusLabel(shop) {
  if (shop.platform === "mercadolibre" && shop.auth_type === "oauth" && shop.status === "connected" && shop.has_access_token) return "已绑定";
  return statusLabel(shop.status);
}

function statusLabel(status) {
  return ({ disconnected: "未连接", connected: "已连接", failed: "连接失败" })[status] || "未连接";
}

function platformLabel(platform) {
  return ({ mercadolibre: "Mercado Libre", noon: "noon", Noon: "noon", takealot: "takealot" })[platform] || platform;
}

function authTypeLabel(authType) {
  return ({ oauth: "OAuth", api_key: "API Key", manual: "手动" })[authType] || authType;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatDateOnly(value) {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("error", isError);
}

function setShopMessage(message, isError = false) {
  elements.shopMessage.textContent = message;
  elements.shopMessage.classList.toggle("error", isError);
}

function setStoreOrderMessage(message, isError = false) {
  elements.storeOrderMessage.textContent = message;
  elements.storeOrderMessage.classList.toggle("error", isError);
}

function setDomesticShipmentMessage(message, isError = false) {
  elements.domesticShipmentMessage.textContent = message;
  elements.domesticShipmentMessage.classList.toggle("error", isError);
}

function setStoreAssetMessage(message, isError = false) {
  elements.storeAssetMessage.textContent = message;
  elements.storeAssetMessage.classList.toggle("error", isError);
}

const pageMeta = {
  products: { title: "\u4ea7\u54c1\u5e93", icon: "\u25cf" },
  shops: { title: "\u5e97\u94fa\u7ba1\u7406", icon: "\u25cf" },
  storeOrders: { title: "\u5e97\u94fa\u8ba2\u5355", icon: "\u25cf" },
  domesticShipments: { title: "\u56fd\u5185\u53d1\u8d27", icon: "\u25cf" },
  storeAssets: { title: "\u5e97\u94fa\u8d44\u4ea7", icon: "\u25cf" }
};

function renderPageTabs() {
  elements.pageTabs.innerHTML = openPageTabs.map((page) => {
    const meta = pageMeta[page] || pageMeta.products;
    return `
      <button class="page-tab ${page === activePage ? "active" : ""}" type="button" data-page-tab="${page}">
        <span class="tab-dot" aria-hidden="true">${meta.icon}</span>
        <span>${escapeHtml(meta.title)}</span>
        <span class="tab-close" role="button" tabindex="-1" data-close-page-tab="${page}" aria-label="\u5173\u95ed ${escapeHtml(meta.title)}">&times;</span>
      </button>
    `;
  }).join("");
}

function closePageTab(page) {
  if (openPageTabs.length === 1) return;
  const closedIndex = openPageTabs.indexOf(page);
  openPageTabs = openPageTabs.filter((item) => item !== page);
  if (activePage === page) {
    const nextPage = openPageTabs[Math.max(0, closedIndex - 1)] || openPageTabs[0] || "products";
    switchPage(nextPage, { addTab: false });
    return;
  }
  renderPageTabs();
}

function switchPage(page, options = {}) {
  if (!pageMeta[page]) page = "products";
  if (options.addTab !== false && !openPageTabs.includes(page)) openPageTabs.push(page);
  activePage = page;
  const showProducts = page === "products";
  const showShops = page === "shops";
  const showStoreOrders = page === "storeOrders";
  const showDomesticShipments = page === "domesticShipments";
  const showStoreAssets = page === "storeAssets";
  elements.productsPage.classList.toggle("hidden", !showProducts);
  elements.shopsPage.classList.toggle("hidden", !showShops);
  elements.storeOrdersPage.classList.toggle("hidden", !showStoreOrders);
  elements.domesticShipmentsPage.classList.toggle("hidden", !showDomesticShipments);
  elements.storeAssetsPage.classList.toggle("hidden", !showStoreAssets);
  elements.productsNavButton.classList.toggle("active", showProducts);
  elements.shopsNavButton.classList.toggle("active", showShops);
  elements.storeOrdersNavButton.classList.toggle("active", showStoreOrders);
  elements.domesticShipmentsNavButton.classList.toggle("active", showDomesticShipments);
  elements.storeAssetsNavButton.classList.toggle("active", showStoreAssets);
  elements.productsNavButton.toggleAttribute("aria-current", showProducts);
  elements.shopsNavButton.toggleAttribute("aria-current", showShops);
  elements.storeOrdersNavButton.toggleAttribute("aria-current", showStoreOrders);
  elements.domesticShipmentsNavButton.toggleAttribute("aria-current", showDomesticShipments);
  elements.storeAssetsNavButton.toggleAttribute("aria-current", showStoreAssets);
  elements.pageTitle.textContent = pageMeta[page].title;
  renderPageTabs();
  if (showShops) loadShops().catch((error) => setShopMessage(error.message, true));
  if (showStoreOrders) {
    loadStoreOrders().catch((error) => setStoreOrderMessage(error.message, true));
    loadSyncLogs().catch(() => {});
  }
  if (showDomesticShipments) loadDomesticShipments().catch((error) => setDomesticShipmentMessage(error.message, true));
  if (showStoreAssets) loadStoreAssets().catch((error) => setStoreAssetMessage(error.message, true));
}
function openProductModal(product = null) {
  elements.form.reset();
  editingId = product?.id || null;
  elements.formTitle.textContent = product ? "编辑产品" : "新增产品";
  elements.modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  elements.collectStatus.textContent = product?.mainImage ? "已有采集资料" : "未采集";
  elements.variantPreview.innerHTML = "";
  elements.fields.mainImage.value = "";
  elements.mainImageUrlInput.value = "";
  elements.manualVariantName.value = "";
  elements.manualVariantPaste.value = "";
  elements.mainImagePreview.removeAttribute("src");
  elements.mainImagePreview.classList.remove("visible");
  elements.mainImageUpload.classList.remove("has-image");
  setVariantOptions([], false);

  if (product) fillForm(product);
  else {
    elements.fields.category.value = "普货";
    updatePreview();
    updateAssetPreview();
  }
  window.setTimeout(() => elements.fields.storeName.focus(), 0);
}

function closeProductModal() {
  editingId = null;
  elements.modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function openShopModal(shop = null) {
  elements.shopForm.reset();
  editingShopId = shop?.id || null;
  elements.shopFormTitle.textContent = shop ? "编辑店铺" : "新增店铺";
  elements.shopModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  setShopMessage("");

  if (shop) {
    elements.shopFields.shopName.value = shop.shop_name || "";
    elements.shopFields.platformType.value = shop.platform || "mercadolibre";
    elements.shopFields.authType.value = shop.auth_type || defaultAuthType(shop.platform);
    elements.shopFields.shopAccount.value = shop.seller_id || "";
    elements.shopFields.noonWarehouseCode.value = shop.warehouse_code || "";
    elements.shopFields.tokenExpiresAt.value = toDateTimeLocal(shop.token_expires_at);
    elements.shopFields.remark.value = "";
    elements.shopMaskedPreview.textContent = `当前密钥：API ${shop.api_key_masked || "未填写"} / Secret ${shop.api_secret_masked || "未填写"} / Access ${shop.access_token_masked || "未填写"} / Refresh ${shop.refresh_token_masked || "未填写"}`;
  } else {
    elements.shopFields.platformType.value = "mercadolibre";
    elements.shopFields.authType.value = "oauth";
    elements.shopFields.noonWarehouseCode.value = "";
    elements.shopMaskedPreview.textContent = "当前密钥：未填写";
  }
  updateShopAuthFields();

  window.setTimeout(() => elements.shopFields.shopName.focus(), 0);
}

function openMercadoLibreBindModal() {
  openShopModal();
  elements.shopFields.platformType.value = "mercadolibre";
  elements.shopFields.authType.value = "oauth";
  elements.shopFields.shopName.value ||= "Mercado Libre";
  updateShopAuthFields();
  window.setTimeout(() => elements.shopFields.apiKey.focus(), 0);
}

function closeShopModal() {
  editingShopId = null;
  elements.shopModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function createEmptyShipmentLine(index = shipmentLines.length, lineType = "box", baseLine = null) {
  const base = baseLine || {};
  return {
    id: `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    lineType,
    boxNo: String(base.boxNo || index + 1),
    productNameZh: "",
    quantity: lineType === "product" ? 1 : "",
    length: base.length || "",
    width: base.width || "",
    height: base.height || "",
    actualWeight: base.actualWeight || "",
    volumeCbm: 0,
    volumeWeight: 0,
    chargeWeight: 0,
    matchedProduct: null,
    productId: "",
    declarationName: "",
    enName: "",
    materialZh: "",
    useZh: "",
    hsCode: "",
    remark: ""
  };
}

function calculateShipmentLine(line) {
  const length = toNumber(line.length);
  const width = toNumber(line.width);
  const height = toNumber(line.height);
  const actualWeight = toNumber(line.actualWeight);
  const volumeCbm = length * width * height / 1000000;
  const volumeWeight = length * width * height / VOLUME_DIVISOR;
  return {
    ...line,
    lineType: line.lineType === "product" ? "product" : "box",
    quantity: line.quantity === "" || line.quantity === undefined ? "" : Math.max(0, toNumber(line.quantity)),
    volumeCbm: round(volumeCbm, 6),
    volumeWeight: round(volumeWeight, 2),
    chargeWeight: round(Math.max(actualWeight, volumeWeight), 2)
  };
}

function findLocalProductMatch(value) {
  const query = String(value || "").trim().replace(/\s+/g, "").toLowerCase();
  if (!query) return null;
  const scored = products.map((product) => {
    const fields = [product.zhName, product.customName, product.declarationName, product.storeName]
      .map((item) => String(item || "").trim().replace(/\s+/g, "").toLowerCase())
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

function applyProductToShipmentLine(line, product) {
  if (!product) {
    return {
      ...line,
      productId: "",
      matchedProduct: null,
      declarationName: line.productNameZh || "",
      enName: "",
      materialZh: "",
      useZh: "",
      hsCode: ""
    };
  }
  return {
    ...line,
    productId: product.id,
    matchedProduct: product,
    declarationName: product.declarationName || product.customName || line.productNameZh,
    enName: product.enName || "",
    materialZh: product.materialZh || "",
    useZh: product.useZh || "",
    hsCode: product.hsCode || ""
  };
}

function syncBoxDataToProductLines(sourceLine) {
  shipmentLines = shipmentLines.map((line) => {
    if (line === sourceLine || line.lineType !== "product" || String(line.boxNo) !== String(sourceLine.boxNo)) return line;
    return {
      ...line,
      length: sourceLine.length,
      width: sourceLine.width,
      height: sourceLine.height,
      actualWeight: sourceLine.actualWeight
    };
  });
}

function updateShipmentSummary() {
  const lines = shipmentLines.map(calculateShipmentLine);
  const boxes = new Map();
  for (const line of lines) {
    const key = String(line.boxNo || "").trim() || line.id;
    if (!boxes.has(key)) boxes.set(key, line);
  }
  const boxLines = [...boxes.values()];
  const totalCbm = boxLines.reduce((sum, line) => sum + toNumber(line.volumeCbm), 0);
  const totalActualWeight = boxLines.reduce((sum, line) => sum + toNumber(line.actualWeight), 0);
  const totalChargeWeight = boxLines.reduce((sum, line) => sum + toNumber(line.chargeWeight), 0);
  elements.domesticShipmentSummary.innerHTML = `
    <span>箱数：${boxLines.length}</span>
    <span>产品：${lines.filter((line) => line.productNameZh).length}</span>
    <span>总 CBM：${round(totalCbm, 6)}</span>
    <span>总实重：${round(totalActualWeight, 3)} kg</span>
    <span>总计费重：${round(totalChargeWeight, 2)} kg</span>
  `;
}

function renderShipmentLines() {
  if (shipmentLines.length === 0) shipmentLines = [createEmptyShipmentLine(0)];
  elements.domesticShipmentLineRows.innerHTML = shipmentLines.map((line, index) => {
    const calculated = calculateShipmentLine(line);
    const isProductLine = calculated.lineType === "product";
    const matchText = calculated.productId
      ? `${calculated.declarationName || calculated.productNameZh} / ${calculated.hsCode || "无编码"}`
      : "未匹配";
    return `
      <tr data-line-index="${index}">
        <td><input class="table-input box-no" data-line-field="boxNo" value="${escapeHtml(calculated.boxNo)}" ${isProductLine ? "readonly" : ""}></td>
        <td><span class="line-type-pill ${isProductLine ? "product" : "box"}">${isProductLine ? "产品" : "箱"}</span></td>
        <td>${isProductLine ? '<span class="same-box-cell">同箱</span>' : `<input class="table-input dim" data-line-field="length" type="number" min="0" step="0.01" value="${escapeHtml(calculated.length)}">`}</td>
        <td>${isProductLine ? '<span class="same-box-cell">同箱</span>' : `<input class="table-input dim" data-line-field="width" type="number" min="0" step="0.01" value="${escapeHtml(calculated.width)}">`}</td>
        <td>${isProductLine ? '<span class="same-box-cell">同箱</span>' : `<input class="table-input dim" data-line-field="height" type="number" min="0" step="0.01" value="${escapeHtml(calculated.height)}">`}</td>
        <td>${isProductLine ? '<span class="same-box-cell">同箱</span>' : `<input class="table-input weight" data-line-field="actualWeight" type="number" min="0" step="0.001" value="${escapeHtml(calculated.actualWeight)}">`}</td>
        <td>${isProductLine ? '<span class="same-box-cell">同箱</span>' : Number(calculated.volumeCbm || 0).toFixed(6)}</td>
        <td>${isProductLine ? '<span class="same-box-cell">同箱</span>' : Number(calculated.chargeWeight || 0).toFixed(2)}</td>
        <td><input class="table-input product-name" data-line-field="productNameZh" value="${escapeHtml(calculated.productNameZh)}" placeholder="${isProductLine ? "输入产品中文名" : "可填箱内主产品"}"></td>
        <td><input class="table-input qty" data-line-field="quantity" type="number" min="0" step="1" value="${escapeHtml(calculated.quantity ?? "")}" placeholder="数量"></td>
        <td><span class="match-pill ${calculated.productId ? "matched" : ""}" title="${escapeHtml(matchText)}">${escapeHtml(matchText)}</span></td>
        <td><button class="ghost-button compact" type="button" data-remove-line="${index}">删除</button></td>
      </tr>
    `;
  }).join("");
  updateShipmentSummary();
}

function openDomesticShipmentModal(shipment = null) {
  elements.domesticShipmentForm.reset();
  editingDomesticShipmentId = shipment?.id || null;
  elements.domesticShipmentFormTitle.textContent = shipment ? "编辑发货单" : "新增发货单";
  elements.domesticShipmentFields.shippedAt.value = toDateOnlyInput(shipment?.shippedAt) || toDateOnlyInput(new Date().toISOString());
  elements.domesticShipmentFields.logisticsProvider.value = shipment?.logisticsProvider || "";
  elements.domesticShipmentFields.logisticsMethod.value = shipment?.logisticsMethod || "air";
  elements.domesticShipmentFields.shipper.value = shipment?.shipper || "";
  elements.domesticShipmentFields.storeName.value = shipment?.storeName || "";
  elements.domesticShipmentFields.trackingNo.value = shipment?.trackingNo || "";
  elements.domesticShipmentFields.customNo.value = shipment?.customNo || shipment?.title || "";
  elements.domesticShipmentFields.platformShipmentNo.value = shipment?.platformShipmentNo || "";
  elements.domesticShipmentFields.status.value = normalizeShipmentStatus(shipment?.status);
  elements.domesticShipmentFields.inspectionStatus.value = normalizeInspectionStatus(shipment?.inspectionStatus);
  elements.domesticShipmentFields.outboundWarehouse.value = shipment?.outboundWarehouse || "";
  elements.domesticShipmentFields.inboundWarehouse.value = shipment?.inboundWarehouse || "";
  shipmentLines = shipment?.lines?.length ? shipment.lines.map((line) => ({ lineType: line.lineType || "box", ...line })) : [createEmptyShipmentLine(0, "box")];
  renderShipmentLines();
  setDomesticShipmentMessage("");
  elements.domesticShipmentModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  window.setTimeout(() => elements.domesticShipmentFields.shippedAt.focus(), 0);
}

function closeDomesticShipmentModal() {
  editingDomesticShipmentId = null;
  shipmentLines = [];
  elements.domesticShipmentModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function getDomesticShipmentPayload() {
  return {
    shippedAt: elements.domesticShipmentFields.shippedAt.value,
    logisticsProvider: elements.domesticShipmentFields.logisticsProvider.value.trim(),
    logisticsMethod: elements.domesticShipmentFields.logisticsMethod.value,
    shipper: elements.domesticShipmentFields.shipper.value.trim(),
    storeName: elements.domesticShipmentFields.storeName.value.trim(),
    trackingNo: elements.domesticShipmentFields.trackingNo.value.trim(),
    customNo: elements.domesticShipmentFields.customNo.value.trim(),
    platformShipmentNo: elements.domesticShipmentFields.platformShipmentNo.value.trim(),
    status: elements.domesticShipmentFields.status.value,
    inspectionStatus: elements.domesticShipmentFields.inspectionStatus.value,
    outboundWarehouse: elements.domesticShipmentFields.outboundWarehouse.value.trim(),
    inboundWarehouse: elements.domesticShipmentFields.inboundWarehouse.value.trim(),
    title: elements.domesticShipmentFields.customNo.value.trim() || elements.domesticShipmentFields.trackingNo.value.trim(),
    lines: shipmentLines.map(calculateShipmentLine)
  };
}

async function saveDomesticShipment() {
  const payload = getDomesticShipmentPayload();
  if (editingDomesticShipmentId) {
    const data = await requestApi(`/api/domestic-shipments/${editingDomesticShipmentId}`, { method: "PUT", body: JSON.stringify(payload) });
    setDomesticShipmentMessage("发货单已更新。");
    closeDomesticShipmentModal();
    await loadDomesticShipments();
    return data.shipment;
  }
  const data = await requestApi("/api/domestic-shipments", { method: "POST", body: JSON.stringify(payload) });
  setDomesticShipmentMessage("发货单已新增。");
  closeDomesticShipmentModal();
  await loadDomesticShipments();
  return data.shipment;
}

function exportDomesticShipment(shipmentId = editingDomesticShipmentId) {
  if (!shipmentId) {
    setDomesticShipmentMessage("请先保存发货单后再导出箱单。", true);
    return;
  }
  window.location.href = `/api/domestic-shipments/${shipmentId}/packing-list`;
}

function parseNoonCredentialJson(text) {
  let credential = null;
  try {
    credential = JSON.parse(text);
  } catch {
    throw new Error("noon 凭证文件不是有效的 JSON");
  }
  const keyId = String(credential.key_id || credential.keyId || "").trim();
  const privateKey = String(credential.private_key || credential.privateKey || "").trim();
  if (!keyId || !privateKey) throw new Error("noon 凭证文件缺少 key_id 或 private_key");
  if (!privateKey.includes("PRIVATE KEY")) throw new Error("noon private_key 格式不正确");
  return { keyId, privateKey, raw: credential };
}

async function readNoonCredentialFile(file) {
  if (!file) return null;
  const text = await file.text();
  return parseNoonCredentialJson(text);
}

async function applyNoonCredentialFile(file) {
  const credential = await readNoonCredentialFile(file);
  if (!credential) return null;
  elements.shopFields.apiKey.value = credential.keyId;
  elements.shopFields.apiSecret.value = credential.privateKey;
  setShopMessage(`noon 凭证已读取：${credential.keyId}`);
  return credential;
}

async function getShopFormInput() {
  const payload = {
    shop_name: elements.shopFields.shopName.value.trim(),
    platform: elements.shopFields.platformType.value,
    seller_id: elements.shopFields.shopAccount.value.trim(),
    warehouse_code: elements.shopFields.noonWarehouseCode.value.trim(),
    auth_type: elements.shopFields.authType.value,
    api_key: elements.shopFields.apiKey.value.trim(),
    api_secret: elements.shopFields.apiSecret.value.trim(),
    access_token: elements.shopFields.accessToken.value.trim(),
    refresh_token: elements.shopFields.refreshToken.value.trim(),
    token_expires_at: fromDateTimeLocal(elements.shopFields.tokenExpiresAt.value),
    remark: elements.shopFields.remark.value.trim()
  };
  const noonFile = elements.shopFields.noonCredentialFile?.files?.[0];
  if (payload.platform === "noon" && noonFile) {
    const credential = await readNoonCredentialFile(noonFile);
    payload.api_key = credential.keyId;
    payload.api_secret = credential.privateKey;
    payload.credential_json = credential.raw;
  }
  return payload;
}

async function saveShop() {
  const payload = await getShopFormInput();
  if (!editingShopId && payload.auth_type === "api_key" && !payload.api_key) throw new Error("新增 API Key 店铺必须填写 API Key");
  if (!editingShopId && payload.auth_type === "oauth" && !payload.access_token && !payload.refresh_token) throw new Error("新增 OAuth 店铺必须填写 Access Token 或 Refresh Token");
  let savedShop = null;
  if (editingShopId) {
    const data = await requestApi(`/api/shops/${editingShopId}`, { method: "PUT", body: JSON.stringify(payload) });
    savedShop = data.shop;
    setShopMessage("店铺已更新。");
  } else {
    const data = await requestApi("/api/shops", { method: "POST", body: JSON.stringify(payload) });
    savedShop = data.shop;
    setShopMessage("店铺已新增。");
  }
  closeShopModal();
  await loadShops();
  return savedShop;
}

async function testShopConnection(shopId = editingShopId) {
  if (!shopId) {
    const savedShop = await saveShop();
    shopId = savedShop?.id;
    if (!shopId) return;
  }
  elements.testShopConnectionButton.disabled = true;
  try {
    const data = await requestApi(`/api/shops/${shopId}/test-connection`, { method: "POST" });
    setShopMessage(data.result?.message || "连接成功。");
    await loadShops();
  } catch (error) {
    setShopMessage(error.message, true);
    await loadShops().catch(() => {});
  } finally {
    elements.testShopConnectionButton.disabled = false;
  }
}

async function refreshShopToken(shopId = editingShopId) {
  if (!shopId) throw new Error("请先保存店铺后再刷新 token");
  elements.refreshShopTokenButton.disabled = true;
  try {
    const data = await requestApi(`/api/shops/${shopId}/refresh-token`, { method: "POST" });
    setShopMessage(data.result?.message || "Token 已刷新。");
    await loadShops();
  } catch (error) {
    setShopMessage(error.message, true);
    await loadShops().catch(() => {});
  } finally {
    elements.refreshShopTokenButton.disabled = false;
  }
}

function updateShopPlatformDefaults() {
  const platform = elements.shopFields.platformType.value;
  if (platform === "mercadolibre") elements.shopFields.authType.value = "oauth";
  if (["noon", "takealot"].includes(platform)) elements.shopFields.authType.value = "api_key";
  updateShopAuthFields();
}

function updateShopAuthFields() {
  const authType = elements.shopFields.authType.value;
  const platform = elements.shopFields.platformType.value;
  document.querySelectorAll("[data-auth-field]").forEach((row) => {
    const allowed = row.dataset.authField.split(/\s+/);
    row.classList.toggle("hidden", !allowed.includes(authType));
  });
  elements.shopFields.noonCredentialRow?.classList.toggle("hidden", platform !== "noon" || authType !== "api_key");
  elements.shopFields.noonWarehouseRow?.classList.toggle("hidden", platform !== "noon");
  elements.refreshShopTokenButton.classList.toggle("hidden", authType !== "oauth");
  elements.startMercadoLibreAuthButton.classList.toggle("hidden", platform !== "mercadolibre" || authType !== "oauth");
}

function defaultAuthType(platform) {
  return platform === "mercadolibre" ? "oauth" : "api_key";
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  return value ? new Date(value).toISOString() : "";
}

function toDateOnlyInput(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

async function startMercadoLibreAuthorization() {
  const payload = await getShopFormInput();
  if (payload.platform !== "mercadolibre") throw new Error("只有 Mercado Libre 店铺需要 OAuth 授权");
  if (!payload.api_key) throw new Error("请先填写 Mercado Libre Client ID / API Key");
  if (!payload.api_secret) throw new Error("请先填写 Mercado Libre Client Secret / API Secret");

  const data = await requestApi("/api/shops/mercadolibre/auth-url", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  window.location.href = data.authUrl;
  setShopMessage(`授权链接已打开。若浏览器拦截弹窗，请复制回调地址到 Mercado Libre 应用：${data.redirectUri}`);
}

function fillForm(product) {
  elements.fields.storeName.value = product.storeName || "";
  elements.fields.customName.value = product.customName || "";
  elements.fields.purchaseUrl.value = product.purchaseUrl || "";
  elements.fields.mainImage.value = product.mainImage || "";
  elements.mainImageUrlInput.value = /^https?:\/\//i.test(product.mainImage || "") ? product.mainImage : "";
  setVariantOptions(product.variants || [], true);
  elements.fields.zhName.value = product.zhName || "";
  elements.fields.materialZh.value = product.materialZh || "";
  elements.fields.useZh.value = product.useZh || "";
  elements.fields.category.value = product.category || "普货";
  elements.fields.hsCodeManual.value = product.hsCode && !/^\u5f85/.test(product.hsCode) ? product.hsCode : "";
  elements.fields.length.value = product.length || "";
  elements.fields.width.value = product.width || "";
  elements.fields.height.value = product.height || "";
  elements.fields.weight.value = product.weight || "";
  elements.fields.price.value = product.price || "";
  updatePreview();
  updateAssetPreview();
}

const productXlsxHeaders = ["\u5e97\u94fa\u540d", "\u81ea\u5b9a\u4e49\u5546\u54c1\u540d", "1688\u91c7\u8d2d\u94fe\u63a5", "\u4e3b\u56fe\u56fe\u7247", "\u4e3b\u56fe\u94fe\u63a5", "\u53d8\u4f53\u4fe1\u606f", "\u4e2d\u6587\u54c1\u540d", "\u4e2d\u6587\u6750\u8d28", "\u4e2d\u6587\u7528\u9014", "\u4ea7\u54c1\u7c7b\u522b", "\u957fcm", "\u5bbdcm", "\u9ad8cm", "\u91cd\u91cfkg", "\u91c7\u8d2d\u4ef7RMB"];
const productExportHeaders = ["\u5e97\u94fa\u540d", "\u4ea7\u54c1\u540d", "1688\u91c7\u8d2d\u94fe\u63a5", "\u4e3b\u56fe\u56fe\u7247", "\u4e3b\u56fe\u94fe\u63a5", "\u53d8\u4f53\u4fe1\u606f", "\u4e2d\u6587\u54c1\u540d", "\u82f1\u6587\u54c1\u540d", "\u4e2d\u6587\u6750\u8d28", "\u82f1\u6587\u6750\u8d28", "\u4e2d\u6587\u7528\u9014", "\u82f1\u6587\u7528\u9014", "\u4ea7\u54c1\u7c7b\u522b", "\u957fcm", "\u5bbdcm", "\u9ad8cm", "\u91cd\u91cfkg", "\u91c7\u8d2d\u4ef7RMB", "\u8ba1\u8d39\u91cdkg", "\u4f53\u79efm3", "\u6d77\u5173\u7f16\u7801"];
const storeInventoryHeaders = ["\u5e97\u94fa\u540d", "\u4ea7\u54c1\u540d", "\u4e2d\u6587\u54c1\u540d", "\u5728\u552e\u6570\u91cf"];
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

function xmlEscapeXlsx(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function xlsxCellRef(colIndex, rowIndex) {
  let col = "";
  let index = colIndex + 1;
  while (index > 0) {
    const mod = (index - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    index = Math.floor((index - mod) / 26);
  }
  return col + (rowIndex + 1);
}

function parseXlsxCellRef(ref) {
  const match = String(ref || "").match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { colIndex: 0, rowIndex: 0 };
  let colIndex = 0;
  for (const char of match[1].toUpperCase()) colIndex = colIndex * 26 + char.charCodeAt(0) - 64;
  return { colIndex: colIndex - 1, rowIndex: Number(match[2]) - 1 };
}

function guessCellRefFromOrder(cellIndex, rowIndex) {
  return xlsxCellRef(cellIndex, rowIndex);
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

const browserCrcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function browserCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = browserCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, item) => sum + item.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function createBrowserZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameBytes = textEncoder.encode(name);
    const bytes = data instanceof Uint8Array ? data : textEncoder.encode(String(data));
    const crc = browserCrc32(bytes);
    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, bytes.length, true);
    localView.setUint32(22, bytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    locals.push(local, bytes);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, bytes.length, true);
    centralView.setUint32(24, bytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centrals.push(central);
    offset += local.length + bytes.length;
  }
  const centralSize = centrals.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return concatBytes([...locals, ...centrals, end]);
}

function normalizeZipPath(baseDir, target) {
  if (!target) return "";
  if (target.startsWith("/")) return target.slice(1);
  const parts = (baseDir + "/" + target).split("/");
  const stack = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

async function inflateRawBytes(bytes) {
  if (typeof DecompressionStream === "undefined") throw new Error("\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u8bfb\u53d6\u538b\u7f29 XLSX\uff0c\u8bf7\u4f7f\u7528\u65b0\u7248 Edge\u3002");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipXlsx(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd === -1) throw new Error("\u4e0d\u662f\u6709\u6548\u7684 XLSX \u6587\u4ef6");
  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const files = new Map();
  for (let entry = 0; entry < entryCount; entry += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("XLSX \u6587\u4ef6\u76ee\u5f55\u635f\u574f");
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = textDecoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : method === 8 ? await inflateRawBytes(compressed) : null;
    if (!data) throw new Error("XLSX \u5305\u542b\u6682\u4e0d\u652f\u6301\u7684\u538b\u7f29\u683c\u5f0f");
    files.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function parseXml(text) {
  return new DOMParser().parseFromString(text, "application/xml");
}

function xmlText(node) {
  return node ? node.textContent || "" : "";
}

function getRelsMap(files, path) {
  const rels = new Map();
  const bytes = files.get(path);
  if (!bytes) return rels;
  const doc = parseXml(textDecoder.decode(bytes));
  for (const rel of [...doc.getElementsByTagNameNS("*", "Relationship")]) {
    rels.set(rel.getAttribute("Id"), rel.getAttribute("Target") || "");
  }
  return rels;
}

function getXlsxMime(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/png";
}

function extractXlsxImages(files, sheetPath) {
  const sheetDir = sheetPath.split("/").slice(0, -1).join("/");
  const sheetName = sheetPath.split("/").pop();
  const sheetRelsPath = sheetDir + "/_rels/" + sheetName + ".rels";
  const sheetRels = getRelsMap(files, sheetRelsPath);
  const drawingTarget = [...sheetRels.values()].find((target) => target.includes("drawing"));
  if (!drawingTarget) return new Map();
  const drawingPath = normalizeZipPath(sheetDir, drawingTarget);
  const drawingBytes = files.get(drawingPath);
  if (!drawingBytes) return new Map();
  const drawingDir = drawingPath.split("/").slice(0, -1).join("/");
  const drawingName = drawingPath.split("/").pop();
  const drawingRels = getRelsMap(files, drawingDir + "/_rels/" + drawingName + ".rels");
  const doc = parseXml(textDecoder.decode(drawingBytes));
  const imagesByRow = new Map();
  const anchors = [...doc.getElementsByTagNameNS("*", "twoCellAnchor"), ...doc.getElementsByTagNameNS("*", "oneCellAnchor")];
  for (const anchor of anchors) {
    const from = anchor.getElementsByTagNameNS("*", "from")[0];
    const blip = anchor.getElementsByTagNameNS("*", "blip")[0];
    if (!from || !blip) continue;
    const row = Number(xmlText(from.getElementsByTagNameNS("*", "row")[0]) || 0);
    const col = Number(xmlText(from.getElementsByTagNameNS("*", "col")[0]) || 0);
    const relId = blip.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed") || blip.getAttribute("r:embed");
    const target = drawingRels.get(relId);
    if (!target) continue;
    const imagePath = normalizeZipPath(drawingDir, target);
    const imageBytes = files.get(imagePath);
    if (!imageBytes) continue;
    const dataUrl = "data:" + getXlsxMime(imagePath) + ";base64," + bytesToBase64(imageBytes);
    if (!imagesByRow.has(row)) imagesByRow.set(row, []);
    imagesByRow.get(row).push({ rowIndex: row, colIndex: col, dataUrl });
  }
  return imagesByRow;
}

async function readXlsxFile(file) {
  const files = await unzipXlsx(file);
  const workbook = files.get("xl/workbook.xml");
  if (!workbook) throw new Error("XLSX \u7f3a\u5c11\u5de5\u4f5c\u7c3f");
  let sheetPath = "xl/worksheets/sheet1.xml";
  const workbookRels = getRelsMap(files, "xl/_rels/workbook.xml.rels");
  const workbookDoc = parseXml(textDecoder.decode(workbook));
  const firstSheet = workbookDoc.getElementsByTagNameNS("*", "sheet")[0];
  const sheetRelId = firstSheet?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || firstSheet?.getAttribute("r:id");
  if (sheetRelId && workbookRels.get(sheetRelId)) sheetPath = normalizeZipPath("xl", workbookRels.get(sheetRelId));
  const sheetBytes = files.get(sheetPath);
  if (!sheetBytes) throw new Error("XLSX \u7f3a\u5c11\u7b2c\u4e00\u4e2a\u5de5\u4f5c\u8868");
  const sharedStrings = [];
  const sharedBytes = files.get("xl/sharedStrings.xml");
  if (sharedBytes) {
    const sharedDoc = parseXml(textDecoder.decode(sharedBytes));
    for (const si of [...sharedDoc.getElementsByTagNameNS("*", "si")]) sharedStrings.push(xmlText(si));
  }
  const sheetDoc = parseXml(textDecoder.decode(sheetBytes));
  const rows = [];
  for (const rowEl of [...sheetDoc.getElementsByTagNameNS("*", "row")]) {
    const rowIndex = Number(rowEl.getAttribute("r") || rows.length + 1) - 1;
    rows[rowIndex] ||= [];
    let cellOrder = 0;
    for (const cellEl of [...rowEl.getElementsByTagNameNS("*", "c")]) {
      const ref = cellEl.getAttribute("r") || guessCellRefFromOrder(cellOrder, rowIndex);
      const { colIndex } = parseXlsxCellRef(ref);
      const type = cellEl.getAttribute("t");
      const v = xmlText(cellEl.getElementsByTagNameNS("*", "v")[0]);
      const text = type === "s" ? sharedStrings[Number(v)] || "" : type === "inlineStr" ? xmlText(cellEl.getElementsByTagNameNS("*", "is")[0]) : v;
      rows[rowIndex][colIndex] = text;
      cellOrder += 1;
    }
  }
  return { rows: rows.map((row) => row || []), imagesByRow: extractXlsxImages(files, sheetPath) };
}

async function collectXlsxImage(src, index) {
  const value = String(src || "").trim();
  if (!value) return null;
  let mime = "image/png";
  let bytes = null;
  const dataMatch = value.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.+)$/i);
  if (dataMatch) {
    mime = dataMatch[1].toLowerCase().replace("image/jpg", "image/jpeg");
    bytes = base64ToBytes(dataMatch[2]);
  } else if (/^https?:\/\//i.test(value)) {
    try {
      const response = await fetch(value);
      if (!response.ok) return null;
      mime = String(response.headers.get("content-type") || "image/png").split(";")[0].toLowerCase();
      bytes = new Uint8Array(await response.arrayBuffer());
    } catch {
      return null;
    }
  }
  if (!bytes) return null;
  const ext = mime.includes("jpeg") ? "jpeg" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "png";
  return { bytes, ext, fileName: "image" + index + "." + ext };
}

async function createXlsxBlob(sheetName, headers, rows, imageColumnIndex = -1) {
  const allRows = [headers, ...rows];
  const images = [];
  if (imageColumnIndex >= 0) {
    let imageIndex = 1;
    for (let rowIndex = 1; rowIndex < allRows.length; rowIndex += 1) {
      const cell = allRows[rowIndex][imageColumnIndex];
      if (!cell || typeof cell !== "object" || cell.type !== "image") continue;
      const image = await collectXlsxImage(cell.src, imageIndex);
      if (!image) continue;
      images.push({ ...image, rowIndex, colIndex: imageColumnIndex, relId: "rId" + imageIndex });
      imageIndex += 1;
    }
  }
  const maxCols = allRows.reduce((max, row) => Math.max(max, row.length), 0);
  const cols = Array.from({ length: maxCols }, (_, index) => '<col min="' + (index + 1) + '" max="' + (index + 1) + '" width="' + (index === imageColumnIndex ? 14 : 18) + '" customWidth="1"/>').join("");
  const sheetData = allRows.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const ref = xlsxCellRef(colIndex, rowIndex);
      if (cell && typeof cell === "object" && cell.type === "image") return '<c r="' + ref + '" t="inlineStr"><is><t></t></is></c>';
      return '<c r="' + ref + '" t="inlineStr"><is><t>' + xmlEscapeXlsx(cell) + '</t></is></c>';
    }).join("");
    return '<row r="' + (rowIndex + 1) + '" ht="' + (rowIndex === 0 ? 24 : 70) + '" customHeight="1">' + cells + '</row>';
  }).join("");
  const sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><cols>' + cols + '</cols><sheetData>' + sheetData + '</sheetData>' + (images.length ? '<drawing r:id="rId1"/>' : '') + '</worksheet>';
  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="webp" ContentType="image/webp"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' + (images.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : '') + '</Types>';
  const workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + xmlEscapeXlsx(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>';
  const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const files = [["[Content_Types].xml", textEncoder.encode(contentTypes)], ["_rels/.rels", textEncoder.encode(rootRels)], ["xl/workbook.xml", textEncoder.encode(workbookXml)], ["xl/_rels/workbook.xml.rels", textEncoder.encode(workbookRels)], ["xl/worksheets/sheet1.xml", textEncoder.encode(sheetXml)]];
  if (images.length) {
    const sheetRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>';
    const anchors = images.map((image, index) => '<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>' + image.colIndex + '</xdr:col><xdr:colOff>45720</xdr:colOff><xdr:row>' + image.rowIndex + '</xdr:row><xdr:rowOff>45720</xdr:rowOff></xdr:from><xdr:to><xdr:col>' + (image.colIndex + 1) + '</xdr:col><xdr:colOff>-45720</xdr:colOff><xdr:row>' + (image.rowIndex + 1) + '</xdr:row><xdr:rowOff>-45720</xdr:rowOff></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="' + (index + 1) + '" name="ProductImage' + (index + 1) + '"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="' + image.relId + '"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor>').join("");
    const drawingXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + anchors + '</xdr:wsDr>';
    const drawingRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + images.map((image) => '<Relationship Id="' + image.relId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/' + image.fileName + '"/>').join("") + '</Relationships>';
    files.push(["xl/worksheets/_rels/sheet1.xml.rels", textEncoder.encode(sheetRels)], ["xl/drawings/drawing1.xml", textEncoder.encode(drawingXml)], ["xl/drawings/_rels/drawing1.xml.rels", textEncoder.encode(drawingRels)]);
    for (const image of images) files.push(["xl/media/" + image.fileName, image.bytes]);
  }
  return new Blob([createBrowserZip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function downloadXlsx(filename, sheetName, headers, rows, imageColumnIndex = -1) {
  const blob = await createXlsxBlob(sheetName, headers, rows, imageColumnIndex);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function downloadTemplate() {
  await downloadXlsx("\u4ea7\u54c1\u6279\u91cf\u4e0a\u4f20\u6a21\u677f.xlsx", "\u4ea7\u54c1\u6a21\u677f", productXlsxHeaders, [["CJ4", "\u6d3e\u5bf9\u793c\u726950ml\u73bb\u7483\u7a7a\u5bb9\u566812pk", "https://detail.1688.com/offer/\u793a\u4f8b.html", "", "", "[]", "\u73bb\u7483\u74f6", "\u73bb\u7483", "\u6536\u7eb3", "\u666e\u8d27", "10", "10", "5", "0.5", "5"]], 3);
}

async function exportCsv() {
  if (products.length === 0) {
    setMessage("\u5f53\u524d\u6ca1\u6709\u53ef\u5bfc\u51fa\u7684\u4ea7\u54c1", true);
    return;
  }
  const rows = products.map((product) => [
    product.storeName, product.customName, product.purchaseUrl || "", { type: "image", src: product.mainImage || "" }, product.mainImage || "", JSON.stringify(product.variants || []),
    product.zhName, product.enName,
    product.materialZh, product.materialEn, product.useZh, product.useEn, product.category,
    product.length, product.width, product.height, product.weight, product.price,
    product.chargeWeight, product.volumeCbm, product.hsCode
  ]);
  await downloadXlsx("\u4ea7\u54c1\u8d44\u6599_" + new Date().toISOString().slice(0, 10) + ".xlsx", "\u4ea7\u54c1\u8d44\u6599", productExportHeaders, rows, 3);
}

function rowsToProducts(rows, imagesByRow = new Map()) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((item) => String(item || "").trim());
  const indexOf = (name) => headers.indexOf(name);
  const headerAliases = {
    "\u81ea\u5b9a\u4e49\u5546\u54c1\u540d": ["\u4ea7\u54c1\u540d", "\u5546\u54c1\u540d"],
    "\u4e3b\u56fe\u94fe\u63a5": ["\u4e3b\u56fe", "\u56fe\u7247\u94fe\u63a5"],
    "\u4e3b\u56fe\u56fe\u7247": ["\u56fe\u7247", "\u4ea7\u54c1\u56fe\u7247"]
  };
  const findIndex = (name) => {
    const exact = indexOf(name);
    if (exact !== -1) return exact;
    for (const alias of headerAliases[name] || []) {
      const index = indexOf(alias);
      if (index !== -1) return index;
    }
    return -1;
  };
  const required = productXlsxHeaders.filter((header) => header !== "\u4e3b\u56fe\u56fe\u7247" && header !== "\u4e3b\u56fe\u94fe\u63a5" && findIndex(header) === -1);
  if (required.length) throw new Error("\u6a21\u677f\u7f3a\u5c11\u5217\uff1a" + required.join("\u3001"));
  const imageColIndex = findIndex("\u4e3b\u56fe\u56fe\u7247") !== -1 ? findIndex("\u4e3b\u56fe\u56fe\u7247") : findIndex("\u4e3b\u56fe\u94fe\u63a5");
  return rows.slice(1)
    .map((row, offset) => ({ row, rowIndex: offset + 1 }))
    .filter(({ row, rowIndex }) => row.some((cell) => String(cell || "").trim()) || imagesByRow.has(rowIndex))
    .map(({ row, rowIndex }) => {
      const rowImages = imagesByRow.get(rowIndex) || [];
      const matchedImage = rowImages.find((image) => image.colIndex === imageColIndex) || rowImages[0];
      const linkIndex = findIndex("\u4e3b\u56fe\u94fe\u63a5");
      return {
        storeName: row[findIndex("\u5e97\u94fa\u540d")] || "",
        customName: row[findIndex("\u81ea\u5b9a\u4e49\u5546\u54c1\u540d")] || "",
        purchaseUrl: row[findIndex("1688\u91c7\u8d2d\u94fe\u63a5")] || "",
        mainImage: matchedImage?.dataUrl || (linkIndex >= 0 ? row[linkIndex] : "") || "",
        variants: row[findIndex("\u53d8\u4f53\u4fe1\u606f")] || "",
        zhName: row[findIndex("\u4e2d\u6587\u54c1\u540d")] || "",
        materialZh: row[findIndex("\u4e2d\u6587\u6750\u8d28")] || "",
        useZh: row[findIndex("\u4e2d\u6587\u7528\u9014")] || "",
        category: row[findIndex("\u4ea7\u54c1\u7c7b\u522b")] || "\u666e\u8d27",
        length: row[findIndex("\u957fcm")] || "",
        width: row[findIndex("\u5bbdcm")] || "",
        height: row[findIndex("\u9ad8cm")] || "",
        weight: row[findIndex("\u91cd\u91cfkg")] || "",
        price: row[findIndex("\u91c7\u8d2d\u4ef7RMB")] || ""
      };
    });
}

async function importCsvFile(file) {
  if (!file) return;
  try {
    if (!/\.xlsx$/i.test(file.name)) throw new Error("\u8bf7\u4e0a\u4f20 XLSX \u6587\u4ef6");
    const { rows, imagesByRow } = await readXlsxFile(file);
    const importedProducts = rowsToProducts(rows, imagesByRow);
    if (!importedProducts.length) throw new Error("XLSX \u91cc\u6ca1\u6709\u4ea7\u54c1\u6570\u636e");
    const imageCount = importedProducts.filter((product) => product.mainImage && product.mainImage.startsWith("data:image/")).length;
    const confirmed = window.confirm("\u5c06\u5bfc\u5165 " + importedProducts.length + " \u4e2a\u4ea7\u54c1" + (imageCount ? "\uff0c\u5176\u4e2d " + imageCount + " \u4e2a\u5e26\u590d\u5236/\u7c98\u8d34\u56fe\u7247" : "") + "\uff0c\u6d77\u5173\u7f16\u7801\u4f1a\u6839\u636e\u4e2d\u6587\u54c1\u540d\u81ea\u52a8\u751f\u6210\u3002\u662f\u5426\u7ee7\u7eed\uff1f");
    if (!confirmed) return;
    const data = await requestApi("/api/products/batch", { method: "POST", body: JSON.stringify({ products: importedProducts }) });
    await loadProducts();
    setMessage("\u5df2\u6279\u91cf\u5bfc\u5165 " + data.count + " \u4e2a\u4ea7\u54c1\uff0c\u6d77\u5173\u7f16\u7801\u5df2\u81ea\u52a8\u5339\u914d\u3002");
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    elements.batchFileInput.value = "";
  }
}

async function downloadStoreInventoryTemplate() {
  await downloadXlsx("\u5728\u552e\u5e93\u5b58\u5bfc\u5165\u6a21\u677f.xlsx", "\u5728\u552e\u5e93\u5b58", storeInventoryHeaders, [
    ["KJ4", "\u6d3e\u5bf9\u793c\u726950ml\u73bb\u7483\u7a7a\u5bb9\u566812pk", "\u73bb\u7483\u74f6", "100"]
  ]);
}

function rowsToStoreInventory(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((item) => String(item || "").trim());
  const indexOf = (name) => headers.indexOf(name);
  const required = storeInventoryHeaders.filter((header) => indexOf(header) === -1);
  if (required.length) throw new Error("\u6a21\u677f\u7f3a\u5c11\u5217\uff1a" + required.join("\u3001"));
  return rows.slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => ({
      storeName: row[indexOf("\u5e97\u94fa\u540d")] || "",
      productName: row[indexOf("\u4ea7\u54c1\u540d")] || "",
      zhName: row[indexOf("\u4e2d\u6587\u54c1\u540d")] || "",
      quantity: row[indexOf("\u5728\u552e\u6570\u91cf")] || ""
    }))
    .filter((row) => (row.productName || row.zhName) && toNumber(row.quantity) > 0);
}

async function importStoreInventoryFile(file) {
  if (!file) return;
  try {
    if (!/\.xlsx$/i.test(file.name)) throw new Error("\u8bf7\u4e0a\u4f20 XLSX \u6587\u4ef6");
    const { rows } = await readXlsxFile(file);
    const items = rowsToStoreInventory(rows);
    if (!items.length) throw new Error("XLSX \u91cc\u6ca1\u6709\u6709\u6548\u7684\u5728\u552e\u5e93\u5b58");
    const confirmed = window.confirm("\u5c06\u5bfc\u5165 " + items.length + " \u6761\u5728\u552e\u5e93\u5b58\uff0c\u540c\u4e00\u6b21\u4e0a\u4f20\u4f1a\u8986\u76d6\u4e4b\u524d\u8868\u683c\u5bfc\u5165\u7684\u5728\u552e\u6570\u636e\u3002\u662f\u5426\u7ee7\u7eed\uff1f");
    if (!confirmed) return;
    const data = await requestApi("/api/store-assets/in-stock", { method: "POST", body: JSON.stringify({ items }) });
    storeAssets = data.assets;
    renderStoreAssets();
    setStoreAssetMessage("\u5df2\u5bfc\u5165 " + data.count + " \u6761\u5728\u552e\u5e93\u5b58\u3002");
  } catch (error) {
    setStoreAssetMessage(error.message, true);
  } finally {
    elements.storeInventoryFileInput.value = "";
  }
}

async function importFbnReportFile(file) {
  if (!file) return;
  try {
    if (!/\.xlsx$/i.test(file.name)) throw new Error("请上传 XLSX 文件");
    setStoreOrderMessage("正在导入 FBN 报表...");
    const { rows } = await readXlsxFile(file);
    const data = await requestApi("/api/store-orders/import-fbn-report", {
      method: "POST",
      body: JSON.stringify({ rows })
    });
    setStoreOrderMessage(`FBN 报表导入完成：新增/更新 ${data.count || 0} 单，明细 ${data.itemCount || 0} 条。`);
    await loadStoreOrders();
    await loadSyncLogs();
  } catch (error) {
    setStoreOrderMessage(error.message, true);
  } finally {
    elements.fbnReportFileInput.value = "";
  }
}

Object.values(elements.fields).forEach((field) => {
  field.addEventListener("input", schedulePreviewUpdate);
  field.addEventListener("change", schedulePreviewUpdate);
});

elements.fields.mainImage.addEventListener("input", updateAssetPreview);
elements.fields.variantsJson.addEventListener("input", updateAssetPreview);
elements.mainImageUrlInput.addEventListener("input", () => {
  setMainImage(elements.mainImageUrlInput.value.trim());
});
elements.mainImageFile.addEventListener("change", () => {
  handleImageFile(elements.mainImageFile.files[0]);
  elements.mainImageFile.value = "";
});
elements.clearImageButton.addEventListener("click", () => {
  elements.mainImageUrlInput.value = "";
  setMainImage("");
  elements.collectStatus.textContent = "主图已清除";
});
elements.mainImageUpload.addEventListener("paste", (event) => {
  const file = [...event.clipboardData.files].find((item) => item.type.startsWith("image/"));
  if (!file) return;
  event.preventDefault();
  event.stopPropagation();
  handleImageFile(file);
});
elements.modal.addEventListener("paste", (event) => {
  const file = [...event.clipboardData.files].find((item) => item.type.startsWith("image/"));
  if (!file) return;
  event.preventDefault();
  handleImageFile(file);
});
elements.manualVariantButton.addEventListener("click", importManualVariants);
elements.manualVariantName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    importManualVariants();
  }
});
elements.variantDropdown.addEventListener("change", (event) => {
  const checkbox = event.target.closest("input[type='checkbox']");
  if (!checkbox) return;
  if (checkbox.checked) selectedVariantNames.add(checkbox.value);
  else selectedVariantNames.delete(checkbox.value);
  syncVariantsJson();
  renderVariantDropdown();
  updateAssetPreview();
  schedulePreviewUpdate();
});
elements.variantDropdown.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-variant]");
  if (!button) return;
  event.preventDefault();
  removeVariant(button.dataset.removeVariant);
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.loginMessage.textContent = "";
  try {
    const data = await requestApi("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: elements.loginUsername.value, password: elements.loginPassword.value })
    });
    showApp(data.user);
    switchPage(activePage, { addTab: false });
    await loadProducts();
  } catch (error) {
    elements.loginMessage.textContent = error.message;
  }
});

elements.logoutButton.addEventListener("click", async () => {
  await requestApi("/api/logout", { method: "POST" }).catch(() => {});
  showLogin();
});

elements.productsNavButton.addEventListener("click", () => switchPage("products"));
elements.shopsNavButton.addEventListener("click", () => switchPage("shops"));
elements.storeOrdersNavButton.addEventListener("click", () => switchPage("storeOrders"));
elements.domesticShipmentsNavButton.addEventListener("click", () => switchPage("domesticShipments"));
elements.storeAssetsNavButton.addEventListener("click", () => switchPage("storeAssets"));
elements.pageTabs.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-page-tab]");
  if (closeButton) {
    event.stopPropagation();
    closePageTab(closeButton.dataset.closePageTab);
    return;
  }
  const tabButton = event.target.closest("[data-page-tab]");
  if (tabButton) switchPage(tabButton.dataset.pageTab, { addTab: false });
});
elements.shipmentStatusTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-shipment-status-tab]");
  if (!button) return;
  activeShipmentStatusFilter = activeShipmentStatusFilter === button.dataset.shipmentStatusTab ? "" : button.dataset.shipmentStatusTab;
  renderDomesticShipments();
});
elements.shipmentSearchButton.addEventListener("click", renderDomesticShipments);
elements.shipmentResetButton.addEventListener("click", () => {
  Object.values(elements.shipmentFilters).forEach((field) => { field.value = ""; });
  activeShipmentStatusFilter = "";
  renderDomesticShipments();
});
Object.values(elements.shipmentFilters).forEach((field) => {
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter") renderDomesticShipments();
  });
  field.addEventListener("change", renderDomesticShipments);
});
elements.assetSearchButton.addEventListener("click", renderStoreAssets);
elements.assetResetButton.addEventListener("click", () => {
  Object.values(elements.assetFilters).forEach((field) => { field.value = ""; });
  renderStoreAssets();
});
Object.values(elements.assetFilters).forEach((field) => {
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter") renderStoreAssets();
  });
});
elements.downloadStoreInventoryTemplateButton.addEventListener("click", downloadStoreInventoryTemplate);
elements.storeInventoryFileInput.addEventListener("change", () => importStoreInventoryFile(elements.storeInventoryFileInput.files[0]));
elements.fbnReportFileInput.addEventListener("change", () => importFbnReportFile(elements.fbnReportFileInput.files[0]));
elements.viewOrderSyncLogsButton.addEventListener("click", async () => {
  await loadSyncLogs();
  elements.syncLogRows.closest(".sub-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
});
elements.orderSearchButton.addEventListener("click", loadStoreOrders);
elements.orderResetButton.addEventListener("click", () => {
  Object.values(elements.orderFilters).forEach((field) => { field.value = ""; });
  loadStoreOrders();
});
Object.values(elements.orderFilters).forEach((field) => {
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter") loadStoreOrders();
  });
  field.addEventListener("change", loadStoreOrders);
});
elements.newProductButton.addEventListener("click", () => openProductModal());
elements.newShopButton.addEventListener("click", () => openShopModal());
elements.bindMercadoLibreButton?.addEventListener("click", () => openMercadoLibreBindModal());
elements.newDomesticShipmentButton.addEventListener("click", async () => {
  if (!products.length) await loadProducts().catch(() => {});
  openDomesticShipmentModal();
});
elements.closeModalButton.addEventListener("click", closeProductModal);
elements.closeShopModalButton.addEventListener("click", closeShopModal);
elements.closeDomesticShipmentModalButton.addEventListener("click", closeDomesticShipmentModal);
elements.cancelEditButton.addEventListener("click", closeProductModal);
elements.cancelShopButton.addEventListener("click", closeShopModal);
elements.cancelDomesticShipmentButton.addEventListener("click", closeDomesticShipmentModal);
elements.modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) closeProductModal();
});
elements.shopModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-shop-modal]")) closeShopModal();
});
elements.domesticShipmentModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-domestic-shipment-modal]")) closeDomesticShipmentModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.modal.classList.contains("hidden")) closeProductModal();
  if (event.key === "Escape" && !elements.shopModal.classList.contains("hidden")) closeShopModal();
  if (event.key === "Escape" && !elements.domesticShipmentModal.classList.contains("hidden")) closeDomesticShipmentModal();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getFormInput();
  try {
    if (editingId) {
      await requestApi(`/api/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      setMessage("产品已更新。");
    } else {
      await requestApi("/api/products", { method: "POST", body: JSON.stringify(payload) });
      setMessage("产品已保存。");
    }
    closeProductModal();
    await loadProducts();
  } catch (error) {
    setMessage(error.message, true);
  }
});

elements.shopForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await saveShop();
  } catch (error) {
    setShopMessage(error.message, true);
  }
});

elements.domesticShipmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await saveDomesticShipment();
  } catch (error) {
    setDomesticShipmentMessage(error.message, true);
  }
});

elements.addDomesticShipmentBoxButton.addEventListener("click", () => {
  const nextBoxNo = String(new Set(shipmentLines.map((line) => String(line.boxNo || "").trim()).filter(Boolean)).size + 1);
  shipmentLines.push(createEmptyShipmentLine(shipmentLines.length, "box", { boxNo: nextBoxNo }));
  renderShipmentLines();
});

elements.addDomesticShipmentProductButton.addEventListener("click", () => {
  const baseLine = [...shipmentLines].reverse().find((line) => line.lineType !== "product") || shipmentLines[shipmentLines.length - 1];
  if (!baseLine) {
    shipmentLines.push(createEmptyShipmentLine(0, "box"));
  } else {
    shipmentLines.push(createEmptyShipmentLine(shipmentLines.length, "product", calculateShipmentLine(baseLine)));
  }
  renderShipmentLines();
});

elements.exportDomesticShipmentButton.addEventListener("click", () => exportDomesticShipment());

elements.domesticShipmentLineRows.addEventListener("change", (event) => {
  const input = event.target.closest("[data-line-field]");
  if (!input) return;
  const row = input.closest("tr[data-line-index]");
  const index = Number(row?.dataset.lineIndex);
  if (!Number.isInteger(index) || !shipmentLines[index]) return;
  const field = input.dataset.lineField;
  shipmentLines[index] = { ...shipmentLines[index], [field]: input.value };
  if (field === "productNameZh") {
    shipmentLines[index] = applyProductToShipmentLine(shipmentLines[index], findLocalProductMatch(input.value));
  }
  shipmentLines[index] = calculateShipmentLine(shipmentLines[index]);
  if (shipmentLines[index].lineType !== "product" && ["boxNo", "length", "width", "height", "actualWeight"].includes(field)) {
    syncBoxDataToProductLines(shipmentLines[index]);
  }
  if (field !== "boxNo") renderShipmentLines();
  else updateShipmentSummary();
});

elements.domesticShipmentLineRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-line]");
  if (!button) return;
  const index = Number(button.dataset.removeLine);
  shipmentLines.splice(index, 1);
  if (!shipmentLines.length) shipmentLines.push(createEmptyShipmentLine(0));
  renderShipmentLines();
});

elements.shopFields.platformType.addEventListener("change", updateShopPlatformDefaults);
elements.shopFields.authType.addEventListener("change", updateShopAuthFields);
elements.shopFields.noonCredentialFile?.addEventListener("change", async () => {
  try {
    const file = elements.shopFields.noonCredentialFile.files?.[0];
    if (!file) return;
    await applyNoonCredentialFile(file);
  } catch (error) {
    setShopMessage(error.message, true);
  }
});

elements.testShopConnectionButton.addEventListener("click", async () => {
  try {
    await testShopConnection(editingShopId);
  } catch (error) {
    setShopMessage(error.message, true);
  }
});

elements.refreshShopTokenButton.addEventListener("click", async () => {
  try {
    await refreshShopToken(editingShopId);
  } catch (error) {
    setShopMessage(error.message, true);
  }
});

elements.startMercadoLibreAuthButton.addEventListener("click", async () => {
  try {
    await startMercadoLibreAuthorization();
  } catch (error) {
    setShopMessage(error.message, true);
  }
});

elements.productRows.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.id);
  if (!product) return;
  if (button.dataset.action === "edit") {
    openProductModal(product);
    return;
  }
  if (button.dataset.action === "delete") {
    if (!window.confirm(`确认删除产品「${product.declarationName}」吗？`)) return;
    try {
      await requestApi(`/api/products/${product.id}`, { method: "DELETE" });
      await loadProducts();
      setMessage("产品已删除。");
    } catch (error) {
      setMessage(error.message, true);
    }
  }
});

elements.shopRows.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-shop-action]");
  if (!button) return;
  const shop = shops.find((item) => item.id === button.dataset.id);
  if (!shop) return;

  if (button.dataset.shopAction === "edit") {
    openShopModal(shop);
    return;
  }

  if (button.dataset.shopAction === "test") {
    try {
      setShopMessage("正在测试连接...");
      const data = await requestApi(`/api/shops/${shop.id}/test-connection`, { method: "POST" });
      setShopMessage(data.result?.message || "连接成功。");
      await loadShops();
    } catch (error) {
      setShopMessage(error.message, true);
      await loadShops().catch(() => {});
    }
    return;
  }

  if (button.dataset.shopAction === "refresh") {
    try {
      setShopMessage("正在刷新 token...");
      const data = await requestApi(`/api/shops/${shop.id}/refresh-token`, { method: "POST" });
      setShopMessage(data.result?.message || "Token 已刷新。");
      await loadShops();
    } catch (error) {
      setShopMessage(error.message, true);
      await loadShops().catch(() => {});
    }
    return;
  }

  if (button.dataset.shopAction === "delete") {
    if (!window.confirm(`确认删除店铺「${shop.shop_name}」吗？密钥绑定会一起停用。`)) return;
    try {
      await requestApi(`/api/shops/${shop.id}`, { method: "DELETE" });
      setShopMessage("店铺已删除。");
      await loadShops();
    } catch (error) {
      setShopMessage(error.message, true);
    }
  }
});

elements.domesticShipmentRows.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-shipment-action]");
  if (!button) return;
  const shipmentId = button.dataset.id;

  if (button.dataset.shipmentAction === "export") {
    exportDomesticShipment(shipmentId);
    return;
  }

  if (button.dataset.shipmentAction === "edit") {
    try {
      if (!products.length) await loadProducts().catch(() => {});
      const data = await requestApi(`/api/domestic-shipments/${shipmentId}`);
      openDomesticShipmentModal(data.shipment);
    } catch (error) {
      setDomesticShipmentMessage(error.message, true);
    }
    return;
  }

  if (button.dataset.shipmentAction === "delete") {
    if (!window.confirm("确认删除这个发货单吗？")) return;
    try {
      await requestApi(`/api/domestic-shipments/${shipmentId}`, { method: "DELETE" });
      setDomesticShipmentMessage("发货单已删除。");
      await loadDomesticShipments();
    } catch (error) {
      setDomesticShipmentMessage(error.message, true);
    }
  }
});

elements.searchInput.addEventListener("input", () => {
  window.clearTimeout(elements.searchInput.searchTimer);
  elements.searchInput.searchTimer = window.setTimeout(loadProducts, 250);
});

elements.exportButton.addEventListener("click", exportCsv);
elements.downloadTemplateButton.addEventListener("click", downloadTemplate);
elements.batchFileInput.addEventListener("change", () => importCsvFile(elements.batchFileInput.files[0]));
elements.collect1688Button.addEventListener("click", collect1688);
elements.clearProductsButton?.addEventListener("click", () => setMessage("系统暂不提供一键清空，请逐条删除，避免误删。", true));

async function boot() {
  try {
    const data = await requestApi("/api/me");
    showApp(data.user);
    switchPage(activePage, { addTab: false });
    await loadProducts();
    await loadShops();
    await loadStoreOrders();
    await loadSyncLogs();
    await loadDomesticShipments();
  } catch {
    showLogin();
  }
}

boot();
