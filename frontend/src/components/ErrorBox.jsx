export default function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-semibold">{error.userMessage || error.message}</p>
      {Array.isArray(error.details) && (
        <ul className="mt-1 list-disc pl-5">
          {error.details.map((d, i) => (
            <li key={i}>{d.field}: {d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}