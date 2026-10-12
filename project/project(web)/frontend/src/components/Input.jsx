import React from 'react';

export function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helpText,
  required = false,
  min,
  max,
  step,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--critical-red)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="form-control"
        style={error ? { borderColor: 'var(--critical-red)' } : {}}
        {...props}
      />
      {helpText && !error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {helpText}
        </p>
      )}
      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--critical-red)', marginTop: '0.25rem', fontWeight: '500' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
  helpText,
  required = false,
  rows = 3,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--critical-red)' }}>*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        disabled={disabled}
        className="form-control"
        style={error ? { borderColor: 'var(--critical-red)' } : {}}
        {...props}
      />
      {helpText && !error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {helpText}
        </p>
      )}
      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--critical-red)', marginTop: '0.25rem', fontWeight: '500' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  helpText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--critical-red)' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="form-control"
        style={error ? { borderColor: 'var(--critical-red)' } : {}}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {helpText && !error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {helpText}
        </p>
      )}
      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--critical-red)', marginTop: '0.25rem', fontWeight: '500' }}>
          {error}
        </p>
      )}
    </div>
  );
}
