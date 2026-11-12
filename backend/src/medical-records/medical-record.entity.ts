import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../pets/pet.entity';
import { User } from '../users/user.entity';

export enum RecordType {
  CONSULTA = 'CONSULTA',
  VACUNA = 'VACUNA',
  DESPARASITACION = 'DESPARASITACION',
  CIRUGIA = 'CIRUGIA',
  OTRO = 'OTRO',
}

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  date: Date;

  @Column({ type: 'enum', enum: RecordType, default: RecordType.CONSULTA })
  type: RecordType;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  treatment?: string;

  @Column({ type: 'float', nullable: true })
  weightKg?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Fecha sugerida del próximo control o refuerzo (p. ej. vacuna)
  @Column({ type: 'date', nullable: true })
  nextVisit?: string;

  @Column()
  petId: string;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column({ nullable: true })
  vetId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vetId' })
  vet?: User;
}
