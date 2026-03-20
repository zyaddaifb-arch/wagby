'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from '../student.module.css';
import { playSound } from '@/utils/audio';
import { motion } from 'framer-motion';
import { User, Phone, ArrowLeft } from 'lucide-react';
import { checkStudentAttempt } from './actions';

export function StudentStartForm({ 
  shareCode,
  initialName = '',
  initialPhone = '',
  error,
  settings
}: { 
  shareCode: string;
  initialName?: string;
  initialPhone?: string;
  error?: string;
  settings?: {
    requirePhone?: boolean;
    optionalParentPhone?: boolean;
  };
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [parentPhone, setParentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    setter(cleaned);
  };

  const isPhoneRequired = settings?.requirePhone !== false; 
  const isParentPhoneRequired = settings?.optionalParentPhone === true;

  const isPhoneValid = !isPhoneRequired || phone.length === 11;
  const isParentPhoneValid = !isParentPhoneRequired || parentPhone.length === 11;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && isPhoneValid && isParentPhoneValid) {
      setIsSubmitting(true);
      
      try {
        // Check if student should be redirected to results
        const check = await checkStudentAttempt(shareCode, name.trim(), phone);
        
        if (!check.canAttempt && check.lastSubmissionId) {
          router.push(`/hw/${shareCode}/result?sub=${check.lastSubmissionId}`);
          return;
        }

        playSound('success');
        let url = `/hw/${shareCode}/solve?name=${encodeURIComponent(name.trim())}`;
        if (isPhoneRequired) url += `&phone=${encodeURIComponent(phone)}`;
        if (isParentPhoneRequired) url += `&parentPhone=${encodeURIComponent(parentPhone)}`;
        router.push(url);
      } catch (err) {
        console.error('Error starting homework:', err);
        setIsSubmitting(false);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  return (
    <motion.form 
      className={styles.form} 
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {(error === 'duplicate' || error === 'limit_reached') && (
        <motion.div className={styles.errorBox} variants={itemVariants}>
          <div>
            {error === 'limit_reached' 
              ? `لقد استنفذت جميع المحاولات المتاحة لهذا الواجب برقم الهاتف (${phone}).`
              : `لقد قمت بتسليم هذا الواجب مسبقاً بنفس رقم الهاتف (${phone}).`}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            يرجى مراجعة الرقم أو التواصل مع معلمك.
          </div>
          {error === 'duplicate' && (
             <Button 
               variant="outline" 
               className={styles.errorButton}
               onClick={() => {
                 setPhone('');
                 const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
                 if (phoneInput) phoneInput.focus();
               }}
             >
               تعديل رقم الهاتف
             </Button>
          )}
        </motion.div>
      )}

      <motion.div className={styles.instructionsText} variants={itemVariants}>
        {isPhoneRequired ? 'أدخل اسمك ورقم هاتفك لبدء حل الواجب' : 'أدخل اسمك لبدء حل الواجب'}
      </motion.div>

      <div className={styles.inputGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <motion.div className={styles.inputWithIcon} variants={itemVariants}>
          <User className={styles.inputIcon} size={20} />
          <Input 
            data-testid="student-name-input"
            placeholder="اكتب اسمك الثلاثي" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
            autoFocus
            disabled={isSubmitting}
            className={styles.premiumInput}
          />
        </motion.div>
        
        {isPhoneRequired && (
          <motion.div className={styles.inputWithIcon} variants={itemVariants}>
            <Phone className={styles.inputIcon} size={20} />
            <Input 
              data-testid="student-phone-input"
              placeholder="رقم الموبايل (11 رقم)" 
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e, setPhone)}
              required 
              disabled={isSubmitting}
              maxLength={11}
              className={styles.premiumInput}
            />
            {phone.length > 0 && phone.length < 11 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '4px', display: 'block', paddingRight: '1rem' }}>
                يتبقى {11 - phone.length} أرقام
              </span>
            )}
          </motion.div>
        )}

        {isParentPhoneRequired && (
          <motion.div className={styles.inputWithIcon} variants={itemVariants}>
            <Phone className={styles.inputIcon} size={20} />
            <Input 
              data-testid="parent-phone-input"
              placeholder="رقم موبايل ولي الأمر (11 رقم)" 
              type="tel"
              value={parentPhone}
              onChange={(e) => handlePhoneChange(e, setParentPhone)}
              required 
              disabled={isSubmitting}
              maxLength={11}
              className={styles.premiumInput}
            />
            {parentPhone.length > 0 && parentPhone.length < 11 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '4px', display: 'block', paddingRight: '1rem' }}>
                يتبقى {11 - parentPhone.length} أرقام
              </span>
            )}
          </motion.div>
        )}
      </div>

      <motion.div variants={itemVariants} style={{ marginTop: '0.5rem' }}>
        <Button 
          data-testid="start-quiz-btn"
          fullWidth 
          size="lg" 
          className={styles.actionBtn} 
          type="submit"
          disabled={!name.trim() || !isPhoneValid || !isParentPhoneValid || isSubmitting}
        >
          {isSubmitting ? 'جاري التحميل...' : 'ابدأ حل الواجب'}
        </Button>
      </motion.div>
    </motion.form>
  );
}
