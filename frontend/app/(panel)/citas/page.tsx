'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, clean } from '@/lib/api';
import { fmtDateTime, fullName } from '@/lib/format';
import {
  STATUS_LABELS,
  type Appointment,
  type AppointmentStatus,
  type Pet,
} from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { Badge, ErrorBox, Field } from '@/components/ui';

type Filter = 'upcoming' | 'today' | 'all';

const EMPTY = { petId: '', vetId: '', date: '', reason: '', notes: '' };

export default function CitasPage() {
  const { user } = useAuth();
  const canDelete = user?.role === 'ADMIN' || user?.role === 'RECEPTION';

  const [appts, setAppts] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [vets, setVets] = useState<{ id: string; name: string }[]>([]);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      params.set('from', start.toISOString());
    }
    if (filter === 'today') {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      params.set('to', end.toISOString());
    }
    try {
      setAppts(await api<Appointment[]>(`/appointments?${params}`));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api<Pet[]>('/pets').then(setPets).catch(() => undefined);
    api<{ id: string; name: string }[]>('/users/vets')
      .then(setVets)
      .catch(() => undefined);
  }, []);

  const set =
    (key: keyof typeof EMPTY) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm({ ...form, [key]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/appointments', {
        method: 'POST',
        json: clean({ ...form, date: new Date(form.date).toISOString() }),
      });
      setForm(EMPTY);
      setOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(a: Appointment, status: AppointmentStatus) {
    try {
      await api(`/appointments/${a.id}`, { method: 'PATCH', json: { status } });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(a: Appointment) {
    if (!confirm('¿Eliminar esta cita?')) return;
    try {
      await api(`/appointments/${a.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Citas</h1>
        {!open && <button onClick={() => setOpen(true)}>+ Nueva cita</button>}
      </div>

      <ErrorBox message={error} />

      {open && (
        <form className="card" onSubmit={submit}>
          <h2>Nueva cita</h2>
          <div className="form-grid">
            <Field label="Mascota">
              <select required value={form.petId} onChange={set('petId')}>
                <option value="">Selecciona…</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({fullName(p.client)})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Veterinario (opcional)">
              <select value={form.vetId} onChange={set('vetId')}>
                <option value="">Sin asignar</option>
                {vets.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha y hora">
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={set('date')}
              />
            </Field>
            <Field label="Motivo">
              <input required value={form.reason} onChange={set('reason')} />
            </Field>
            <Field label="Notas (opcional)" wide>
              <textarea value={form.notes} onChange={set('notes')} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Agendar'}
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

      <div className="toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="upcoming">Desde hoy en adelante</option>
          <option value="today">Solo hoy</option>
          <option value="all">Todas</option>
        </select>
      </div>

      {appts.length === 0 ? (
        <div className="card empty">No hay citas para mostrar.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Mascota</th>
                <th>Motivo</th>
                <th>Veterinario</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {appts.map((a) => (
                <tr key={a.id}>
                  <td>{fmtDateTime(a.date)}</td>
                  <td>
                    <Link href={`/mascotas/${a.petId}`}>
                      <strong>{a.pet?.name}</strong>
                    </Link>
                    <div className="muted">{fullName(a.pet?.client)}</div>
                  </td>
                  <td>
                    {a.reason}
                    {a.notes && <div className="muted">{a.notes}</div>}
                  </td>
                  <td>{a.vet?.name ?? <span className="muted">Sin asignar</span>}</td>
                  <td>
                    <Badge kind={a.status}>{STATUS_LABELS[a.status]}</Badge>
                  </td>
                  <td className="actions">
                    <select
                      value={a.status}
                      onChange={(e) =>
                        changeStatus(a, e.target.value as AppointmentStatus)
                      }
                      aria-label="Cambiar estado"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {canDelete && (
                      <button className="danger small" onClick={() => remove(a)}>
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
