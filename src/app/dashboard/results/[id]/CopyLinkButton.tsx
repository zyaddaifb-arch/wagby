'use client';
import { Button } from '@/components/ui/Button';
import { playSound } from '@/utils/audio';
import styles from './results.module.css';

export function CopyLinkButton({ shareCode }: { shareCode: string }) {
  const handleCopy = () => {
    playSound('pop');
    const link = `${window.location.origin}/hw/${shareCode}`;
    navigator.clipboard.writeText(link);
    alert('تم نسخ الرابط بنجاح!'); // Quick simple feedback
  };

  return (
    <Button variant="outline" size="lg" className={styles.copyBtn} onClick={handleCopy}>
      🔗 نسخ الرابط للطلاب
    </Button>
  );
}
