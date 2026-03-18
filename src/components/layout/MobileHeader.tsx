"use client";
import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import styles from './MobileHeader.module.css';

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  return (
    <header className={styles.mobileHeader}>
      <button
        className={styles.menuBtn}
        onClick={onMenuOpen}
        aria-label="فتح القائمة"
      >
        <MenuIcon />
      </button>
      <div className={styles.logoPlaceholder}>
        <Logo hideTextOnMobile={true} />
      </div>
      <div className={styles.spacer} aria-hidden="true" style={{ display: 'flex', justifyContent: 'flex-end', paddingLeft: '1rem' }}>
        <ThemeToggle />
      </div>
    </header>
  );
}
