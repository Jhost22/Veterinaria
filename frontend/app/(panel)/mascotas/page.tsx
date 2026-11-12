'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fullName, petAge } from '@/lib/format';
import {
  SEX_LABELS,
  SPECIES_LABELS,
  type Client,
  type Pet,
  type Sex,
  type Species,
} from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { ErrorBox, Field } from '@/components/ui';

const EMPTY = {
  name: '',
  species: 'PERRO' as Species,
  breed: '',
  sex: 'DESCONOCIDO' as Sex,
  birthDate: '',
  weightKg: '',
  notes: '',
  clientId: '',
};

export default function MascotasPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setPets(await api<Pet[]>(`/pets?q=${encodeURIComponent(q)}`));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api<Client[]>('/clients').then(setClients).catch(() => undefined);
  }, []);

  const set =
    (key: keyof typeof EMPTY) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm({ ...form, [key]: e.target.value });

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function startEdit(p: Pet) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      species: p.species,
      breed: p.breed ?? '',
      sex: p.sex,
      birthDate: p.birthDate ?? '',
      weightKg: p.weightKg != null ? String(p.weightKg) : '',
      notes: p.notes ?? '',
      clientId: p.clientId,
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

    const empty = editingId ? null : undefined; // al editar, un campo vacío se borra
    const payload = {
      name: form.name,
      species: form.species,
      sex: form.sex,
      clientId: form.clientId,
      breed: form.breed || empty,
      birthDate: form.birthDate || empty,
      weightKg: form.weightKg ? Number(form.weightKg) : empty,
      notes: form.notes || empty,
    };

    try {
      if (editingId) {
        await api(`/pets/${editingId}`, { method: 'PATCH', json: payload });
      } else {
        await api('/pets', { method: 'POST', json: payload });
      }
      close();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Pet) {
    if (!confirm(`¿Eliminar a ${p.name}? Se borrará también su historial y sus citas.`)) return;
    try {
      await api(`/pets/${p.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Mascotas</h1>
        {!open && <button onClick={startNew}>+ Nueva mascota</button>}
      </div>

      <ErrorBox message={error} />

      {open && (
        <form className="card" onSubmit={submit}>
          <h2>{editingId ? 'Editar mascota' : 'Nueva mascota'}</h2>
          <div className="form-grid">
            <Field label="Nombre">
              <input required value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Dueño">
              <select required value={form.clientId} onChange={set('clientId')}>
                <option value="">Selecciona…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fullName(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Especie">
              <select value={form.species} onChange={set('species')}>
                {Object.entries(SPECIES_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Raza (opcional)">
              <input value={form.breed} onChange={set('breed')} />
            </Field>
            <Field label="Sexo">
              <select value={form.sex} onChange={set('sex')}>
                {Object.entries(SEX_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de nacimiento (opcional)">
              <input type="date" value={form.birthDate} onChange={set('birthDate')} />
            </Field>
            <Field label="Peso en kg (opcional)">
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.weightKg}
                onChange={set('weightKg')}
              />
            </Field>
            <Field label="Notas (opcional)" wide>
              <textarea value={form.notes} onChange={set('notes')} />
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
          placeholder="Buscar por mascota, raza o dueño…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {pets.length === 0 ? (
        <div className="card empty">No hay mascotas para mostrar.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Especie / raza</th>
                <th>Edad</th>
                <th>Dueño</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pets.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/mascotas/${p.id}`}>
                      <strong>{p.name}</strong>
                    </Link>
                    <div className="muted">{SEX_LABELS[p.sex]}</div>
                  </td>
                  <td>
                    {SPECIES_LABELS[p.species]}
                    {p.breed && <div className="muted">{p.breed}</div>}
                  </td>
                  <td>{petAge(p.birthDate)}</td>
                  <td>{fullName(p.client)}</td>
                  <td className="actions">
                    <Link href={`/mascotas/${p.id}`}>
                      <button className="secondary small">Historial</button>
                    </Link>
                    <button className="secondary small" onClick={() => startEdit(p)}>
                      Editar
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button className="danger small" onClick={() => remove(p)}>
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
