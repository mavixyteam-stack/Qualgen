"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Modal, Spinner } from "@/components/ui";

const FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "title", label: "Job title" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "linkedin_url", label: "LinkedIn URL" },
  { key: "location", label: "Location" },
  { key: "industry", label: "Industry" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

const GUESSES: Record<FieldKey, RegExp> = {
  name: /^(full[\s_-]?name|name|contact)$/i,
  title: /(title|role|position|designation)/i,
  company: /(company|organi[sz]ation|account|employer)/i,
  email: /(e-?mail)/i,
  linkedin_url: /(linkedin)/i,
  location: /(location|city|country|region)/i,
  industry: /(industry|sector|vertical)/i,
};

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  function reset() {
    setRows([]); setHeaders([]); setMapping({}); setFileName(null);
    setBusy(false); setError(null); setResult(null);
  }

  function close() {
    reset();
    onClose();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        if (!hdrs.length || !res.data.length) {
          setError("Couldn't read that file — make sure it's a CSV with a header row.");
          return;
        }
        setHeaders(hdrs);
        setRows(res.data);
        // Auto-guess the column mapping from the headers.
        const guessed: Partial<Record<FieldKey, string>> = {};
        for (const f of FIELDS) {
          const hit = hdrs.find((h) => GUESSES[f.key].test(h.trim()));
          if (hit) guessed[f.key] = hit;
        }
        setMapping(guessed);
      },
      error: () => setError("Couldn't parse that file. Save it as .csv and try again."),
    });
  }

  async function doImport() {
    if (!mapping.name) {
      setError("Map the Name field — it's required.");
      return;
    }
    setBusy(true);
    setError(null);
    const leads = rows.map((r) => {
      const lead: Record<string, string | null> = {};
      for (const f of FIELDS) {
        const col = mapping[f.key];
        lead[f.key] = col ? (r[col] ?? "").trim() || null : null;
      }
      return lead;
    });
    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Import failed.");
      return;
    }
    setResult({ added: data.added, skipped: data.skipped });
    router.refresh();
  }

  return (
    <Modal open={open} onClose={close} title="Import leads from CSV" wide>
      {result ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-pastel-mint text-3xl">✅</div>
          <div>
            <div className="text-xl font-bold">{result.added} leads imported</div>
            {result.skipped > 0 && (
              <p className="mt-1 text-sm text-ink-muted">
                {result.skipped} skipped (duplicates or invalid rows)
              </p>
            )}
          </div>
          <button onClick={close} className="btn-primary btn-md">Done</button>
        </div>
      ) : (
        <div className="space-y-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-6 py-10 text-center transition hover:border-brand-400">
            <span className="text-3xl">📄</span>
            <span className="font-semibold">{fileName ?? "Choose a CSV file"}</span>
            <span className="text-xs text-ink-muted">Header row required · up to 500 leads</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>

          {headers.length > 0 && (
            <>
              <div>
                <h3 className="mb-3 text-sm font-bold">Map your columns</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="label">
                        {f.label} {"required" in f && f.required && <span className="text-accent-pink">*</span>}
                      </label>
                      <select
                        className="input"
                        value={mapping[f.key] ?? ""}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))
                        }
                      >
                        <option value="">— Skip —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-ink-muted">
                {rows.length} rows found. Duplicate emails are skipped automatically. CSV import is{" "}
                <span className="font-semibold text-accent-mint">free</span> — no credits used.
              </p>
            </>
          )}

          {error && (
            <p className="rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-medium text-accent-pink">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={close} className="btn-ghost btn-md">Cancel</button>
            <button
              onClick={doImport}
              disabled={!rows.length || busy}
              className="btn-primary btn-md"
            >
              {busy && <Spinner />}
              Import {rows.length > 0 ? `${rows.length} leads` : ""}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
