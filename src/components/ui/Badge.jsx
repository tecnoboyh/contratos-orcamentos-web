import clsx from 'clsx';

const variants = {
  default: 'bg-zinc-100 text-zinc-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  dark: 'bg-zinc-900 text-white'
};

export function Badge({ children, variant = 'default', className }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
