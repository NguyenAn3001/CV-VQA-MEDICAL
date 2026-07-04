import Navbar from '../../components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatStore } from '../../store/chatStore';

export default function AdminSessionsPage() {
  const sessions = useChatStore((state) => state.sessions);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar title="Sessions" subtitle="Current session inventory visible in this frontend shell" />
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Session registry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Messages</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-t border-slate-200 text-slate-700">
                      <td className="px-4 py-3">{session.title}</td>
                      <td className="px-4 py-3">{session.message_count}</td>
                      <td className="px-4 py-3">{session.updated_at || '-'}</td>
                    </tr>
                  ))}
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        No sessions loaded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
