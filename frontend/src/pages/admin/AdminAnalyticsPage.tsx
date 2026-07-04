import Navbar from '../../components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const metrics = [
  { label: 'Active clinicians', value: '24', detail: 'Estimated from current workspace access.' },
  { label: 'Sessions reviewed', value: '138', detail: 'Design placeholder until analytics endpoints are added.' },
  { label: 'Median response time', value: '2.8s', detail: 'Static shell matching the Stitch screen family.' },
  { label: 'Flagged errors', value: '3', detail: 'Reserved for future backend monitoring feed.' },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar title="Analytics" subtitle="Operational overview for the MedVQA workspace" />
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">{metric.value}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{metric.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
