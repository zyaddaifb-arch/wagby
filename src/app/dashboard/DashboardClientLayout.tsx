"use client";
import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { MobileHeader } from '../../components/layout/MobileHeader';
import styles from './layout.module.css';

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.mainWrapper}>
        <MobileHeader onMenuOpen={() => setSidebarOpen(true)} />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
