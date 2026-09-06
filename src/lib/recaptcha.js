const RECAPTCHA_SRC = "https://www.google.com/recaptcha/api.js?render=explicit";

let recaptchaPromise;

export function loadRecaptcha() {
  if (window.grecaptcha?.render) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaPromise) return recaptchaPromise;

  recaptchaPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RECAPTCHA_SRC}"]`);
    const onReady = () => {
      if (!window.grecaptcha) {
        recaptchaPromise = null;
        reject(new Error("reCAPTCHA failed to initialize"));
        return;
      }
      window.grecaptcha.ready(() => resolve(window.grecaptcha));
    };

    if (existing) {
      if (window.grecaptcha?.render) {
        window.grecaptcha.ready(() => resolve(window.grecaptcha));
        return;
      }
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => {
        recaptchaPromise = null;
        reject(new Error("Could not load reCAPTCHA"));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RECAPTCHA_SRC;
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = () => {
      recaptchaPromise = null;
      reject(new Error("Could not load reCAPTCHA"));
    };
    document.head.appendChild(script);
  });

  return recaptchaPromise;
}

export async function resolveRecaptchaSiteKey(loader) {
  const fromEnv = String(process.env.REACT_APP_RECAPTCHA_SITE_KEY || "").trim();
  if (fromEnv) return fromEnv;

  try {
    const config = await loader();
    return String(config?.recaptchaSiteKey || "").trim();
  } catch {
    return "";
  }
}

export function readRecaptchaResponse(widgetId) {
  if (!window.grecaptcha?.getResponse) return "";
  try {
    if (widgetId == null) {
      return String(window.grecaptcha.getResponse() || "");
    }
    return String(window.grecaptcha.getResponse(widgetId) || "");
  } catch {
    return "";
  }
}
