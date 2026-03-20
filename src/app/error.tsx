'use client';

import React, { useEffect } from 'react';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          color: 'var(--danger)'
        }}>
          <AlertCircle size={40} />
        </div>

        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'var(--text-main)'
        }}>حدث خطأ غير متوقع</h1>
        
        <p style={{
          color: 'var(--text-muted)',
          marginBottom: '2.5rem',
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}>
          نعتذر عن هذا الإزعاج. واجه النظام مشكلة تقنية مفاجئة. حاول إعادة تحميل الصفحة أو العودة لاحقاً.
        </p>
        
        <Button 
          size="lg" 
          variant="primary" 
          onClick={() => reset()}
          style={{ width: '100%', maxWidth: '200px' }}
        >
          <RefreshCcw size={18} style={{ marginLeft: '8px' }} />
          إعادة المحاولة
        </Button>

        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'var(--glass-bg)',
            borderRadius: '12px',
            textAlign: 'left',
            fontSize: '0.8rem',
            color: 'var(--danger)',
            border: '1px solid var(--border)',
            overflowX: 'auto'
          }}>
            <code>{error.message}</code>
          </div>
        )}
      </div>
    </div>
  );
}
