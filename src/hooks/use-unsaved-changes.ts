import { useEffect } from "react";

/** Alerta ao fechar aba/navegador quando há alterações não salvas. */
export function useUnsavedChangesWarning(isDirty: boolean, enabled = true) {
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, enabled]);
}
