import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    
    const togglePassword = () => setShowPassword(!showPassword);
    
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`${styles.wrapper} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputContainer}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <input
            ref={ref}
            type={inputType}
            className={`${styles.input} ${error ? styles.inputError : ''} ${icon ? styles.withIcon : ''} ${isPassword ? styles.withPasswordToggle : ''}`}
            suppressHydrationWarning
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={togglePassword}
              className={styles.passwordToggle}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
