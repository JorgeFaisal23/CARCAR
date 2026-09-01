"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Abre el comprobante de un pago a tamaño completo.
 *
 * Se muestra en un diálogo en vez de enlazar la imagen: los navegadores
 * bloquean la navegación directa a un data URL, así que un enlace no
 * funcionaría.
 */
export function ReceiptViewer({
  receiptUrl,
  title,
  subtitle,
  label = "Comprobante",
}: {
  receiptUrl: string;
  title: string;
  subtitle?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(event) => {
          // La fila entera suele ser un enlace; no queremos navegar.
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <Paperclip className="size-4" aria-hidden />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
          </DialogHeader>
          <div className="bg-muted mt-2 overflow-hidden rounded-lg">
            {/* Imagen subida por el usuario, guardada como data URL:
                next/image no aporta nada aquí. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptUrl}
              alt={`Comprobante de pago: ${title}`}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Indicador compacto para listas donde no cabe un botón con texto. */
export function ReceiptBadge({
  receiptUrl,
  title,
  subtitle,
}: {
  receiptUrl: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <ReceiptViewer
      receiptUrl={receiptUrl}
      title={title}
      subtitle={subtitle}
      label="Ver"
    />
  );
}
