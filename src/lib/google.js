const GIS_SRC = "https://accounts.google.com/gsi/client";

let gisPromise;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    const onReady = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error("Google Sign-In failed to initialize"));
    };

    if (existing) {
      if (window.google?.accounts?.id) {
        resolve(window.google);
        return;
      }
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Google Sign-In")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Could not load Google Sign-In"));
    document.head.appendChild(script);
  });

  return gisPromise;
}
