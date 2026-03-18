'use client';
import React, { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './imageUploader.module.css';

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('يُسمح فقط بملفات الصور');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data, error: signError } = await supabase.storage
        .from('question-images')
        .createSignedUrl(fileName, 315360000); // 10 years expiration for simplicity

      if (signError) throw signError;

      onChange(data?.signedUrl || null);
    } catch (err: any) {
      setError('فشل رفع الصورة. حاول مرة أخرى.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => onChange(null);

  return (
    <div className={styles.uploaderWrapper}>
      {value ? (
        <div className={styles.preview}>
          <img src={value} alt="صورة السؤال" className={styles.previewImg} />
          <button type="button" className={styles.removeBtn} onClick={handleRemove}>
            ✕ إزالة الصورة
          </button>
        </div>
      ) : (
        <div
          className={styles.dropZone}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className={styles.uploading}>
              <div className={styles.spinner} />
              <span>جاري رفع الصورة...</span>
            </div>
          ) : (
            <div className={styles.dropContent}>
              <span className={styles.dropIcon}>🖼️</span>
              <span className={styles.dropText}>اسحب صورة هنا أو <span className={styles.dropLink}>اختر من جهازك</span></span>
              <span className={styles.dropHint}>PNG · JPG · GIF · حتى 5 ميجا</span>
            </div>
          )}
        </div>
      )}
      {error && <p className={styles.uploadError}>{error}</p>}
    </div>
  );
}
