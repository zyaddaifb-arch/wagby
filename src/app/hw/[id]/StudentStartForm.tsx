'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from '../student.module.css';
import { playSound } from '@/utils/audio';

export function StudentStartForm({ shareCode }: { shareCode: string }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsSubmitting(true);
      playSound('success');
      router.push(`/hw/${shareCode}/solve?name=${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.instructionsText}>أدخل اسمك لبدء حل الواجب</div>
      <Input 
        placeholder="اكتب اسمك الثلاثي" 
        value={name}
        onChange={(e) => setName(e.target.value)}
        required 
        autoFocus
        disabled={isSubmitting}
      />
      <Button 
        fullWidth 
        size="lg" 
        className={styles.actionBtn} 
        type="submit"
        disabled={!name.trim() || isSubmitting}
      >
        {isSubmitting ? 'جاري التحميل...' : 'ابدأ حل الواجب'}
      </Button>
    </form>
  );
}
