import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRunInference } from "@/hooks/usePredictions";
import type { ModelType } from "@/types";
import LowConfidenceBanner from "@/features/predictions/LowConfidenceBanner";
import ConfidenceBar from "@/features/predictions/ConfidenceBar";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPT = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const runInference = useRunInference();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [modelType, setModelType] = useState<ModelType>("tumor");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    if (f.size > MAX_SIZE) { toast.error("File exceeds 10 MB limit"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    multiple: false,
  });

  async function handleSubmit() {
    if (!file || !user) return;
    setIsUploading(true);

    try {
      // 1. Upload image to Supabase Storage
      const ext = file.type === "image/png" ? "png" : "jpg";
      const objectPath = `${user.id}/${uuidv4()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("scan-images")
        .upload(objectPath, file, { contentType: file.type });
      if (uploadErr) throw new Error(uploadErr.message);

      // 2. Trigger FastAPI inference
      const result = await runInference.mutateAsync({
        image_path: `scan-images/${objectPath}`,
        model_type: modelType,
        user_id: user.id,
      });

      toast.success("Scan analysed successfully");
      navigate(`/history/${result.prediction_id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Inference failed");
    } finally {
      setIsUploading(false);
    }
  }

  const isProcessing = isUploading || runInference.isPending;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">New Scan</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload a neurological scan image to receive an AI-generated prediction.
      </p>

      {/* Model selector */}
      <div className="mt-6 flex gap-3">
        {(["tumor", "stroke"] as ModelType[]).map((type) => (
          <button
            key={type}
            onClick={() => setModelType(type)}
            className={[
              "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
              modelType === type
                ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            ].join(" ")}
          >
            {type === "tumor" ? "🧠 Brain Tumor" : "🩺 Ischemic Stroke"}
          </button>
        ))}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={[
          "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors",
          isDragActive
            ? "border-brand-400 bg-brand-50"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img
            src={preview}
            alt="Scan preview"
            className="mb-4 h-40 w-40 rounded-lg object-cover shadow"
          />
        ) : (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
        )}
        <p className="text-sm font-medium text-slate-700">
          {file ? file.name : "Drop JPEG or PNG here"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "JPEG / PNG · Max 10 MB"}
        </p>
        {file && (
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
            className="mt-3 text-xs text-slate-400 underline hover:text-slate-600"
          >
            Remove
          </button>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!file || isProcessing}
        className="btn-primary mt-5 w-full justify-center"
      >
        {isProcessing ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Analysing scan…
          </>
        ) : (
          "Run AI Analysis"
        )}
      </button>

      {/* Clinical disclaimer */}
      <p className="mt-6 text-center text-xs text-slate-400">
        AI output is not a substitute for clinical diagnosis.
        Results must be reviewed by a qualified clinician.
      </p>
    </div>
  );
}
