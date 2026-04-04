(function () {
  if (window.RxToast) return;

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function ensureStack() {
    let stack = document.querySelector(".rx-toast-stack");
    if (stack) return stack;

    stack = document.createElement("div");
    stack.className = "rx-toast-stack";
    document.body.appendChild(stack);
    return stack;
  }

  const icons = { success: "✓", error: "✕", warn: "!", info: "i" };
  const labels = { success: "Success", error: "Error", warn: "Warning", info: "Info" };

  function showToast(type, title, msg) {
    const stack = ensureStack();

    const toast = document.createElement("div");
    toast.className = `rx-toast rx-toast--${type}`;
    toast.innerHTML = `
      <div class="rx-toast-icon">${icons[type] || icons.info}</div>
      <div class="rx-toast-body">
        <p class="rx-toast-title">${esc(title || labels[type] || labels.info)}</p>
        ${msg ? `<p class="rx-toast-msg">${esc(msg)}</p>` : ""}
      </div>
      <button class="rx-toast-close" aria-label="Dismiss">×</button>
      <div class="rx-toast-bar"></div>
    `;

    stack.appendChild(toast);

    requestAnimationFrame(function () {
      toast.offsetHeight;
      toast.classList.add("rx-toast--in");
    });

    function dismiss() {
      toast.classList.add("rx-toast--out");
      setTimeout(function () {
        toast.remove();
      }, 340);
    }

    const closeBtn = toast.querySelector(".rx-toast-close");
    if (closeBtn) closeBtn.addEventListener("click", dismiss);
    setTimeout(dismiss, 4200);
  }

  window.RxToast = {
    success: function (title, msg) { showToast("success", title, msg); },
    error: function (title, msg) { showToast("error", title, msg); },
    warn: function (title, msg) { showToast("warn", title, msg); },
    info: function (title, msg) { showToast("info", title, msg); },
  };
})();