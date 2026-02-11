"use client";

import React from "react";

interface ImagePreviewProps {
  images: { file: File; preview: string }[];
  onRemove: (index: number) => void;
}

export default function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {images.map((img, i) => (
        <div key={i} className="relative">
          <img
            src={img.preview}
            alt={`Preview ${i + 1}`}
            className="h-16 w-16 rounded-lg object-cover border border-gray-200"
          />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
