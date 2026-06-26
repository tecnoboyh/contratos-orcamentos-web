import clsx from 'clsx';

export function Card({ children, className }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur',
        className
      )}
    >
      {children}
    </div>
  );
}
