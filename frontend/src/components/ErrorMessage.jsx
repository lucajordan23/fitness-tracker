export default function ErrorMessage({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
      <p className="font-medium">Errore</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}
