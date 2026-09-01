import { Eye } from "lucide-react";

/**
 * Aviso permanente para el rol de consulta. Es preferible decirle por qué no
 * ve botones de edición a que los busque y no los encuentre.
 */
export function ReadOnlyNotice() {
  return (
    <div className="flex items-center gap-2 border-b bg-sky-50 px-4 py-2 text-sm text-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
      <Eye className="size-4 shrink-0" aria-hidden />
      <p className="text-pretty">
        Tu cuenta es de <strong className="font-medium">solo lectura</strong>:
        puedes consultar el calendario y el resumen, pero no modificar
        información.
      </p>
    </div>
  );
}
