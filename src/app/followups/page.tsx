export const dynamic = 'force-dynamic'

export default function FollowupsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Follow-ups</h1>
      <p className="text-gray-600 mb-8">Track and manage follow-ups for your leads.</p>
      <div className="bg-white rounded-lg shadow p-8 text-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No follow-ups scheduled yet.</p>
      </div>
    </div>
  )
}
