'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmtDateTime, fullName } from '@/lib/format';
import {
  STATUS_LABELS,
  type Appointment,
  type Client,
  type Pet,
} from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import { Badge, ErrorBox } from '@/components/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  const [today, setToday] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<number | null>(null);
  const [pets, setPets] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const qs = new URLSearchParams({
      from: start.toISOString(),
      to: end.toISOString(),
    });

    Promise.all([
      api<Appointment[]>(`/appointments?${qs}`),
      api<Client[]>('/clients'),
      api<Pet[]>('/pets'),
    ])
      .then(([a, c, p]) => {
        setToday(a);
        setClients(c.length);
        setPets(p.length);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const pending = today.filter((a) => a.status === 'PROGRAMADA').length;

  return (
    <>
      <div className="page-head">
        <h1>Hola, {user?.name} 👋</h1>
      </div>
      <ErrorBox message={error} />

      <div className="stats">
        <div className="stat">
          <div className="num">{pending}</div>
          <div className="label">Citas pendientes hoy</div>
        </div>
        <div className="stat">
          <div className="num">{clients ?? '…'}</div>
          <div className="label">Clientes</div>
        </div>
        <div className="stat">
          <div className="num">{pets ?? '…'}</div>
          <div className="label">Mascotas</div>
        </div>
      </div>

      <h2>Agenda de hoy</h2>
      {today.length === 0 ? (
        <div className="card empty">No hay citas para hoy.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Mascota</th>
                <th>Dueño</th>
                <th>Motivo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {today.map((a) => (
                <tr key={a.id}>
                  <td>{fmtDateTime(a.date)}</td>
                  <td>
                    <Link href={`/mascotas/${a.petId}`}>{a.pet?.name}</Link>
                  </td>
                  <td>{fullName(a.pet?.client)}</td>
                  <td>{a.reason}</td>
                  <td>
                    <Badge kind={a.status}>{STATUS_LABELS[a.status]}</Badge>
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
