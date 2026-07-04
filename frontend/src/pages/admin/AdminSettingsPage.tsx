import Navbar from '../../components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const settingsGroups = [
  {
    title: 'Workspace defaults',
    items: ['Default chat retention window', 'Assistant visibility for tool steps', 'Clinical badge styling'],
  },
  {
    title: 'Security controls',
    items: ['Forced password rotation', 'Session deletion policy', 'Admin-only review modes'],
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar title="Settings" subtitle="Configuration shell based on the Stitch design" />
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-8 lg:px-8">
        {settingsGroups.map((group) => (
          <Card key={group.title} className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {group.items.map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
