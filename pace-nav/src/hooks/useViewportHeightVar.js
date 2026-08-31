import { useLayoutEffect } from "react";

// iOS Safari's `dvh` unit doesn't reliably track the *currently* visible
// viewport while its address bar is expanded (it can report the larger,
// chrome-collapsed height instead), which pushes fixed bottom-anchored UI
// below the fold. window.visualViewport.height is the one source that
// always reflects what's actually on screen, so mirror it into a CSS
// custom property and size off that instead of the vh/dvh units directly.
export function useViewportHeightVar() {
  useLayoutEffect(() => {
    const setVar = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-vh", `${height}px`);
    };

    setVar();
    window.visualViewport?.addEventListener("resize", setVar);
    window.addEventListener("resize", setVar);
    window.addEventListener("orientationchange", setVar);

    return () => {
      window.visualViewport?.removeEventListener("resize", setVar);
      window.removeEventListener("resize", setVar);
      window.removeEventListener("orientationchange", setVar);
    };
  }, []);
}
