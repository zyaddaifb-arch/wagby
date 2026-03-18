"use client";
import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import styles from './page.module.css';
import { playSound } from '../utils/audio';
import { 
  Zap, 
  ExternalLink, 
  UserCheck, 
  BarChart3, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  MousePointer2,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Users
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Background Blobs for Depth */}
        <div className={styles.blobWrapper}>
           <div className={`${styles.blob} ${styles.blobPrimary}`}></div>
           <div className={`${styles.blob} ${styles.blobSecondary}`}></div>
        </div>

        <section className={`${styles.heroSection} animate-fade-in`}>
          <div className={`container ${styles.heroContainer}`}>
            <div 
              className={`${styles.heroBadge} animate-fade-in-up`}
              onMouseEnter={() => playSound('pop')}
            >
              <Sparkles size={14} className={styles.badgeIcon} />
              التحديث الجديد: تجربة لا مثيل لها للمدارس!
            </div>
            
            <h1 className={`${styles.title} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>
              تخلص من <span className="premium-gradient-text">معاناة التصحيح</span><br />
              في ثوانٍ معدودة.
            </h1>
            
            <p className={`${styles.subtitle} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
              منصة واجبي هي دليلك الأذكى لإنشاء وتقييم الواجبات المدرسية. وفر ساعات من وقتك الثمين، وامنح طلابك تجربة تفاعلية وممتعة تغنيهم عن الأوراق التقليدية.
            </p>
            
            <div className={`${styles.ctaWrapper} animate-fade-in-up`} style={{ animationDelay: '0.3s' }}>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className={styles.ctaButton}
                  onMouseEnter={() => playSound('pop')}
                  onClick={() => playSound('success')}
                >
                  ابدأ مجاناً الآن <ArrowRight size={18} style={{ marginRight: '8px' }} />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="secondary" 
                className={styles.secondaryCta}
                onClick={() => {
                  playSound('click');
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                استكشف المميزات
              </Button>
            </div>

            <div className={`${styles.heroPreview} animate-fade-in-up`} style={{ animationDelay: '0.4s' }}>
               <div className={styles.previewMockup}>
                 <div className={styles.mockupHeader}>
                   <div className={styles.mockupDots}>
                     <span className={styles.dotRed}></span>
                     <span className={styles.dotYellow}></span>
                     <span className={styles.dotGreen}></span>
                   </div>
                   <div className={styles.mockupTitle}>dashboard.wajby.com - مراجعة القوانين</div>
                   <div className={styles.mockupSearch}>
                      <div className={styles.mockupSearchInner}></div>
                   </div>
                 </div>
                 <div className={styles.mockupBody}>
                    <div className={styles.mockupSidebar}>
                        <div className={styles.mockupSidebarItemActive}>
                          <LayoutDashboard size={14} />
                          <span>لوحة التحكم</span>
                        </div>
                        <div className={styles.mockupSidebarItem}>
                          <ClipboardList size={14} />
                          <span>الواجبات</span>
                        </div>
                        <div className={styles.mockupSidebarItem}>
                          <BarChart3 size={14} />
                          <span>النتائج</span>
                        </div>
                        <div className={styles.mockupSidebarItem}>
                          <Settings size={14} />
                          <span>الإعدادات</span>
                        </div>
                     </div>
                     <div className={styles.mockupMain}>
                       <div className={styles.mockupTopRow}>
                         <div className={styles.mockupCardGlow}>
                            <div className={styles.mockupTextHeading}>مراجعة قوانين الحركة</div>
                            <div className={styles.mockupTextSub}>بواسطة: أ. محمد علي • تم النشر</div>
                         </div>
                         <div className={styles.mockupStatCard}>
                            <Users size={20} color="var(--primary)" />
                            <div className={styles.mockupStatValue}>٤٢</div>
                            <div className={styles.mockupStatLabel}>طالب</div>
                         </div>
                       </div>
                       <div className={styles.mockupCardRow}>
                         <div className={styles.mockupSmallCard}>
                            <div className={styles.mockupTextHeading}>أداء الفصول</div>
                            <div className={styles.mockupChart}>
                               <div className={styles.bar1}></div>
                               <div className={styles.bar2}></div>
                               <div className={styles.bar3}></div>
                            </div>
                         </div>
                         <div className={styles.mockupSmallCard}>
                             <div className={styles.mockupTextHeading}>نتائج حديثة</div>
                             <div className={styles.mockupMiniList}>
                               <div className={styles.mockupListItem}>
                                 <div className={styles.mockupDot} style={{ background: 'var(--success)' }}></div>
                                 <span>أحمد محمد</span>
                                 <span className={styles.mockupListValue}>٩٥%</span>
                               </div>
                               <div className={styles.mockupListItem}>
                                 <div className={styles.mockupDot} style={{ background: 'var(--primary)' }}></div>
                                 <span>سارة خالد</span>
                                 <span className={styles.mockupListValue}>٨٨%</span>
                               </div>
                               <div className={styles.mockupListItem}>
                                 <div className={styles.mockupDot} style={{ background: 'var(--warning)' }}></div>
                                 <span>يوسف علي</span>
                                 <span className={styles.mockupListValue}>٧٢%</span>
                               </div>
                             </div>
                         </div>
                       </div>
                     </div>
                 </div>
                 <div className={styles.mockupCursor}>
                    <MousePointer2 size={24} fill="var(--primary)" color="white" />
                 </div>
               </div>
            </div>
          </div>
        </section>

        <section id="features-section" className={`container ${styles.featuresSection}`}>
            <div className={`${styles.sectionHeader} animate-fade-in-up`}>
               <h2 className={styles.sectionTitle}>لماذا واجبي هي اختيارك الأفضل؟</h2>
               <p className={styles.sectionSubtitle}>صُممت بعناية لتكون أسهل وأسرع وسيلة لإدارة واجباتك اليومية.</p>
            </div>
            
            <div className={styles.features}>
              <div 
                className={`${styles.featureCard} animate-fade-in-up`}
                onMouseEnter={() => playSound('click')}
                style={{ animationDelay: '0.1s' }}
              >
                <div className={styles.featureIconWrapper}>
                   <Zap className={styles.featureIcon} size={32} />
                </div>
                <h3>إنشاء سريع للغاية</h3>
                <p>بفضل واجهتنا البديهية، يمكنك كتابة أسئلتك ونشرها في أقل من 30 ثانية.</p>
              </div>
              
              <div 
                className={`${styles.featureCard} animate-fade-in-up`}
                onMouseEnter={() => playSound('click')}
                style={{ animationDelay: '0.2s' }}
              >
                <div className={styles.featureIconWrapper}>
                   <ExternalLink className={styles.featureIcon} size={32} />
                </div>
                <h3>مشاركة بنقرة واحدة</h3>
                <p>احصل على رابط مخصص للواجب وشاركه مباشرة عبر واتساب أو تليجرام.</p>
              </div>
              
              <div 
                className={`${styles.featureCard} animate-fade-in-up`}
                onMouseEnter={() => playSound('click')}
                style={{ animationDelay: '0.3s' }}
              >
                <div className={styles.featureIconWrapper}>
                   <ShieldCheck className={styles.featureIcon} size={32} />
                </div>
                <h3>دخول آمن وبسيط</h3>
                <p>لن يتعثر طلابك بكلمات المرور المعقدة، يكفي إدخال الاسم للبدء بخصوصية تامة.</p>
              </div>
              
              <div 
                className={`${styles.featureCard} animate-fade-in-up`}
                onMouseEnter={() => playSound('click')}
                style={{ animationDelay: '0.4s' }}
              >
                <div className={styles.featureIconWrapper}>
                   <BarChart3 className={styles.featureIcon} size={32} />
                </div>
                <h3>تحليل وتقييم فوري</h3>
                <p>راقب أداء فصلك بوضوح وتعرف على نقاط الضعف والقوة بلمحة بصر.</p>
              </div>
            </div>
        </section>
      </main>
    </>
  );
}
