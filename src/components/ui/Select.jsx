import Label from './Label';

export default function Select({ label, options = [], children, className = '', ...props }) {
  const defaultClasses = "w-full text-gray-600 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors";

  return (
    <div className="w-full">
      {label && <Label>{label}</Label>}
      <select
        className={`${defaultClasses} ${className}`}
        {...props}
      >
        {children || options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
