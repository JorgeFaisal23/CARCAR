"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { verifySessionLiveness } from "@/app/login/actions";

/**
 * Monitorea proactivamente si la sesión de este dispositivo sigue activa en la base de datos.
 * Si se inició sesión en otro dispositivo, redirige inmediatamente a /login?motivo=sesion_duplicada
 * sin tener que esperar a que el usuario intente una acción o recargue.
 */
export function SessionMonitor() {
  const router = useRouter();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const check = async () => {
      if (isCheckingRef.current || document.hidden) return;
      isCheckingRef.current = true;
      try {
        const isAlive = await verifySessionLiveness();
        if (!isAlive) {
          router.replace("/login?motivo=sesion_duplicada");
          router.refresh();
        }
      } catch {
        // En caso de corte de red momentáneo, permitimos que reintente en el siguiente ciclo
      } finally {
        isCheckingRef.current = false;
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        check();
      }
    };

    // Revisa cuando la ventana vuelve a tener el foco o la pestaña se vuelve visible
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    // Verificación periódica cada 45 segundos mientras la pestaña esté en uso
    timer = setInterval(check, 45_000);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      if (timer) clearInterval(timer);
    };
  }, [router]);

  return null;
}
