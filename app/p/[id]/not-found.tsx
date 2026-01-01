export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Paste Not Found</h1>
          <p className="text-gray-700 mb-4">
            This paste does not exist, has expired, or has reached its view limit.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Create a new paste
          </a>
        </div>
      </div>
    </div>
  );
}