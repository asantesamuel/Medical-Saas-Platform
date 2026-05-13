import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRunInference } from "@/hooks/usePredictions";
import type { ModelType } from "@/types";

const uuidv4 = () => crypto.randomUUID();
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] };

const modelOptions: Array<{
  type: ModelType;
  title: string;
  copy: string;
  accent: string;
}> = [
  {
    type: "tumor",
    title: "Brain Tumor",
    copy: "Classify tumor indicators and confidence distribution.",
    accent: "from-brand-500 to-cyan-400",
  },
  {
    type: "stroke",
    title: "Ischemic Stroke",
    copy: "Assess stroke-likelihood patterns for rapid triage.",
    accent: "from-emerald-500 to-teal-400",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const runInference = useRunInference();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [modelType, setModelType] = useState<ModelType>("tumor");
  const [isUploading, setIsUploading] = useState(false);

  const selectedModel = useMemo(
    () => modelOptions.find((option) => option.type === modelType) ?? modelOptions[0],
    [modelType],
  );

  const onDrop = useCallback((accepted: File[]) => {
    const nextFile = accepted[0];
    if (!nextFile) return;
    if (nextFile.size > MAX_SIZE) {
      toast.error("File exceeds 10 MB limit");
      return;
    }
    setFile(nextFile);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(nextFile);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    multiple: false,
  });

  function removeFile() {
    setFile(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  async function handleSubmit() {
    if (!file || !user) return;
    setIsUploading(true);

    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const objectPath = `${user.id}/${uuidv4()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("scan-images")
        .upload(objectPath, file, { contentType: file.type });
      if (uploadErr) throw new Error(uploadErr.message);

      const result = await runInference.mutateAsync({
        image_path: objectPath,
        model_type: modelType,
        user_id: user.id,
      });

      const id = result.prediction_id ?? result.id;
      if (!id) throw new Error("No prediction ID returned from server");
      toast.success("Scan analyzed successfully");
      navigate(`/history/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Inference failed");
    } finally {
      setIsUploading(false);
    }
  }

  const isProcessing = isUploading || runInference.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Diagnostic workflow</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            New scan analysis
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Upload a neurological scan, choose a model, and review AI-generated confidence outputs with clinical context.
          </p>
        </div>
        <Link to="/history" className="btn-secondary w-full sm:w-auto">
          View history
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="panel p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {modelOptions.map((option) => {
              const isSelected = modelType === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setModelType(option.type)}
                  className={[
                    "group rounded-2xl border p-4 text-left transition-all duration-200",
                    isSelected
                      ? "border-brand-300 bg-brand-50/80 shadow-glow"
                      : "border-slate-200/80 bg-white/[0.72] hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-sm",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${option.accent} text-white shadow-sm`}>
                    <ScanIcon className="h-5 w-5" />
                  </span>
                  <span className="block text-sm font-semibold text-slate-950">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{option.copy}</span>
                </button>
              );
            })}
          </div>

          <div
            {...getRootProps()}
            className={[
              "mt-5 flex min-h-[25rem] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed px-5 py-8 text-center transition-all duration-200",
              isDragActive || isFocused
                ? "border-brand-400 bg-brand-50/90 shadow-glow"
                : "border-slate-300/80 bg-white/70 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white",
            ].join(" ")}
          >
            <input {...getInputProps()} aria-label="Upload scan image" />
            {preview ? (
              <div className="w-full max-w-md">
                <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-[0_26px_60px_-35px_rgba(15,23,42,0.9)]">
                  <img src={preview} alt="Selected scan preview" className="h-72 w-full object-cover opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-left">
                    <p className="truncate text-sm font-semibold text-white">{file?.name}</p>
                    <p className="mt-1 text-xs text-slate-200">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : null}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="mt-4 text-sm font-semibold text-slate-500 transition-colors hover:text-danger-600"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-200">
                  <UploadIcon className="h-7 w-7" />
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {isDragActive ? "Release to upload scan" : "Drop scan image here"}
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  JPEG or PNG up to 10 MB. Keyboard users can focus this area and press Enter to browse files.
                </p>
              </>
            )}
          </div>

          <button onClick={handleSubmit} disabled={!file || isProcessing} className="btn-primary mt-5 w-full">
            {isProcessing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Analyzing scan...
              </>
            ) : (
              <>
                Run AI analysis
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </section>

        <aside className="space-y-5">
          <div className="panel overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${selectedModel.accent}`} />
            <div className="p-5 sm:p-6">
              <p className="eyebrow">Selected model</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedModel.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selectedModel.copy}</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["Input", "MRI/CT"],
                  ["Mode", "AI assist"],
                  ["Review", "Required"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-700 ring-1 ring-warning-500/20">
                <AlertIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Clinical safeguard</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  AI output is not a substitute for diagnosis. Results must be reviewed by a qualified clinician before care decisions.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-slate-950">Workflow checklist</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Image selected", Boolean(file)],
                ["Model selected", Boolean(modelType)],
                ["Ready for analysis", Boolean(file && modelType)],
              ].map(([label, complete]) => (
                <div key={String(label)} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${complete ? "bg-success-50 text-success-700" : "bg-slate-100 text-slate-400"}`}>
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className={complete ? "font-medium text-slate-900" : "text-slate-500"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm3 5h4m-4 4h4m-4 4h2" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.2L2.8 17.3A2 2 0 004.5 20h15a2 2 0 001.7-2.7L13.7 4.2a2 2 0 00-3.4 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
