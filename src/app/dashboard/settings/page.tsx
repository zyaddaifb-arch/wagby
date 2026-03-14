import React from 'react';
import styles from './settings.module.css';
import { SettingsForm } from './SettingsForm';
import { getUserProfile } from './actions';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>الإعدادات</h1>
        <p className={styles.subtitle}>تحكم في حسابك، مظهر المنصة، وسلوك الواجبات.</p>
      </div>

      <SettingsForm initialData={profile} />
    </div>
  );
}
