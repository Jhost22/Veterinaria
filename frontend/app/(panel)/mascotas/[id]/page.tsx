'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, clean } from '@/lib/api';
import { fmtDate, fmtDateTime, fullName, petAge } from '@/lib/format';
import {
  RECORD_LABELS,
  SEX_LABELS,
  SPECIES_LABELS,
  STATUS_LABELS,
  type Appointment,
  type MedicalRecord,
  type Pet,
  type RecordType,
} from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { Badge, ErrorBox, Field } from '@/components/ui';

const EMPTY = {
  type: 'CONSULTA' as RecordType,
  diagnosis: '',
  treatment: '',
  weightKg: '',
  nextVisit: '',
  notes: '',
};

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'VET';

  const [pet, setPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, r, a] = await Promise.all([
        api<Pet>(`/pets/${id}`),
        api<MedicalRecord[]>(`/medical-records?petId=${id}`),
        api<Appointment[]>(`/appointments?petId=${id}`),
      ]);
      setPet(p);
      setRecords(r);
      setAppts(a);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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
      await api('/medical-records', {
        method: 'POST',
        json: clean({
          petId: id,
          type: form.type,
          diagnosis: form.diagnosis,
          treatment: form.treatment,
          notes: form.notes,
          nextVisit: form.nextVisit,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        }),
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

  async function removeRecord(recordId: string) {
    if (!confirm('¿Eliminar este registro del historial?')) return;
    try {
      await api(`/medical-records/${recordId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!pet) {
    return (
      <>
        <ErrorBox message={error} />
        {!error && <div className="muted">Cargando…</div>}
      </>
    );
  }

  const upcoming = appts.filter((a) => a.status === 'PROGRAMADA');

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/mascotas" className="muted">
            ← Mascotas
          </Link>
          <h1>{pet.name}</h1>
        </div>
        {canWrite && !open && (
          <button onClick={() => setOpen(true)}>+ Nuevo registro clínico</button>
        )}
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <dl className="pet-header">
          <div>
            <dt>Especie</dt>
            <dd>{SPECIES_LABELS[pet.species]}</dd>
          </div>
          <div>
            <dt>Raza</dt>
            <dd>{pet.breed || '—'}</dd>
          </div>
          <div>
            <dt>Sexo</dt>
            <dd>{SEX_LABELS[pet.sex]}</dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>{petAge(pet.birthDate)}</dd>
          </div>
          <div>
            <dt>Peso</dt>
            <dd>{pet.weightKg != null ? `${pet.weightKg} kg` : '—'}</dd>
          </div>
          <div>
            <dt>Dueño</dt>
            <dd>
              {fullName(pet.client)}
              {pet.client?.phone && <div className="muted">{pet.client.phone}</div>}
            </dd>
          </div>
        </dl>
        {pet.notes && <p className="muted">📝 {pet.notes}</p>}
      </div>

      {open && (
        <form className="card" onSubmit={submit}>
          <h2>Nuevo registro clínico</h2>
          <div className="form-grid">
            <Field label="Tipo">
              <select value={form.type} onChange={set('type')}>
                {Object.entries(RECORD_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Peso actual en kg (opcional)">
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.weightKg}
                onChange={set('weightKg')}
              />
            </Field>
            <Field label="Próximo control / refuerzo (opcional)">
              <input type="date" value={form.nextVisit} onChange={set('nextVisit')} />
            </Field>
            <Field label="Diagnóstico o vacuna aplicada" wide>
              <textarea value={form.diagnosis} onChange={set('diagnosis')} />
            </Field>
            <Field label="Tratamiento" wide>
              <textarea value={form.treatment} onChange={set('treatment')} />
            </Field>
            <Field label="Observaciones" wide>
              <textarea value={form.notes} onChange={set('notes')} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar registro'}
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

      {upcoming.length > 0 && (
        <>
          <h2>Próximas citas</h2>
          <div className="card">
            {upcoming.map((a) => (
              <div key={a.id}>
                {fmtDateTime(a.date)} — {a.reason}{' '}
                <Badge kind={a.status}>{STATUS_LABELS[a.status]}</Badge>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>Historial clínico</h2>
      {records.length === 0 ? (
        <div className="card empty">Todavía no hay registros clínicos.</div>
      ) : (
        <div className="timeline">
          {records.map((r) => (
            <div className="record" key={r.id}>
              <div className="record-head">
                <span>
                  <Badge kind="REGISTRO">{RECORD_LABELS[r.type]}</Badge>{' '}
                  <strong>{fmtDateTime(r.date)}</strong>
                </span>
                <span className="muted">
                  {r.vet?.name ? `Dr/a. ${r.vet.name}` : ''}
                  {user?.role === 'ADMIN' && (
                    <>
                      {' '}
                      <button
                        className="danger small"
                        onClick={() => removeRecord(r.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </span>
              </div>
              {r.diagnosis && (
                <p>
                  <strong>Diagnóstico:</strong> {r.diagnosis}
                </p>
              )}
              {r.treatment && (
                <p>
                  <strong>Tratamiento:</strong> {r.treatment}
                </p>
              )}
              {r.weightKg != null && (
                <p>
                  <strong>Peso:</strong> {r.weightKg} kg
                </p>
              )}
              {r.notes && (
                <p>
                  <strong>Observaciones:</strong> {r.notes}
                </p>
              )}
              {r.nextVisit && (
                <p className="muted">Próximo control: {fmtDate(r.nextVisit)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
