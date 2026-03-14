import React from 'react';
import styles from '../student.module.css';

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
      <footer style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--muted-foreground)',
        opacity: 0.5,
        zIndex: 10
      }}>
        بواسطة ذاكرلي | Zakerly
      </footer>
    </div>
  );
}
