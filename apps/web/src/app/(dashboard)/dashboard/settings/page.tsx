'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:4000');

  useEffect(() => {
    const userStr = localStorage.getItem('apex_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setName(user.name ?? '');
        setEmail(user.email ?? '');
      } catch {}
    }
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const userStr = localStorage.getItem('apex_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        user.name = name;
        localStorage.setItem('apex_user', JSON.stringify(user));
      } catch {}
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-text-primary">Settings</h2>
        <p className="text-text-muted text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile settings */}
      <Card elevated className="p-6">
        <h3 className="section-title mb-5">Profile</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-background"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7B61FF)' }}
            >
              {name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{name}</p>
              <p className="text-xs text-text-muted">{email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark"
            />
          </div>

          <div className="space-y-1.5">
            <label className="label block">Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="input-dark opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-text-muted">Email cannot be changed after registration.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary">Save Changes</Button>
            {saved && <span className="text-sm text-success">Changes saved</span>}
          </div>
        </form>
      </Card>

      {/* API configuration */}
      <Card className="p-6">
        <h3 className="section-title mb-5">API Configuration</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="label block">Backend API URL</label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:4000"
              className="input-dark"
            />
            <p className="text-xs text-text-muted">
              Set via <code className="text-accent text-xs bg-surface px-1.5 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> environment variable in production.
            </p>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-danger/10">
        <h3 className="font-heading text-base font-semibold text-danger mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
          <div>
            <p className="text-sm font-medium text-text-primary">Sign out of all devices</p>
            <p className="text-xs text-text-muted mt-0.5">Revoke all active sessions</p>
          </div>
          <Button variant="secondary" size="sm">Sign Out All</Button>
        </div>
        <div className="flex items-center justify-between pt-3">
          <div>
            <p className="text-sm font-medium text-danger">Delete Account</p>
            <p className="text-xs text-text-muted mt-0.5">Permanently delete your account and all data</p>
          </div>
          <Button variant="danger" size="sm">Delete Account</Button>
        </div>
      </Card>
    </div>
  );
}
