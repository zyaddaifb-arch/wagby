import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logo}>
          <Logo />
        </div>
        <nav className={styles.nav} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/login" style={{ marginRight: '1rem' }}>
            <Button variant="outline" size="sm" data-testid="header-login-button">تسجيل الدخول</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" data-testid="header-signup-button">ابدأ كمدرس</Button>
          </Link>
          <div style={{ marginRight: '0.5rem' }}>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
