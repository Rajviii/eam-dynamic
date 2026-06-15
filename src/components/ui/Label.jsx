export default function Label({ children, className = '', ...props }) {
  return (
    <label 
      className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
