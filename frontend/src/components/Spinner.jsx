export default function Spinner({ className = 'w-4 h-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  );
}
