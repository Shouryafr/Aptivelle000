import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Button, Card, Field, PageTitle } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [pass, setPass] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState({});
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const roleLabel =
    user?.role === 'STUDENT' ? 'Student' : user?.role === 'FACULTY' ? 'Faculty / TPO' : user?.role === 'RECRUITER' ? 'Recruiter' : '';

  const saveName = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setErr((x) => ({ ...x, name: 'Name must be at least 2 characters' }));
      return;
    }
    setSavingName(true);
    try {
      await api.patch('/auth/me', { name: name.trim() });
      await refreshMe();
      toast('Profile name updated.');
    } catch (e2) {
      toast(e2.message, 'error');
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const nextErr = {};
    if (pass.next.length < 6) nextErr.next = 'New password must be at least 6 characters';
    if (pass.next !== pass.confirm) nextErr.confirm = 'Passwords do not match';
    setErr(nextErr);
    if (Object.keys(nextErr).length) return;
    setSavingPass(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pass.current,
        newPassword: pass.next,
      });
      setPass({ current: '', next: '', confirm: '' });
      toast('Password changed successfully.');
    } catch (e2) {
      toast(e2.message, 'error');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageTitle title="Settings" subtitle="Manage your account and sign-in details." />
      <div className="space-y-6">
        <Card>
          <h3 className="text-base mb-4">Account</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              {err.name && <p className="mt-1 text-xs text-danger">{err.name}</p>}
            </Field>
            <Field label="Email">
              <input className="input bg-pagebg text-slatemuted" value={user?.email || ''} disabled />
            </Field>
          </div>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-bluetint px-3 py-1 text-xs font-semibold text-navy-light">
            Role · {roleLabel}
          </p>
          <div className="mt-4">
            <Button onClick={saveName} loading={savingName}>
              Save name
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-base mb-4">Change password</h3>
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <Field label="Current password" error={err.current}>
              <input
                className="input"
                type="password"
                value={pass.current}
                onChange={(e) => setPass((p) => ({ ...p, current: e.target.value }))}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="New password" error={err.next}>
                <input
                  className="input"
                  type="password"
                  value={pass.next}
                  onChange={(e) => setPass((p) => ({ ...p, next: e.target.value }))}
                />
              </Field>
              <Field label="Confirm new password" error={err.confirm}>
                <input
                  className="input"
                  type="password"
                  value={pass.confirm}
                  onChange={(e) => setPass((p) => ({ ...p, confirm: e.target.value }))}
                />
              </Field>
            </div>
            <Button type="submit" variant="outline" loading={savingPass}>
              Update password
            </Button>
          </form>
        </Card>

        <Card className="border-danger/20">
          <h3 className="text-base mb-1">Log out</h3>
          <p className="text-sm text-slatemuted mb-4">End your session on this device. You can log back in anytime.</p>
          <Button
            variant="danger"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Log out
          </Button>
        </Card>
      </div>
    </div>
  );
}
