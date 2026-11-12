'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ROLE_LABELS, type Role, type User } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { Badge, ErrorBox, Field } from '@/components/ui';

const EMPTY = { name: '', email: '', password: '', role: 'RECEPTION' as Role };

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Solo el administrador puede ver esta pantalla
  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const load = useCallback(async () => {
    try {
      setUsers(await api<User[]>('/users'));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') load();
  }, [user, load]);

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/users', { method: 'POST', json: form });
      setForm(EMPTY);
      setOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    try {
      await api(`/users/${u.id}`, { method: 'PATCH', json: { active: !u.active } });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Usuarios</h1>
        {!open && <button onClick={() => setOpen(true)}>+ Nuevo usuario</button>}
      </div>

      <ErrorBox message={error} />

      {open && (
        <form className="card" onSubmit={submit}>
          <h2>Nuevo usuario</h2>
          <div className="form-grid">
            <Field label="Nombre">
              <input required value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Correo">
              <input type="email" required value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Contraseña (mínimo 8 caracteres)">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
              />
            </Field>
            <Field label="Rol">
              <select value={form.role} onChange={set('role')}>
                {Object.entries(ROLE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Crear usuario'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setOpen(false);
                setForm(EMPTY);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                </td>
                <td>{u.email}</td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td>
                  <Badge kind={u.active ? 'COMPLETADA' : 'CANCELADA'}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="actions">
                  <button
                    className="secondary small"
                    disabled={u.id === user?.id}
                    title={u.id === user?.id ? 'No puedes desactivar tu propia cuenta' : ''}
                    onClick={() => toggleActive(u)}
                  >
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
