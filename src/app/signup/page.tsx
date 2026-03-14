'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from './signup.module.css';
import { playSound } from '../../utils/audio';
import { signup } from '../auth/actions';
import { 
  Zap, 
  ExternalLink, 
  BarChart3, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ChevronLeft
} from 'lucide-react';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    playSound('pop');
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        playSound('success');
      }
    });
  };

  const features = [
    { icon: <Zap size={24} />, title: 'إنشاء واجبات بسرعة', desc: 'اصنع واجباً كاملاً في أقل من 5 دقائق بذكاء' },
    { icon: <ExternalLink size={24} />, title: 'شارك برابط واحد', desc: 'لا تطبيقات، لا حسابات للطلاب، لا تعقيد' },
    { icon: <BarChart3 size={24} />, title: 'نتائج فورية', desc: 'شاهد أداء طلابك لحظة بلحظة وبدقة عالية' },
    { icon: <ShieldCheck size={24} />, title: 'ترتيب الطلاب', desc: 'لوحة شرف ذكية تحفّز الطلاب على الإبداع' },
  ];

  return (
    <div className={`${styles.splitContainer} animate-fade-in`}>
      {/* Right: Signup Form */}
      <div className={`${styles.formPanel} animate-fade-in-up`}>
        <Link href="/" className={styles.backLink}>
           <ChevronLeft size={20} /> العودة للرئيسية
        </Link>
        
        <div className={styles.formWrapper}>
          <div className={styles.brand}>
            <h1>ذاكرلي</h1>
            <p>أهلاً بك في مستقبل التعليم! أنشئ حسابك المجاني وابدأ الإبداع</p>
          </div>
          
          <Card className="glass">
            <CardHeader>
              <CardTitle>إنشاء حساب معلم</CardTitle>
            </CardHeader>
            <CardContent>
              <form className={styles.formContainer} onSubmit={handleSubmit}>
                 {error && <div className={styles.errorAlert}>⚠️ {error}</div>}
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <Input 
                    label="الاسم" 
                    name="fullName"
                    placeholder="أدخل اسمك الكامل" 
                    type="text" 
                    required 
                    icon={<User size={18} />}
                  />
                  <Input 
                    label="البريد الإلكتروني" 
                    name="email"
                    placeholder="teacher@example.com" 
                    type="email" 
                    required 
                    icon={<Mail size={18} />}
                  />
                  <Input 
                    label="كلمة المرور" 
                    name="password"
                    placeholder="••••••••" 
                    type="password" 
                    required 
                    minLength={6}
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
                  {isPending ? '⏳ جاري التسجيل...' : '🚀 انطلق الآن وابدأ الإبداع'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className={styles.footer}>
              <p>لديك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link></p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Left: Features Panel */}
      <div className={styles.featuresPanel}>
        <div className={styles.featuresPanelInner}>
          <div className={`${styles.brandLogo} animate-fade-in-up`}>
            <img src="/logo.png" alt="Zakerly" className={styles.brandLogoImg} />
            <span className={styles.brandLogoText}>ذاكرلي</span>
          </div>
          
          <h2 className={`${styles.featuresTitle} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>
             انضم إلى آلاف المعلمين<br />المبدعين حول العالم
          </h2>
          <p className={`${styles.featuresSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
             ابدأ رحلتك في تحويل التعليم التقليدي إلى تجربة رقمية ممتعة وتفاعلية لطلابك.
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
          
          <div className={`${styles.featuresFooter} animate-fade-in-up`} style={{ animationDelay: '0.8s' }}>
            <Sparkles size={16} /> ابدأ مجاناً الآن ولا تتردد
          </div>
        </div>
      </div>
    </div>
  );
}
