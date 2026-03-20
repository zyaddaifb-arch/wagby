'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      padding: '2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background blobs for depth (matching landing page style) */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'var(--primary)',
        filter: 'blur(120px)',
        opacity: 0.1,
        zIndex: 0
      }}></div>

      <div style={{ zIndex: 1, maxWidth: '500px', width: '100%' }}>
        <h1 style={{
          fontSize: '8rem',
          fontWeight: 900,
          margin: 0,
          lineHeight: 1,
          background: 'var(--primary-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>404</h1>
        
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '1rem',
          color: 'var(--text-main)'
        }}>عذراً، الصفحة غير موجودة</h2>
        
        <p style={{
          color: 'var(--text-muted)',
          marginBottom: '2.5rem',
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}>
          يبدو أنك سلكت طريقاً خاطئاً. الصفحة التي تبحث عنها ربما تم نقلها أو حذفها.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/">
            <Button size="lg" className="premium-button">
              <Home size={18} style={{ marginLeft: '8px' }} />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
