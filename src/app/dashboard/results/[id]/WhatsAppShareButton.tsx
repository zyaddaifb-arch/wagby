'use client';
import { Button } from '@/components/ui/Button';
import { playSound } from '@/utils/audio';
import styles from './results.module.css';

export function WhatsAppShareButton({ shareCode, title }: { shareCode: string, title: string }) {
  const handleShare = () => {
    playSound('success');
    const link = `${window.location.origin}/hw/${shareCode}`;
    const text = `حلوا الواجب هنا:\n${title}\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Button className={styles.whatsappBtn} size="lg" onClick={handleShare}>
      📲 إرسال عبر واتساب
    </Button>
  );
}
