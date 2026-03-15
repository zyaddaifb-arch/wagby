'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { playSound } from '@/utils/audio';
import styles from './settings.module.css';
import { updateProfile, UserSettings, deleteAccount } from './actions';
import { logout } from '@/app/auth/actions';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';

interface SettingsFormProps {
  initialData: any;
}

const DEFAULT_SETTINGS: UserSettings = {
  appearance: {
    theme: 'dark',
    themeColor: '#1e3a8a',
    fontSize: 'medium',
    uiDecorations: true,
  },
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
  notifications: {
    onSubmission: true,
    dailyReport: false,
    weeklyReport: true,
    email: true,
    whatsapp: false,
  },
  privacy: {
    linkOnly: true,
    preventDuplicates: true,
    requirePhone: false,
    optionalParentPhone: false,
  },
  branding: {
    publicName: '',
    welcomeMessage: 'أهلاً بك في الواجب!',
    finalMessage: 'أحسنت! تم إرسال إجاباتك بنجاح.',
    customColors: false,
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
            { id: 'appearance', label: 'المظهر', icon: '🎨' },
            { id: 'homework', label: 'سلوك الواجبات', icon: '📝' },
            { id: 'notifications', label: 'التنبيهات', icon: '🔔' },
            { id: 'privacy', label: 'الخصوصية والأمان', icon: '🔒' },
            { id: 'branding', label: 'الهوية البصرية', icon: '✨' },
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
            <CardContent style={{ padding: '2rem' }}>
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
                    onClick={() => alert('ميزة تغيير كلمة المرور ستتوفر قريباً في التحديث القادم!')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    تغيير كلمة المرور
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
            <CardContent style={{ padding: '2rem' }}>
              <h2 className={styles.sectionTitle}>المظهر</h2>
              <div className={styles.fieldGroup}>
                <Select
                  label="السمة (Theme)"
                  value={formData.settings.appearance.theme}
                  onChange={(val) => updateSettings('appearance.theme', val)}
                  options={[
                    { label: 'داكن (Dark)', value: 'dark' },
                    { label: 'فاتح (Light)', value: 'light' },
                  ]}
                />
                <div className={styles.grid2cols}>
                  <Select
                    label="حجم الخط"
                    value={formData.settings.appearance.fontSize}
                    onChange={(val) => updateSettings('appearance.fontSize', val)}
                    options={[
                      { label: 'صغير', value: 'small' },
                      { label: 'متوسط', value: 'medium' },
                      { label: 'كبير', value: 'large' },
                    ]}
                  />
                  <Input
                    label="لون السمة الرئيسي"
                    type="color"
                    value={formData.settings.appearance.themeColor}
                    onChange={(e) => updateSettings('appearance.themeColor', e.target.value)}
                  />
                </div>
                <Switch
                  label="تفعيل الزخارف والرسوم التوضيحية"
                  checked={formData.settings.appearance.uiDecorations}
                  onChange={(val) => updateSettings('appearance.uiDecorations', val)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Homework Behavior Section */}
        <div id="homework" className={styles.section}>
          <Card className={styles.sectionCard}>
            <CardContent style={{ padding: '2rem' }}>
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
                      label="أقصى عدد للمحاولات"
                      type="number"
                      value={formData.settings.homework.maxAttempts}
                      onChange={(e) => updateSettings('homework.maxAttempts', parseInt(e.target.value))}
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
                    { label: 'سؤال تلو الآخر (Wizard)', value: 'wizard' },
                    { label: 'جميع الأسئلة في صفحة واحدة', value: 'scroll' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Section */}
        <div id="notifications" className={styles.section}>
          <Card className={styles.sectionCard}>
            <CardContent style={{ padding: '2rem' }}>
              <h2 className={styles.sectionTitle}>التنبيهات</h2>
              <div className={styles.fieldGroup}>
                <Switch
                  label="تنبيه عند تسليم طالب للواجب"
                  checked={formData.settings.notifications.onSubmission}
                  onChange={(val) => updateSettings('notifications.onSubmission', val)}
                />
                <Switch
                  label="تقرير يومي بالنتائج"
                  checked={formData.settings.notifications.dailyReport}
                  onChange={(val) => updateSettings('notifications.dailyReport', val)}
                />
                <Switch
                  label="تقرير أسبوعي شامل"
                  checked={formData.settings.notifications.weeklyReport}
                  onChange={(val) => updateSettings('notifications.weeklyReport', val)}
                />
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                <Switch
                  label="إشعارات البريد الإلكتروني"
                  checked={formData.settings.notifications.email}
                  onChange={(val) => updateSettings('notifications.email', val)}
                />
                <Switch
                  label="إشعارات واتساب (قريباً)"
                  checked={formData.settings.notifications.whatsapp}
                  onChange={(val) => updateSettings('notifications.whatsapp', val)}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Section */}
        <div id="privacy" className={styles.section}>
             <Card className={styles.sectionCard}>
                <CardContent style={{ padding: '2rem' }}>
                <h2 className={styles.sectionTitle}>الخصوصية والأمان</h2>
                <div className={styles.fieldGroup}>
                    <Switch
                        label="الوصول عبر الرابط المباشر فقط"
                        checked={formData.settings.privacy.linkOnly}
                        onChange={(val) => updateSettings('privacy.linkOnly', val)}
                    />
                    <Switch
                        label="منع التكرار (تسليمة واحدة لكل طالب)"
                        checked={formData.settings.privacy.preventDuplicates}
                        onChange={(val) => updateSettings('privacy.preventDuplicates', val)}
                    />
                    <Switch
                        label="طلب رقم هاتف الطالب قبل البدء"
                        checked={formData.settings.privacy.requirePhone}
                        onChange={(val) => updateSettings('privacy.requirePhone', val)}
                    />
                    <Switch
                        label="إضافة رقم ولي الأمر (اختياري)"
                        checked={formData.settings.privacy.optionalParentPhone}
                        onChange={(val) => updateSettings('privacy.optionalParentPhone', val)}
                    />
                </div>
                </CardContent>
            </Card>
        </div>

        {/* Branding Section */}
        <div id="branding" className={styles.section}>
             <Card className={styles.sectionCard}>
                <CardContent style={{ padding: '2rem' }}>
                <h2 className={styles.sectionTitle}>الهوية البصرية</h2>
                <div className={styles.fieldGroup}>
                    <Input
                        label="اسم المدرس (يظهر للظلال)"
                        placeholder="مثال: أ. محمد أحمد"
                        value={formData.settings.branding.publicName}
                        onChange={(e) => updateSettings('branding.publicName', e.target.value)}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>رسالة الترحيب</label>
                        <textarea 
                            value={formData.settings.branding.welcomeMessage}
                            onChange={(e) => updateSettings('branding.welcomeMessage', e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', height: '80px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>رسالة النهاية</label>
                        <textarea 
                            value={formData.settings.branding.finalMessage}
                            onChange={(e) => updateSettings('branding.finalMessage', e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', height: '80px' }}
                        />
                    </div>
                </div>
                </CardContent>
            </Card>
        </div>

        {/* Danger Zone */}
        <Card className={`${styles.sectionCard} ${styles.dangerSection}`}>
          <CardContent style={{ padding: '2rem' }}>
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
    </div>
  );
}
