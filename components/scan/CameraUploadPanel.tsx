"use client";

import { useRef, useState, useCallback } from "react";

type Props = {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
};

export default function CameraUploadPanel({
  onImageSelected,
  disabled = false,
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all duration-300 ${
        dragOver
          ? "border-[#D6A84F] bg-[rgba(214,168,79,0.08)]"
          : "border-[rgba(214,168,79,0.25)] hover:border-[rgba(214,168,79,0.4)]"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      style={{ background: "rgba(255, 255, 255, 0.03)" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(195, 40, 40, 0.15)" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C32828" strokeWidth="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>

      <p className="text-[#F7F2E8] font-medium mb-1">上传图片进行识别</p>
      <p className="text-[#6a6255] text-sm mb-5">网页端可选择文件或拖拽图片，手机端可打开相机</p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          className="btn-primary flex-1 px-5 py-2.5 rounded-xl font-medium"
        >
          选择图片
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="btn-outline flex-1 px-5 py-2.5 rounded-xl font-medium"
        >
          打开相机
        </button>
      </div>

      <p className="text-[#6a6255] text-xs mt-4">支持 JPG / PNG / WebP 格式</p>
    </div>
  );
}
