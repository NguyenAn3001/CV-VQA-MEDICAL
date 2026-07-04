import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ActivitySquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import type { AuthTokens } from '../../types/models';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<AuthTokens>('/auth/login', {
        username,
        password,
      });

      setAuth(response.data);

      if (response.data.must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] bg-[#f7f9fb] lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hidden border-r border-slate-200 bg-white px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
            <ActivitySquare className="h-4 w-4 text-[#2563eb]" />
            Clinical Clarity Workspace
          </div>
          <div className="mt-10 max-w-xl">
            <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
              Image-grounded medical reasoning with a calmer interface.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
              Review scans, continue prior diagnostic conversations, and supervise assistant reasoning in a structured clinical workspace.
            </p>
          </div>
        </div>
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-[#f8fafc] p-6">
          <div className="text-sm font-medium text-slate-900">Built for clinical review</div>
          <div className="grid gap-3 text-sm text-slate-500">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">Track session history across scans and follow-up questions.</div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">Stream assistant output with tool visibility for image analysis steps.</div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">Segment operational views for admins, clinicians, and support users.</div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 lg:px-8">
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-semibold text-slate-900">Sign in</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Access your MedVQA workspace using your clinical account credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]" disabled={loading}>
                {loading ? 'Signing in...' : 'Continue'}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Need an account?{' '}
              <Link to="/register" className="font-medium text-slate-900 hover:text-[#2563eb]">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
