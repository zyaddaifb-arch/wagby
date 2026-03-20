'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { playSound } from '@/utils/audio';
import styles from './settings.module.css';
import { updateProfile, UserSettings, deleteAccount, updatePassword } from './actions';
import { logout } from '@/app/auth/actions';
import { LogOut, Trash2, AlertTriangle, Key, Sun, Moon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useTheme } from 'next-themes';

interface SettingsFormProps {
  initialData: any;
}

const DEFAULT_SETTINGS: UserSettings = {
  homework: {
    showResult: 'immediate',
    showCorrectAnswers: true,
    showRanking: true,
    allowMultipleAttempts: false,
    maxAttempts: 1,
    randomizeQuestions: false,
    randomizeAnswers: false,
    layout: 'wizard',
  },
  privacy: {
    requirePhone: true,
    optionalParentPhone: false,
  },
};

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [activeSection, setActiveSection] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: initialData?.full_name || '',
    phoneNumber: initialData?.phone_number || '',
    subject: initialData?.subject || '',
    settings: { ...DEFAULT_SETTINGS, ...(initialData?.settings || {}) } as UserSettings,
  });
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccess(false);
    setError(null);
    playSound('pop');

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccess(true);
      playSound('success');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'فشل حفظ الإعدادات');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    playSound('pop');
    console.log('[SettingsForm] Initiating logout...');
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    console.log('[SettingsForm] Logged out from Supabase, redirecting...');
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    playSound('pop');
    const confirmed = confirm('⚠️ تنبيه هام: هل أنت متأكد من حذف حسابك نهائياً؟ سيتم حذف كافة بياناتك وواجباتك ولا يمكن التراجع عن هذه الخطوة.');
    
    if (confirmed) {
      setIsSaving(true);
      setError(null);
      const result = await deleteAccount();
      if (result.success) {
        playSound('success');
        window.location.href = '/';
      } else {
        setError(result.error || 'فشل حذف الحساب');
        setIsSaving(false);
      }
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('كلمات المرور غير متطابقة');
      playSound('error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('يجب أن لا تقل كلمة المرور عن 6 أحرف');
      playSound('error');
      return;
    }

    setIsSaving(true);
    const result = await updatePassword(passwordData.newPassword);
    setIsSaving(false);

    if (result.success) {
      setPasswordSuccess(true);
      playSound('success');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } else {
      setPasswordError(result.error || 'فشل تغيير كلمة المرور');
      playSound('error');
    }
  };

  const handleReset = () => {
    playSound('pop');
    setFormData({
      fullName: initialData?.full_name || '',
      phoneNumber: initialData?.phone_number || '',
      subject: initialData?.subject || '',
      settings: { ...DEFAULT_SETTINGS, ...(initialData?.settings || {}) } as UserSettings,
    });
  };

  const updateSettings = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev.settings));
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return { ...prev, settings: newSettings };
    });
  };

  return (
    <div className={styles.formGrid}>
      {/* Navigation Sidebar */}
      <Card className={styles.navCard}>
        <CardContent className={styles.navMenu}>
          {[
            { id: 'account', label: 'الحساب', icon: '👤' },
            { id: 'appearance', label: 'المظهر', icon: '✨' },
            { id: 'homework', label: 'سلوك الواجبات', icon: '📝' },
            { id: 'privacy', label: 'الخصوصية والأمان', icon: '🔒' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                console.log('[SettingsForm] Active section set to:', item.id);
                // Wrap in setTimeout to ensure section is rendered or state is applied
                setTimeout(() => {
                  const element = document.getElementById(item.id);
                  if (element) {
                    const offset = 100; // Offset for sticky headers
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    console.log('[SettingsForm] Element found. Scrolling to:', offsetPosition);
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  } else {
                    console.error('[SettingsForm] Element with ID not found:', item.id);
                  }
                }, 100);
              }}
              className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Sections */}
      <div className={styles.sections}>
        {/* Account Section */}
        <div id="account" className={styles.section}>
          <Card className={styles.sectionCard}>
            <CardContent className={styles.sectionContent}>
              <h2 className={styles.sectionTitle}>إعدادات الحساب</h2>
              <div className={styles.fieldGroup}>
                <div className={styles.grid2cols}>
                  <Input
                    label="الاسم الكامل"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  <Input
                    label="البريد الإلكتروني"
                    value={initialData?.email || ''}
                    disabled
                  />
                </div>
                <div className={styles.grid2cols}>
                  <Input
                    label="رقم الهاتف"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                  <Input
                    label="المادة الدراسية"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                        setIsPasswordModalOpen(true);
                        playSound('pop');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Key size={18} /> تغيير كلمة المرور
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    <LogOut size={18} /> تسجيل الخروج
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Appearance Section */}
        <div id="appearance" className={styles.section}>
          <Card className={styles.sectionCard}>
            <CardContent className={styles.sectionContent}>
              <h2 className={styles.sectionTitle}>مظهر المنصة</h2>
              <div className={styles.fieldGroup}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {theme === 'dark' ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
                    <div>
                      <p style={{ fontWeight: 800, margin: 0 }}>الوضع {theme === 'dark' ? 'الليلي' : 'النهاري'}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: 0 }}>تغيير مظهر لوحة التحكم</p>
                    </div>
                  </div>
                  {mounted && (
                    <Switch 
                      checked={theme === 'dark'} 
                      onChange={(isDark) => {
                        setTheme(isDark ? 'dark' : 'light');
                        playSound('click');
                      }} 
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Homework Behavior Section */}
        <div id="homework" className={styles.section}>
          <Card className={styles.sectionCard}>
            <CardContent className={styles.sectionContent}>
              <h2 className={styles.sectionTitle}>سلوك الواجبات</h2>
              <div className={styles.fieldGroup}>
                <Select
                  label="عرض النتيجة للطالب"
                  value={formData.settings.homework.showResult}
                  onChange={(val) => updateSettings('homework.showResult', val)}
                  options={[
                    { label: 'مباشرة بعد التسليم', value: 'immediate' },
                    { label: 'إخفاء النتيجة', value: 'hidden' },
                  ]}
                />
                <div className={styles.grid2cols}>
                  <Switch
                    label="عرض الإجابات الصحيحة"
                    checked={formData.settings.homework.showCorrectAnswers}
                    onChange={(val) => updateSettings('homework.showCorrectAnswers', val)}
                  />
                  <Switch
                    label="عرض ترتيب الطلاب"
                    checked={formData.settings.homework.showRanking}
                    onChange={(val) => updateSettings('homework.showRanking', val)}
                  />
                </div>
                <div className={styles.grid2cols}>
                  <Switch
                    label="تعدد المحاولات"
                    checked={formData.settings.homework.allowMultipleAttempts}
                    onChange={(val) => updateSettings('homework.allowMultipleAttempts', val)}
                  />
                  {formData.settings.homework.allowMultipleAttempts && (
                    <Input
                      label="أقصى عدد من المحاولات (0 = غير محدود)" 
                      type="number"
                      min={0}
                      value={formData.settings.homework.maxAttempts}
                      onChange={(e) => updateSettings('homework.maxAttempts', parseInt(e.target.value) || 0)}
                    />
                  )}
                </div>
                <div className={styles.grid2cols}>
                     <Switch
                        label="عشوائية ترتيب الأسئلة"
                        checked={formData.settings.homework.randomizeQuestions}
                        onChange={(val) => updateSettings('homework.randomizeQuestions', val)}
                    />
                    <Switch
                        label="عشوائية ترتيب الخيارات"
                        checked={formData.settings.homework.randomizeAnswers}
                        onChange={(val) => updateSettings('homework.randomizeAnswers', val)}
                    />
                </div>
                <Select
                  label="طريقة عرض الأسئلة"
                  value={formData.settings.homework.layout}
                  onChange={(val) => updateSettings('homework.layout', val)}
                  options={[
                    { label: 'سؤال تلو الآخر', value: 'wizard' },
                    { label: 'جميع الأسئلة في صفحة واحدة', value: 'scroll' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Section */}
        <div id="privacy" className={styles.section}>
             <Card className={styles.sectionCard}>
                <CardContent className={styles.sectionContent}>
                <h2 className={styles.sectionTitle}>الخصوصية والأمان</h2>
                <div className={styles.fieldGroup}>
                    <Switch
                        label="طلب رقم هاتف الطالب قبل البدء"
                        checked={formData.settings.privacy.requirePhone}
                        onChange={(val) => updateSettings('privacy.requirePhone', val)}
                    />
                    <Switch
                        label="طلب رقم ولي أمر الطالب"
                        checked={formData.settings.privacy.optionalParentPhone}
                        onChange={(val) => updateSettings('privacy.optionalParentPhone', val)}
                    />
                </div>
                </CardContent>
            </Card>
        </div>

        {/* Danger Zone */}
        <Card className={`${styles.sectionCard} ${styles.dangerSection}`}>
          <CardContent className={styles.sectionContent}>
            <h2 className={styles.sectionTitle} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} /> منطقة الخطر
            </h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
              بمجرد حذف حسابك، سيتم مسح كافة البيانات والواجبات المرتبطة به بشكل نهائي. تأكد من أنك لست بحاجة إلى أي بيانات قبل المتابعة.
            </p>
            <Button 
              variant="outline" 
              className={styles.deleteBtn}
              onClick={handleDeleteAccount}
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Trash2 size={18} /> {isSaving ? 'جاري الحذف...' : 'حذف الحساب نهائياً'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Persistence Controls Footer */}
      <div className={styles.footer}>
        {error && <span style={{ color: 'var(--danger)', marginLeft: 'auto', fontWeight: '600' }}>{error}</span>}
        {success && <span style={{ color: 'var(--success)', marginLeft: 'auto', fontWeight: '600' }}>✅ تم حفظ التغييرات بنجاح</span>}
        <Button variant="outline" onClick={handleReset} disabled={isSaving}>إعادة ضبط</Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {/* Change Password Modal */}
      <Modal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        title="تغيير كلمة المرور"
      >
        <div className={styles.fieldGroup} style={{ gap: '1.5rem' }}>
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            autoComplete="new-password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="أدخل كلمة المرور الجديدة"
          />
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            autoComplete="new-password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            placeholder="أعد كتابة كلمة المرور"
          />
          
          {passwordError && (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>
              {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div style={{ color: 'var(--success)', fontSize: '0.9rem', textAlign: 'center' }}>
              ✅ تم تغيير كلمة المرور بنجاح
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button 
              variant="primary" 
              onClick={handleChangePassword} 
              disabled={isSaving || !passwordData.newPassword || !passwordData.confirmPassword}
              style={{ flex: 1 }}
            >
              {isSaving ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsPasswordModalOpen(false)}
              style={{ flex: 1 }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
