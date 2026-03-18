'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from '@/app/login/login.module.css';
import { playSound } from '@/utils/audio';
import { updatePassword } from '@/app/auth/actions';
import { Lock, ChevronLeft, ShieldCheck, Zap } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    playSound('pop');
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة!');
      return;
    }
    
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        playSound('success');
      }
    });
  };

  const features = [
    { icon: <ShieldCheck size={24} />, title: 'أمان كامل', desc: 'تم التحقق من هويتك بنجاح.' },
    { icon: <Zap size={24} />, title: 'خطوة أخيرة', desc: 'قم بتعيين كلمة للمرور للعودة لحسابك.' },
  ];

  return (
    <div className={`${styles.splitContainer} animate-fade-in`}>
      {/* Right: Form */}
      <div className={`${styles.formPanel} animate-fade-in-up`}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>تحديث كلمة المرور 🔑</h1>
            <p className={styles.formSubtitle}>أدخل كلمة المرور الجديدة لحسابك.</p>
          </div>

          <Card className="glass">
            <CardContent style={{ padding: '2.5rem' }}>
              <form className={styles.formContainer} onSubmit={handleSubmit}>
                {error && (
                  <div className={styles.errorAlert}>
                    ⚠️ {error}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <Input 
                    label="كلمة المرور الجديدة" 
                    name="password"
                    placeholder="••••••••" 
                    type="password" 
                    required 
                    icon={<Lock size={18} />}
                  />
                  <Input 
                    label="تأكيد كلمة المرور" 
                    name="confirmPassword"
                    placeholder="••••••••" 
                    type="password" 
                    required 
                    icon={<Lock size={18} />}
                  />
                </div>
                
                <Button 
                  fullWidth 
                  size="lg" 
                  type="submit" 
                  disabled={isPending}
                  onMouseEnter={() => playSound('pop')}
                  style={{ marginTop: '1rem', height: '3.5rem' }}
                >
                  {isPending ? '⏳ جاري التحديث...' : '💾 حفظ وتحديث'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Left: Features Panel */}
      <div className={styles.featuresPanel}>
        <div className={styles.featuresPanelInner}>
          <div className={`${styles.brandLogo} animate-fade-in-up`}>
            <Logo />
          </div>
          
          <h2 className={`${styles.featuresTitle} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>
             بخطوات بسيطة<br />نضمن أمانك
          </h2>
          <p className={`${styles.featuresSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
             اختر كلمة مرور قوية تحتوي على أرقام وحروف لتأمين حسابك.
          </p>
          
          <div className={styles.featuresList}>
            {features.map((f, i) => (
              <div 
                key={i} 
                className={`${styles.featureItem} animate-fade-in-up`}
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className={styles.featureItemIcon}>{f.icon}</div>
                <div>
                  <div className={styles.featureItemTitle}>{f.title}</div>
                  <div className={styles.featureItemDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
