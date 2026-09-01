"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, ImageUp, Loader2, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/components/shared/form-field";
import { money } from "@/lib/format";
import { compressImage, dataUrlBytes } from "@/lib/images";
import { markChargePaid, markChargeUnpaid } from "@/server/actions/payments";

const METHODS = ["Transferencia", "Efectivo", "Depósito", "Tarjeta", "Otro"];

/** Registrar o deshacer el pago de un cargo de renta. */
export function PaymentRowActions({
  chargeId,
  tenantName,
  amount,
  isPaid,
}: {
  chargeId: string;
  tenantName: string;
  amount: number;
  isPaid: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(METHODS[0]);
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pending, startTransition] = useTransition();

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMethod(METHODS[0]);
    setReference("");
    setReceipt(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El comprobante debe ser una imagen.");
      return;
    }

    setProcessing(true);
    try {
      // Se comprime en el navegador: una foto de celular sin reducir no cabe.
      const dataUrl = await compressImage(file);
      setReceipt(dataUrl);
      toast.success(
        `Comprobante listo (${Math.round(dataUrlBytes(dataUrl) / 1024)} KB).`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo leer la imagen.",
      );
    } finally {
      setProcessing(false);
    }
  };

  if (isPaid) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await markChargeUnpaid(chargeId);
            if (result.error) toast.error(result.error);
            else {
              toast.success("Pago deshecho.");
              router.refresh();
            }
          })
        }
      >
        <Undo2 className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">Deshacer</span>
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <Check className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">Registrar pago</span>
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {tenantName} · {money(amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Forma de pago" htmlFor={`method-${chargeId}`}>
            <NativeSelect
              id={`method-${chargeId}`}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field
            label="Referencia"
            htmlFor={`reference-${chargeId}`}
            hint="Folio de la transferencia o del recibo, si lo tienes."
          >
            <Input
              id={`reference-${chargeId}`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="REF-000123"
            />
          </Field>

          {/* ------------------------------------------------ comprobante */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Comprobante{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </p>

            {/* En celular, `capture` abre la cámara directamente. */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {receipt ? (
              <div className="space-y-2">
                <div className="bg-muted overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receipt}
                    alt="Vista previa del comprobante"
                    className="max-h-56 w-full object-contain"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReceipt(null);
                      if (cameraRef.current) cameraRef.current.value = "";
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={processing}
                    onClick={() => cameraRef.current?.click()}
                  >
                    {processing ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Camera className="size-4" aria-hidden />
                    )}
                    Tomar foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={processing}
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImageUp className="size-4" aria-hidden />
                    Subir imagen
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs text-pretty">
                  Foto del recibo o captura de la transferencia. Se guarda con el
                  pago y tu inquilino puede verla en su portal.
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={pending || processing}
            onClick={() =>
              startTransition(async () => {
                const result = await markChargePaid({
                  chargeId,
                  method,
                  reference: reference || undefined,
                  receiptUrl: receipt ?? undefined,
                });
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                setOpen(false);
                reset();
                toast.success(`Pago de ${tenantName} registrado.`);
                router.refresh();
              })
            }
          >
            {pending ? "Guardando…" : "Confirmar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
