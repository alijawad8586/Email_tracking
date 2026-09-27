export const dynamic = 'force-dynamic'

export default function EmailsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Inbox</h1>
      <p className="text-gray-600 mb-8">Your Gmail emails will appear here once Gmail is connected.</p>
      <div className="bg-white rounded-lg shadow p-8 text-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No emails yet. Connect your Gmail account to get started.</p>
      </div>
    </div>
  )
}
