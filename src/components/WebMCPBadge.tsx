"use client";
import React, { useEffect, useState } from 'react';
import styles from './WebMCPBadge.module.css';
import { Sparkles } from 'lucide-react';

export function WebMCPBadge() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if WebMCP is supported
    if (typeof window !== 'undefined' && 'modelContext' in navigator) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className={styles.badgeWrapper}>
      <div className={styles.badge}>
        <Sparkles size={12} className={styles.icon} />
        <span>+ WebMCP Enabled</span>
      </div>
      <div className={styles.glowEffect}></div>
    </div>
  );
}
