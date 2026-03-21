import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';
import { Logo } from '../ui/Logo';
import { Heart, Mail, HelpCircle, Shield, FileText } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logoWrapper}>
              <Logo />
            </div>
            <p className={styles.description}>
              الجيل الجديد من منصات إدارة التعليم. صُنع خصيصاً ليمنح المعلم وقته الثمين مرة أخرى.
            </p>
          </div>

          <div className={styles.linksColumn}>
            <h4 className={styles.columnTitle}>المنصة</h4>
            <ul className={styles.linkList}>
              <li><Link href="#features-section">المميزات</Link></li>
              <li><Link href="/about">عن واجبي</Link></li>
              <li><Link href="/pricing">التسعير</Link></li>
            </ul>
          </div>

          <div className={styles.linksColumn}>
            <h4 className={styles.columnTitle}>الدعم</h4>
            <ul className={styles.linkList}>
              <li><Link href="/faq"><HelpCircle size={14} /> الأسئلة الشائعة</Link></li>
              <li><Link href="mailto:support@wajby.com"><Mail size={14} /> اتصل بنا</Link></li>
              <li><Link href="/privacy"><Shield size={14} /> الخصوصية</Link></li>
            </ul>
          </div>

          <div className={styles.ctaColumn}>
             <h4 className={styles.columnTitle}>مستعد للبدء؟</h4>
             <Link href="/signup" className={styles.footerCta}>
               اشترك الآن مجاناً
             </Link>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            جميع الحقوق محفوظة {currentYear} © لمنصة واجبي
          </div>
          <div className={styles.madeWith}>
            صُنع بـ <Heart size={14} className={styles.heartIcon} /> من أجل تعليم أفضل
          </div>
        </div>
      </div>
    </footer>
  );
}
