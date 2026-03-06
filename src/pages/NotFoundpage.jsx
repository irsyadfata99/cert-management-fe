export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl font-semibold text-foreground mt-2">
          Page Not Found
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}
