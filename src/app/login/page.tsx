'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from './login.module.css';
import { playSound } from '../../utils/audio';
import { login } from '../auth/actions';
import { 
  Zap, 
  ExternalLink, 
  BarChart3, 
  Sparkles, 
  ShieldCheck,
  Lock,
  Mail,
  ChevronLeft
} from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    playSound('pop');
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData);
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
    <div className={styles.authContainer}>
      <div className={`${styles.splitContainer} animate-fade-in`}>
        {/* Right: Login Form */}
        <div className={`${styles.formPanel} animate-fade-in-up`}>
          <Link href="/" className={styles.backLink}>
             <ChevronLeft size={20} /> العودة للرئيسية
          </Link>
          
          <div className={styles.formWrapper}>
            <Card className="glass">
              <CardContent style={{ padding: '3.5rem' }}>
                <form className={styles.formContainer} onSubmit={handleSubmit}>
                  {error && (
                    <div className={styles.errorAlert}>
                      ⚠️ {error === 'Invalid login credentials' ? 'بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.' : error}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Input 
                      label="البريد الإلكتروني" 
                      name="email"
                      placeholder="mail@zakerly.com" 
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
                      icon={<Lock size={18} />}
                    />
                  </div>
                  
                  <Button 
                    fullWidth 
                    size="lg" 
                    type="submit" 
                    disabled={isPending}
                    onMouseEnter={() => playSound('pop')}
                    style={{ marginTop: '1.5rem', height: '4rem', fontSize: '1.1rem' }}
                    data-testid="login-submit-button"
                  >
                    {isPending ? '⏳ جاري الدخول...' : '🚀 تسجيل الدخول'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className={styles.footer}>
                <p>ليس لديك حساب؟ <Link href="/signup">أنشئ حسابك المجاني الآن</Link></p>
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
               منصة الواجبات الذكية<br />بلمسة احترافية للمعلمين
            </h2>
            <p className={`${styles.featuresSubtitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
               كل ما تحتاجه لإدارة واجباتك المدرسية في مكان واحد، ببساطة وذكاء لم تره من قبل.
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
              <Sparkles size={16} /> جرّب تجربة تعليمية فريدة مجاناً الآن
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
