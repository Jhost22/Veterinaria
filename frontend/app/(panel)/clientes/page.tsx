'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, clean, nullify } from '@/lib/api';
import type { Client } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { ErrorBox, Field } from '@/components/ui';

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  documentId: '',
  address: '',
};

export default function ClientesPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setClients(await api<Client[]>(`/clients?q=${encodeURIComponent(q)}`));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const set = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setForm({ ...form, [key]: e.target.value });

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function startEdit(c: Client) {
    setEditingId(c.id);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      email: c.email ?? '',
      documentId: c.documentId ?? '',
      address: c.address ?? '',
    });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function close() {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api(`/clients/${editingId}`, { method: 'PATCH', json: nullify(form) });
      } else {
        await api('/clients', { method: 'POST', json: clean(form) });
      }
      close();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Client) {
    if (!confirm(`¿Eliminar a ${c.firstName} ${c.lastName}? También se borrarán sus mascotas.`)) return;
    try {
      await api(`/clients/${c.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Clientes</h1>
        {!open && <button onClick={startNew}>+ Nuevo cliente</button>}
      </div>

      <ErrorBox message={error} />

      {open && (
        <form className="card" onSubmit={submit}>
          <h2>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <div className="form-grid">
            <Field label="Nombres">
              <input required value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Apellidos">
              <input required value={form.lastName} onChange={set('lastName')} />
            </Field>
            <Field label="Teléfono">
              <input required value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Correo (opcional)">
              <input type="email" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Documento (opcional)">
              <input value={form.documentId} onChange={set('documentId')} />
            </Field>
            <Field label="Dirección (opcional)">
              <input value={form.address} onChange={set('address')} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="secondary" onClick={close}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input
          placeholder="Buscar por nombre, teléfono o documento…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {clients.length === 0 ? (
        <div className="card empty">No hay clientes para mostrar.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Mascotas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>
                      {c.firstName} {c.lastName}
                    </strong>
                    {c.documentId && <div className="muted">Doc: {c.documentId}</div>}
                  </td>
                  <td>
                    {c.phone}
                    {c.email && <div className="muted">{c.email}</div>}
                  </td>
                  <td>
                    {c.pets && c.pets.length > 0
                      ? c.pets.map((p, i) => (
                          <span key={p.id}>
                            {i > 0 && ', '}
                            <Link href={`/mascotas/${p.id}`}>{p.name}</Link>
                          </span>
                        ))
                      : <span className="muted">Sin mascotas</span>}
                  </td>
                  <td className="actions">
                    <button className="secondary small" onClick={() => startEdit(c)}>
                      Editar
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button className="danger small" onClick={() => remove(c)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
