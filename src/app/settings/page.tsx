export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gmail Connection</h2>
          <button className="text-blue-600 hover:text-blue-700">Connect Gmail</button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Settings</h2>
          <button className="text-blue-600 hover:text-blue-700">Configure AI</button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Info</h2>
          <button className="text-blue-600 hover:text-blue-700">Update Profile</button>
        </div>
      </div>
    </div>
  )
}
