"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  QrCode,
  ScanLine,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { AttendanceResult } from "@/types";
import { useAuth } from "@/components/auth-context";
import { getStore } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

let html5qrcodeModule: typeof import("html5-qrcode") | null = null;

export default function ScanPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectEvent = searchParams.get("event");
  const { push } = useToast();

  const [scanning, setScanning] = React.useState(false);
  const [manualCode, setManualCode] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [result, setResult] = React.useState<AttendanceResult | null>(null);
  const scannerRef = React.useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const videoRef = React.useRef<HTMLDivElement | null>(null);

  const submit = async (payload: string, mode: "scan" | "manual") => {
    if (!user || !payload.trim()) return;
    setProcessing(true);
    setResult({ ok: false, message: "Verifying pass…" });
    try {
      let data: AttendanceResult;
      if (getStore().demoMode) {
        data = await getStore().markAttendance(payload.trim(), user.id);
      } else {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: payload.trim(), organizerId: user.id }),
        });
        data = (await res.json()) as AttendanceResult;
      }
      setResult(data);
      if (data.ok) {
        push(data.message, "success");
        if (mode === "scan") setManualCode("");
      } else {
        push(data.message, "error");
      }
    } catch {
      setResult({ ok: false, message: "Scan failed. Please try again." });
      push("Scan failed. Please try again.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      html5qrcodeModule ??= await import("html5-qrcode");
      const { Html5Qrcode } = html5qrcodeModule;
      const scanner = new Html5Qrcode("cc-scanner-region", { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          void submit(decodedText, "scan");
        },
        () => {}
      );
      setScanning(true);
    } catch {
      push("Camera unavailable. Use manual entry instead.", "error");
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  React.useEffect(() => {
    return () => {
      if (scannerRef.current) {
        void scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="mx-auto max-w-lg animate-fade-up">
      <Link
        href="/organizer"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <PageHeader
        title="Scan QR Pass"
        subtitle="Point your camera at a student's QR pass to check them in."
        actions={
          preselectEvent ? (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
              Scanning for a specific event
            </span>
          ) : null
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 p-4">
          <div
            id="cc-scanner-region"
            ref={videoRef}
            className={cn(
              "mx-auto flex min-h-[260px] max-w-sm items-center justify-center rounded-xl transition-colors",
              scanning ? "bg-black" : "bg-slate-900/40"
            )}
          >
            {!scanning ? (
              <div className="text-center text-slate-400">
                <ScanLine className="mx-auto size-10" />
                <p className="mt-3 text-sm">Camera preview appears here</p>
              </div>
            ) : null}
          </div>
          {scanning ? (
            <div className="pointer-events-none absolute inset-4 mx-auto my-4 max-w-sm rounded-xl border-2 border-violet-400/70" />
          ) : null}
        </div>

        <div className="p-5">
          {scanning ? (
            <Button variant="outline" className="w-full" onClick={stopCamera}>
              <CameraOff className="size-4" /> Stop Camera
            </Button>
          ) : (
            <Button variant="gradient" className="w-full" onClick={startCamera}>
              <Camera className="size-4" /> Start Camera
            </Button>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-slate-200" />
            or enter pass code manually
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(manualCode, "manual");
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Paste the QR pass code here"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="font-mono text-xs"
            />
            <Button type="submit" variant="secondary" loading={processing}>
              Verify
            </Button>
          </form>
        </div>
      </Card>

      {result && (
        <div
          className={cn(
            "mt-4 animate-fade-up rounded-2xl border p-5",
            result.ok
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
              : result.invalid
              ? "border-rose-200 bg-rose-50/70 text-rose-900"
              : "border-amber-200 bg-amber-50/70 text-amber-900"
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            {result.ok ? (
              <CheckCircle2 className="size-5 text-emerald-600" />
            ) : (
              <XCircle className="size-5 text-rose-500" />
            )}
            {result.ok ? "Check-in Successful" : result.invalid ? "Invalid Pass" : "Check-in Failed"}
          </div>
          <p className={cn("mt-1 text-sm", result.ok ? "text-emerald-700" : "text-rose-700")}>
            {result.message}
          </p>
          {result.studentName ? (
            <p className="mt-2 text-sm font-medium">
              {result.studentName}
              {result.eventTitle ? (
                <span className="text-muted-foreground font-normal"> · {result.eventTitle}</span>
              ) : null}
            </p>
          ) : null}
          {result.alreadyAttended ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
              <Sparkles className="size-3" /> Duplicate scan — attendance was previously recorded.
            </p>
          ) : null}
        </div>
      )}

      <Card className="mt-4 flex items-start gap-3 p-4">
        <QrCode className="mt-0.5 size-5 shrink-0 text-violet-500" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-slate-700">Tip:</span> Ask the student to open their
          QR pass in CampusFlow AI and hold it steady inside the scan box. If the camera can&apos;t
          focus, use the manual code entry below the preview.
        </p>
      </Card>
    </div>
  );
}