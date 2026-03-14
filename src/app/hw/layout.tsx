import React from 'react';
import styles from './student.module.css';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
