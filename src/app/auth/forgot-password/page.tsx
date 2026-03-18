'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from '@/app/login/login.module.css';
import { playSound } from '@/utils/audio';
import { forgotPassword } from '@/app/auth/actions';
import { Mail, ChevronLeft, ShieldCheck, Zap, Sparkles, ExternalLink, BarChart3 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    playSound('pop');
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await forgotPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
        playSound('success');
      }
    });
  };

  const features = [
    { icon: <ShieldCheck size={24} />, title: 'أمان كامل', desc: 'نحن نستخدم أحدث التقنيات لضمان أمان حسابك.' },
    { icon: <Zap size={24} />, title: 'تحديث سريع', desc: 'استعد حسابك بضغطة زر وبدون تعقيد.' },
  ];

  return (
    <div className={`${styles.splitContainer} animate-fade-in`}>
      {/* Right: Form */}
      <div className={`${styles.formPanel} animate-fade-in-up`}>
        <Link href="/login" className={styles.backLink}>
           <ChevronLeft size={20} /> العودة للدخول
        </Link>
        
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>نسيت كلمة المرور؟ 🔒</h1>
            <p className={styles.formSubtitle}>أدخل بريدك الإلكتروني لنرسل لك رابط الاستعادة.</p>
          </div>

          <Card className="glass">
            <CardContent style={{ padding: '2.5rem' }}>
              <form className={styles.formContainer} onSubmit={handleSubmit}>
                {error && (
                  <div className={styles.errorAlert}>
                    ⚠️ {error}
                  </div>
                )}
                {success && (
                  <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
                    ✅ {success}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <Input 
                    label="البريد الإلكتروني" 
                    name="email"
                    placeholder="teacher@example.com" 
                    type="email" 
                    required 
                    icon={<Mail size={18} />}
                  />
                </div>
                
                <Button 
                  fullWidth 
                  size="lg" 
                  type="submit" 
                  disabled={isPending || !!success}
                  onMouseEnter={() => playSound('pop')}
                  style={{ marginTop: '1rem', height: '3.5rem' }}
                >
                  {isPending ? '⏳ جاري الإرسال...' : '📨 إرسال رابط الاستعادة'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className={styles.footer}>
              <p>تذكرت كلمة المرور؟ <Link href="/login">تسجيل الدخول</Link></p>
            </CardFooter>
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
             استعد حسابك بأمان<br />وبكل سهولة
          </h2>
          <p className={`${styles.featuresSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
             نحن هنا لمساعدتك للعودة إلى طلابك ومواصلة إبداعك.
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
