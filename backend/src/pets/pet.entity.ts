import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';

export enum Species {
  PERRO = 'PERRO',
  GATO = 'GATO',
  AVE = 'AVE',
  ROEDOR = 'ROEDOR',
  REPTIL = 'REPTIL',
  OTRO = 'OTRO',
}

export enum Sex {
  MACHO = 'MACHO',
  HEMBRA = 'HEMBRA',
  DESCONOCIDO = 'DESCONOCIDO',
}

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Species, default: Species.PERRO })
  species: Species;

  @Column({ nullable: true })
  breed?: string;

  @Column({ type: 'enum', enum: Sex, default: Sex.DESCONOCIDO })
  sex: Sex;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ type: 'float', nullable: true })
  weightKg?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column()
  clientId: string;

  @ManyToOne(() => Client, (client) => client.pets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @CreateDateColumn()
  createdAt: Date;
}
