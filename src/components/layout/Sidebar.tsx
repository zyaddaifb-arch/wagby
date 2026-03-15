"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/app/dashboard/LogoutButton';
import styles from './Sidebar.module.css';

// Simple SVG Icons
const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  Homework: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Create: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  Results: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  Close: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

const navItems: { id: string; name: string; href: string; icon: () => React.ReactNode }[] = [
  { id: 'nav-dashboard', name: 'لوحة التحكم', href: '/dashboard', icon: Icons.Dashboard },
  { id: 'nav-hw', name: 'الواجبات', href: '/dashboard/hw', icon: Icons.Homework },
  { id: 'nav-results', name: 'النتائج', href: '/dashboard/results', icon: Icons.Results },
  { id: 'nav-settings', name: 'الإعدادات', href: '/dashboard/settings', icon: Icons.Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = React.useState<{ full_name: string } | null>(null);

  // Close sidebar on route change on mobile
  React.useEffect(() => {
    if (onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  React.useEffect(() => {
    let channel: any;

    const fetchProfile = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Initial fetch
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        console.log('[Sidebar] Initial profile fetch:', data);
        setProfile(data);

        // Real-time subscription
        console.log('[Sidebar] Subscribing to profile changes for user:', user.id);
        channel = supabase
          .channel('public:profiles')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              console.log('[Sidebar] Real-time profile update received:', payload);
              if (payload.new && payload.new.full_name) {
                setProfile({ full_name: payload.new.full_name });
              }
            }
          )
          .subscribe((status: string) => {
            console.log('[Sidebar] Subscription status for public:profiles:', status);
          });
      }
    };

    fetchProfile();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const displayName = profile?.full_name || 'المدرس ';
  const initial = displayName.charAt(0);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          {/* Close button inside sidebar on mobile */}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            <Icons.Close />
          </button>
        </div>
        <nav className={styles.nav}>
          <div className={styles.navSectionTitle}>القائمة الرئيسية</div>
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
            const IconComponent = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                id={item.id}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <IconComponent />
                <span className={styles.navLabel}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <Link href="/dashboard/settings" className={styles.userProfileLink}>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>{initial}</div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{displayName}</p>
                <p className={styles.userPlan}>خطة مجانية</p>
              </div>
            </div>
          </Link>
          <div className={styles.logoutWrapper}>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
