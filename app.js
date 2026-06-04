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
  modal: document.querySelector("#productModal"),
  form: document.querySelector("#productForm"),
  formTitle: document.querySelector("#formTitle"),
  newProductButton: document.querySelector("#newProductButton"),
  closeModalButton: document.querySelector("#closeModalButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
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
  productCount: document.querySelector("#productCount"),
  userBadge: document.querySelector("#userBadge"),
  ruleLabel: document.querySelector("#ruleLabel"),
  formMessage: document.querySelector("#formMessage"),
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
let editingId = null;
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

elements.newProductButton.addEventListener("click", () => openProductModal());
elements.closeModalButton.addEventListener("click", closeProductModal);
elements.cancelEditButton.addEventListener("click", closeProductModal);
elements.modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) closeProductModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.modal.classList.contains("hidden")) closeProductModal();
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
  } catch {
    showLogin();
  }
}

boot();
