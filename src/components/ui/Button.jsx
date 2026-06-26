import clsx from 'clsx';

const variants = {
  primary: 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm',
  secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50',
  ghost: 'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
};

export function Button({ children, variant = 'primary', className, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        'focus:outline-none focus:ring-2 focus:ring-zinc-900/10',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
