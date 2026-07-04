import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatStore } from '../../store/chatStore';
import type { ChatSessionDetail } from '../../types/models';

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const fetchSessionDetail = useChatStore((state) => state.fetchSessionDetail);
  const [detail, setDetail] = useState<ChatSessionDetail | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    fetchSessionDetail(sessionId).then((response) => setDetail(response));
  }, [fetchSessionDetail, sessionId]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar title={detail?.title || 'Session detail'} subtitle="Full conversation review" />
      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Transcript</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {detail?.messages?.map((message, index) => (
              <div key={message.id || index} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{message.role}</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{message.content}</p>
              </div>
            ))}
            {!detail?.messages?.length ? <div className="text-sm text-slate-500">No messages available.</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
