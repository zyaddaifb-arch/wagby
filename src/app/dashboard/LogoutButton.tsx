'use client';
import { Button } from '@/components/ui/Button';
import { logout } from '@/app/auth/actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button 
        variant="ghost" 
        size="sm" 
        type="submit" 
        fullWidth
        style={{ 
          color: 'var(--danger)', 
          fontWeight: 800,
          opacity: 0.8,
          justifyContent: 'flex-start',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem'
        }}
      >
        <span style={{ marginLeft: '0.5rem' }}>🚪</span>
        تسجيل الخروج
      </Button>
    </form>
  )
}
