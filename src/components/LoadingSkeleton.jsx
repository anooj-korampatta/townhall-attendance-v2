export default function LoadingSkeleton({ className = '' }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />
}