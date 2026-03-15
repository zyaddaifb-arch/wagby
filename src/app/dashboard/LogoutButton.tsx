'use client';
import { Button } from '@/components/ui/Button';
import { logout } from '@/app/auth/actions';

export function LogoutButton() {
  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLogout}
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
  )
}
