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
  domesticShipmentsPage: document.querySelector("#domesticShipmentsPage"),
  productsNavButton: document.querySelector("#productsNavButton"),
  shopsNavButton: document.querySelector("#shopsNavButton"),
  domesticShipmentsNavButton: document.querySelector("#domesticShipmentsNavButton"),
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
  mainImagePreview: document.querySelector("#mainImagePreview"),
  collectStatus: document.querySelector("#collectStatus"),
  variantPreview: document.querySelector("#variantPreview"),
  variantDropdownButton: document.querySelector("#variantDropdownButton"),
  variantDropdown: document.querySelector("#variantDropdown"),
  variantSummary: document.querySelector("#variantSummary"),
  logoutButton: document.querySelector("#logoutButton"),
  clearProductsButton: document.querySelector("#clearProductsButton"),
  searchInput: document.querySelector("#searchInput"),
  productRows: document.querySelector("#productRows"),
  shopRows: document.querySelector("#shopRows"),
  domesticShipmentRows: document.querySelector("#domesticShipmentRows"),
  domesticShipmentLineRows: document.querySelector("#domesticShipmentLineRows"),
  domesticShipmentSummary: document.querySelector("#domesticShipmentSummary"),
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
    apiKey: document.querySelector("#shopApiKey"),
    apiSecret: document.querySelector("#shopApiSecret"),
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
    platformShipmentNo: document.querySelector("#domesticShipmentPlatformShipmentNo")
  },
  output: {
    generatedEnName: document.querySelector("#generatedEnName"),
    hsCode: document.querySelector("#hsCode"),
    chargeWeight: document.querySelector("#chargeWeight"),
    volume: document.querySelector("#volume"),
    useEn: document.querySelector("#useEn"),
    materialEn: document.querySelector("#materialEn"),
    declarationName: document.querySelector("#declarationName"),
    categoryPreview: document.querySelector("#categoryPreview")
  }
};

let products = [];
let shops = [];
let domesticShipments = [];
let shipmentLines = [];
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
    const detail = Array.isArray(data.errors) ? `：${data.errors.map((item) => `第${item.row}行 ${item.error}`).join("；")}` : "";
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
  elements.variantSummary.textContent = collectedVariants.length ? `已选择 ${count}/${collectedVariants.length} 个变体` : "未采集变体";
  if (!collectedVariants.length) {
    elements.variantDropdown.innerHTML = `<p class="variant-empty">采集后会显示可选型号</p>`;
    return;
  }
  elements.variantDropdown.innerHTML = collectedVariants.map((variant, index) => `
    <label class="variant-option">
      <input type="checkbox" value="${escapeHtml(variant.name)}" ${selectedVariantNames.has(variant.name) ? "checked" : ""}>
      ${variant.image ? `<img src="${escapeHtml(variant.image)}" alt="">` : ""}
      <span>${escapeHtml(variant.name)}</span>
    </label>
  `).join("");
}

function updateAssetPreview() {
  const mainImage = elements.fields.mainImage.value.trim();
  elements.mainImagePreview.src = mainImage;
  elements.mainImagePreview.classList.toggle("visible", Boolean(mainImage));
  const variants = parseVariantsInput();
  elements.variantPreview.innerHTML = variants.slice(0, 12).map((variant) => `
    <span class="variant-chip">
      ${variant.image ? `<img src="${escapeHtml(variant.image)}" alt="">` : ""}
      ${escapeHtml(variant.name || "未命名")}
    </span>
  `).join("");
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
    if (collected.mainImage) elements.fields.mainImage.value = collected.mainImage;
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
  elements.output.declarationName.textContent = generated.declarationName;
  elements.output.categoryPreview.textContent = generated.category || "普货";
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

async function loadDomesticShipments() {
  const data = await requestApi("/api/domestic-shipments");
  domesticShipments = data.shipments;
  renderDomesticShipments();
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

function renderDomesticShipments() {
  if (domesticShipments.length === 0) {
    elements.domesticShipmentRows.innerHTML = '<tr class="empty-row"><td colspan="11">暂无发货单</td></tr>';
    return;
  }

  elements.domesticShipmentRows.innerHTML = domesticShipments.map((shipment) => `
    <tr>
      <td>${escapeHtml(formatDateOnly(shipment.shippedAt))}</td>
      <td>${escapeHtml(shipment.storeName || "-")}</td>
      <td>${escapeHtml(shipment.logisticsProvider || "-")}</td>
      <td>${escapeHtml(shipment.logisticsMethod === "sea" ? "海运" : "空运")}</td>
      <td>${escapeHtml(shipment.trackingNo || shipment.customNo || shipment.platformShipmentNo || "-")}</td>
      <td>${Number(shipment.boxCount || 0)}</td>
      <td>${Number(shipment.productCount || 0)}</td>
      <td>${Number(shipment.totalCbm || 0).toFixed(6)}</td>
      <td>${Number(shipment.totalChargeWeight || 0).toFixed(2)} kg</td>
      <td>${escapeHtml(formatDateTime(shipment.updatedAt))}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-shipment-action="export" data-id="${shipment.id}">导出</button>
          <button type="button" data-shipment-action="edit" data-id="${shipment.id}">编辑</button>
          <button type="button" data-shipment-action="delete" data-id="${shipment.id}">删除</button>
        </div>
      </td>
    </tr>
  `).join("");
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
      <td><span class="status-pill ${statusClass(shop.status)}">${escapeHtml(statusLabel(shop.status))}</span></td>
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

function statusClass(status) {
  if (status === "connected") return "connected";
  if (status === "failed") return "failed";
  return "pending";
}

function statusLabel(status) {
  return ({ disconnected: "未连接", connected: "已连接", failed: "连接失败" })[status] || "未连接";
}

function platformLabel(platform) {
  return ({ mercadolibre: "Mercado Libre", noon: "noon", takealot: "takealot" })[platform] || platform;
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

function setDomesticShipmentMessage(message, isError = false) {
  elements.domesticShipmentMessage.textContent = message;
  elements.domesticShipmentMessage.classList.toggle("error", isError);
}

function switchPage(page) {
  const showProducts = page === "products";
  const showShops = page === "shops";
  const showDomesticShipments = page === "domesticShipments";
  elements.productsPage.classList.toggle("hidden", !showProducts);
  elements.shopsPage.classList.toggle("hidden", !showShops);
  elements.domesticShipmentsPage.classList.toggle("hidden", !showDomesticShipments);
  elements.productsNavButton.classList.toggle("active", showProducts);
  elements.shopsNavButton.classList.toggle("active", showShops);
  elements.domesticShipmentsNavButton.classList.toggle("active", showDomesticShipments);
  elements.productsNavButton.toggleAttribute("aria-current", showProducts);
  elements.shopsNavButton.toggleAttribute("aria-current", showShops);
  elements.domesticShipmentsNavButton.toggleAttribute("aria-current", showDomesticShipments);
  elements.pageTitle.textContent = showShops ? "店铺管理" : showDomesticShipments ? "国内发货" : "产品库";
  if (showShops) loadShops().catch((error) => setShopMessage(error.message, true));
  if (showDomesticShipments) loadDomesticShipments().catch((error) => setDomesticShipmentMessage(error.message, true));
}

function openProductModal(product = null) {
  elements.form.reset();
  editingId = product?.id || null;
  elements.formTitle.textContent = product ? "编辑产品" : "新增产品";
  elements.modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  elements.collectStatus.textContent = product?.mainImage ? "已有采集资料" : "未采集";
  elements.variantPreview.innerHTML = "";
  elements.mainImagePreview.removeAttribute("src");
  elements.mainImagePreview.classList.remove("visible");
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
    elements.shopFields.tokenExpiresAt.value = toDateTimeLocal(shop.token_expires_at);
    elements.shopFields.remark.value = "";
    elements.shopMaskedPreview.textContent = `当前密钥：API ${shop.api_key_masked || "未填写"} / Secret ${shop.api_secret_masked || "未填写"} / Access ${shop.access_token_masked || "未填写"} / Refresh ${shop.refresh_token_masked || "未填写"}`;
  } else {
    elements.shopFields.platformType.value = "mercadolibre";
    elements.shopFields.authType.value = "oauth";
    elements.shopMaskedPreview.textContent = "当前密钥：未填写";
  }
  updateShopAuthFields();

  window.setTimeout(() => elements.shopFields.shopName.focus(), 0);
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
    title: elements.domesticShipmentFields.customNo.value.trim() || elements.domesticShipmentFields.trackingNo.value.trim(),
    status: "draft",
    lines: shipmentLines.map(calculateShipmentLine)
  };
}

async function saveDomesticShipment() {
  const payload = getDomesticShipmentPayload();
  if (!payload.logisticsProvider) throw new Error("请填写物流商");
  if (!payload.logisticsMethod) throw new Error("请选择物流方式");
  if (!payload.shipper) throw new Error("请填写发货人");
  if (!payload.storeName) throw new Error("请填写店铺名");
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

function getShopFormInput() {
  return {
    shop_name: elements.shopFields.shopName.value.trim(),
    platform: elements.shopFields.platformType.value,
    seller_id: elements.shopFields.shopAccount.value.trim(),
    auth_type: elements.shopFields.authType.value,
    api_key: elements.shopFields.apiKey.value.trim(),
    api_secret: elements.shopFields.apiSecret.value.trim(),
    access_token: elements.shopFields.accessToken.value.trim(),
    refresh_token: elements.shopFields.refreshToken.value.trim(),
    token_expires_at: fromDateTimeLocal(elements.shopFields.tokenExpiresAt.value),
    remark: elements.shopFields.remark.value.trim()
  };
}

async function saveShop() {
  const payload = getShopFormInput();
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
  const payload = getShopFormInput();
  if (payload.platform !== "mercadolibre") throw new Error("只有 Mercado Libre 店铺需要 OAuth 授权");
  if (!payload.api_key) throw new Error("请先填写 Mercado Libre Client ID / API Key");
  if (!payload.api_secret) throw new Error("请先填写 Mercado Libre Client Secret / API Secret");

  const data = await requestApi("/api/shops/mercadolibre/auth-url", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  window.open(data.authUrl, "_blank", "noopener,noreferrer");
  setShopMessage(`授权链接已打开。若浏览器拦截弹窗，请复制回调地址到 Mercado Libre 应用：${data.redirectUri}`);
}

function fillForm(product) {
  elements.fields.storeName.value = product.storeName || "";
  elements.fields.customName.value = product.customName || "";
  elements.fields.purchaseUrl.value = product.purchaseUrl || "";
  elements.fields.mainImage.value = product.mainImage || "";
  setVariantOptions(product.variants || [], true);
  elements.fields.zhName.value = product.zhName || "";
  elements.fields.materialZh.value = product.materialZh || "";
  elements.fields.useZh.value = product.useZh || "";
  elements.fields.category.value = product.category || "普货";
  elements.fields.length.value = product.length || "";
  elements.fields.width.value = product.width || "";
  elements.fields.height.value = product.height || "";
  elements.fields.weight.value = product.weight || "";
  elements.fields.price.value = product.price || "";
  updatePreview();
  updateAssetPreview();
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadTemplate() {
  downloadCsv("产品批量上传模板.csv", [
    csvHeaders,
    ["CJ4", "派对礼物50ml玻璃空容器12pk", "https://detail.1688.com/offer/示例.html", "", "[]", "玻璃瓶", "玻璃", "收纳", "普货", "10", "10", "5", "0.5", "5"]
  ]);
}

function exportCsv() {
  if (products.length === 0) {
    setMessage("当前没有可导出的产品", true);
    return;
  }
  const headers = ["店铺名", "产品名", "1688采购链接", "主图链接", "变体信息", "申报名称", "中文品名", "英文品名", "中文材质", "英文材质", "中文用途", "英文用途", "产品类别", "长cm", "宽cm", "高cm", "重量kg", "采购价RMB", "计费重kg", "体积m3", "海关编码"];
  const rows = products.map((product) => [
    product.storeName, product.customName, product.purchaseUrl || "", product.mainImage || "", JSON.stringify(product.variants || []),
    product.declarationName, product.zhName, product.enName,
    product.materialZh, product.materialEn, product.useZh, product.useEn, product.category,
    product.length, product.width, product.height, product.weight, product.price,
    product.chargeWeight, product.volumeCbm, product.hsCode
  ]);
  downloadCsv(`产品资料_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const content = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function rowsToProducts(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((item) => item.trim());
  const indexOf = (name) => headers.indexOf(name);
  const required = csvHeaders.filter((header) => indexOf(header) === -1);
  if (required.length) throw new Error(`模板缺少列：${required.join("、")}`);
  return rows.slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => ({
      storeName: row[indexOf("店铺名")] || "",
      customName: row[indexOf("自定义商品名")] || "",
      purchaseUrl: row[indexOf("1688采购链接")] || "",
      mainImage: row[indexOf("主图链接")] || "",
      variants: row[indexOf("变体信息")] || "",
      zhName: row[indexOf("中文品名")] || "",
      materialZh: row[indexOf("中文材质")] || "",
      useZh: row[indexOf("中文用途")] || "",
      category: row[indexOf("产品类别")] || "普货",
      length: row[indexOf("长cm")] || "",
      width: row[indexOf("宽cm")] || "",
      height: row[indexOf("高cm")] || "",
      weight: row[indexOf("重量kg")] || "",
      price: row[indexOf("采购价RMB")] || ""
    }));
}

async function importCsvFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const importedProducts = rowsToProducts(parseCsv(text));
    if (!importedProducts.length) throw new Error("CSV 里没有产品数据");
    const confirmed = window.confirm(`将导入 ${importedProducts.length} 个产品，海关编码会根据中文品名自动生成。是否继续？`);
    if (!confirmed) return;
    const data = await requestApi("/api/products/batch", { method: "POST", body: JSON.stringify({ products: importedProducts }) });
    await loadProducts();
    setMessage(`已批量导入 ${data.count} 个产品，海关编码已自动匹配。`);
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    elements.batchFileInput.value = "";
  }
}

Object.values(elements.fields).forEach((field) => {
  field.addEventListener("input", schedulePreviewUpdate);
  field.addEventListener("change", schedulePreviewUpdate);
});

elements.fields.mainImage.addEventListener("input", updateAssetPreview);
elements.fields.variantsJson.addEventListener("input", updateAssetPreview);
elements.variantDropdownButton.addEventListener("click", () => {
  elements.variantDropdown.classList.toggle("hidden");
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
document.addEventListener("click", (event) => {
  if (!event.target.closest(".variant-select")) elements.variantDropdown.classList.add("hidden");
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
elements.domesticShipmentsNavButton.addEventListener("click", () => switchPage("domesticShipments"));
elements.newProductButton.addEventListener("click", () => openProductModal());
elements.newShopButton.addEventListener("click", () => openShopModal());
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
    await loadProducts();
    await loadShops();
    await loadDomesticShipments();
  } catch {
    showLogin();
  }
}

boot();
