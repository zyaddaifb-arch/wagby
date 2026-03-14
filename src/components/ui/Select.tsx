'use client';
import React from 'react';
import styles from './Select.module.css';

interface SelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: { label: string; value: string | number }[];
  label?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ value, onChange, options, label, disabled }) => {
  return (
    <div className={styles.selectWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectContainer}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={styles.nativeSelect}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className={styles.chevron}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
};
