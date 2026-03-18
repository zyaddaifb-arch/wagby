import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Logo.module.css';

interface LogoProps {
  className?: string;
  hideTextOnMobile?: boolean;
}

export function Logo({ className = '', hideTextOnMobile = false }: LogoProps) {
  return (
    <Link href="/" className={`${styles.logoContainer} ${className}`}>
      <div className={styles.imageWrapper}>
        <Image 
          src="/logo.png" 
          alt="شعار واجبي" 
          width={40} 
          height={40}
          priority
        />
      </div>
      <span className={`${styles.logoText} ${hideTextOnMobile ? styles.hideOnMobile : ''}`}>
        واجبي
      </span>
    </Link>
  );
}
