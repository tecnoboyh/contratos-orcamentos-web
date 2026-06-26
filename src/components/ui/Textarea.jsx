import clsx from 'clsx';

export function Textarea({ label, error, className, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-zinc-700">{label}</span>}

      <textarea
        className={clsx(
          'min-h-28 w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition',
          'placeholder:text-zinc-400',
          error
            ? 'border-red-300 ring-3 ring-red-100'
            : 'border-zinc-200 focus:border-zinc-400 focus:ring-3 focus:ring-zinc-100',
          className
        )}
        {...props}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </label>
  );
}
