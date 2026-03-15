import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { WebMCPBadge } from '../WebMCPBadge';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logo}>
          <WebMCPBadge />
        </div>
        <nav className={styles.nav}>
          <Link href="/login" style={{ marginRight: '1rem' }}>
            <Button variant="outline" size="sm" data-testid="header-login-button">تسجيل الدخول</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" data-testid="header-signup-button">ابدأ كمدرس</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
