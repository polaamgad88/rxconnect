document.addEventListener("DOMContentLoaded", () => {
  const resultsDiv = document.getElementById("medication-results");
  const resultsSummary = document.getElementById("resultsSummary");
  const searchInput = document.getElementById("medSearch");
  const searchBtn = document.getElementById("searchBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageIndicator = document.getElementById("pageIndicator");
  const paginationControls = document.getElementById("pagination-controls");

  const pageSize = 20;
  let currentPage = 1;
  let currentQuery = "";
  let totalResults = 0;
  let isLoading = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function limitStrength(value, maxLength = 28) {
  const text = String(value || "").trim();
  if (!text) return "N/A";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildSearchUrl(query, page) {
    const skip = (page - 1) * pageSize;
    const params = new URLSearchParams({
      limit: String(pageSize),
      skip: String(skip),
    });

    const cleanQuery = query.trim();
    if (cleanQuery) {
      const safeQuery = cleanQuery.replace(/"/g, "\\\"");
      const searchExpression = `products.brand_name:"${safeQuery}"`;
      params.set("search", searchExpression);
    }

    return `https://api.fda.gov/drug/drugsfda.json?${params.toString()}`;
  }

  function setLoadingState(loading) {
    isLoading = loading;
    if (searchBtn) {
      searchBtn.disabled = loading;
      searchBtn.textContent = loading ? "Searching..." : "Search";
    }
    if (searchInput) {
      searchInput.disabled = loading;
    }
    if (resultsDiv) {
      resultsDiv.setAttribute("aria-busy", String(loading));
    }
  }

  function renderMessage(message, type = "info") {
    const className =
      type === "error"
        ? "medicine-message is-error"
        : type === "loading"
          ? "medicine-message is-loading"
          : "medicine-message";

    resultsDiv.innerHTML = `<div class="${className}">${escapeHtml(message)}</div>`;
  }

  function updateSummary(text) {
    if (resultsSummary) {
      resultsSummary.textContent = text;
    }
  }

  function togglePagination(show) {
    if (!paginationControls) return;
    paginationControls.classList.toggle("is-hidden", !show);
  }

  function getUniqueProducts(apiResults) {
    const uniqueMap = new Map();

    apiResults.forEach((item) => {
      const sponsorName = item?.sponsor_name || "Unknown sponsor";
      const products = Array.isArray(item?.products) ? item.products : [];

      products.forEach((product) => {
        const brandName = (product?.brand_name || "").trim();
        if (!brandName) return;

        const strengths = Array.isArray(product?.active_ingredients)
          ? product.active_ingredients
              .map((ingredient) => ingredient?.strength)
              .filter(Boolean)
          : [];

        const strengthText = strengths.length ? strengths.join(" / ") : "Strength not listed";
        const genericName = (product?.generic_name || "").trim();
        const dosageForm = (product?.dosage_form || "").trim();

        const uniqueKey = [normalizeText(brandName), normalizeText(strengthText)].join("||");

        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, {
            brandName,
            strengthText,
            genericName,
            dosageForm,
            sponsorName,
          });
        }
      });
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
      a.brandName.localeCompare(b.brandName)
    );
  }

  function renderResults(items) {
    if (!items.length) {
      renderMessage("No medicines found for this search.");
      return;
    }

    resultsDiv.innerHTML = items
      .map((item) => {
        const metaParts = [];
        if (item.genericName) metaParts.push(`Generic: ${escapeHtml(item.genericName)}`);
        if (item.dosageForm) metaParts.push(`Form: ${escapeHtml(item.dosageForm)}`);
        if (item.sponsorName) metaParts.push(`Sponsor: ${escapeHtml(item.sponsorName)}`);

        return `
          <article class="medicine-row">
            <div class="medicine-main">
              <strong class="medicine-name">${escapeHtml(item.brandName)}</strong>
              ${metaParts.length ? `<div class="medicine-meta">${metaParts.map((part) => `<span>${part}</span>`).join("")}</div>` : ""}
            </div>
<span
  class="medicine-strength"
  title="${escapeHtml(item.strengthText)}"
>
  ${escapeHtml(limitStrength(item.strengthText, 28))}
</span>          </article>
        `;
      })
      .join("");
  }

  function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

    if (pageIndicator) {
      pageIndicator.textContent = `Page ${currentPage}`;
    }

    if (prevBtn) prevBtn.disabled = currentPage <= 1 || isLoading;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || isLoading;

    togglePagination(totalResults > pageSize || currentPage > 1);
  }

  async function fetchMedicines(query = "", page = 1) {
    currentQuery = query.trim();
    currentPage = page;

    setLoadingState(true);
    renderMessage("Searching medicines...", "loading");
    updateSummary(currentQuery ? `Searching for “${currentQuery}”.` : "Loading medicine list...");

    try {
      const response = await fetch(buildSearchUrl(currentQuery, currentPage));
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const apiResults = Array.isArray(data?.results) ? data.results : [];
      const items = getUniqueProducts(apiResults);
      totalResults = Number(data?.meta?.results?.total || items.length || 0);

      renderResults(items);

      if (items.length) {
        const from = (currentPage - 1) * pageSize + 1;
        const to = from + items.length - 1;
        updateSummary(
          currentQuery
            ? `Showing ${from}-${to} of ${totalResults} results for “${currentQuery}”.`
            : `Showing ${from}-${to} of ${totalResults} medicines.`
        );
      } else {
        updateSummary(currentQuery ? `No medicines found for “${currentQuery}”.` : "No medicines found.");
      }
    } catch (error) {
      totalResults = 0;
      renderMessage("Unable to load medicines right now. Please try again.", "error");
      updateSummary("There was a problem loading the medicine list.");
    } finally {
      setLoadingState(false);
      updatePagination();
    }
  }

  function handleSearch() {
    const value = searchInput ? searchInput.value : "";
    fetchMedicines(value, 1);
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearch();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (isLoading) return;
      fetchMedicines(currentQuery, currentPage + 1);
      window.scrollTo({ top: resultsDiv.offsetTop - 120, behavior: "smooth" });
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (isLoading || currentPage <= 1) return;
      fetchMedicines(currentQuery, currentPage - 1);
      window.scrollTo({ top: resultsDiv.offsetTop - 120, behavior: "smooth" });
    });
  }

  fetchMedicines("", 1);
});