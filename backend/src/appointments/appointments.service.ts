import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../pets/pet.entity';
import { User } from '../users/user.entity';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

export interface AppointmentFilters {
  from?: string;
  to?: string;
  status?: AppointmentStatus;
  petId?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private readonly repo: Repository<Appointment>,
    @InjectRepository(Pet) private readonly pets: Repository<Pet>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findAll(filters: AppointmentFilters) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.pet', 'pet')
      .leftJoinAndSelect('pet.client', 'client')
      .leftJoinAndSelect('a.vet', 'vet')
      .orderBy('a.date', 'ASC');

    if (filters.from) qb.andWhere('a.date >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('a.date <= :to', { to: filters.to });
    if (filters.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters.petId) qb.andWhere('a.petId = :petId', { petId: filters.petId });
    return qb.getMany();
  }

  async findOne(id: string) {
    const appt = await this.repo.findOne({
      where: { id },
      relations: { pet: { client: true }, vet: true },
    });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    return appt;
  }

  private async assertPetExists(petId: string) {
    if ((await this.pets.count({ where: { id: petId } })) === 0) {
      throw new NotFoundException('La mascota indicada no existe');
    }
  }

  private async assertVetExists(vetId: string) {
    if ((await this.users.count({ where: { id: vetId } })) === 0) {
      throw new NotFoundException('El veterinario indicado no existe');
    }
  }

  // Evita dos citas programadas del mismo veterinario a la misma hora exacta
  private async assertVetFree(vetId: string | undefined, date: Date, excludeId?: string) {
    if (!vetId) return;
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.vetId = :vetId', { vetId })
      .andWhere('a.date = :date', { date })
      .andWhere('a.status = :status', { status: AppointmentStatus.PROGRAMADA });
    if (excludeId) qb.andWhere('a.id != :excludeId', { excludeId });

    if ((await qb.getCount()) > 0) {
      throw new ConflictException('El veterinario ya tiene una cita a esa hora');
    }
  }

  async create(dto: CreateAppointmentDto) {
    await this.assertPetExists(dto.petId);
    if (dto.vetId) await this.assertVetExists(dto.vetId);

    const date = new Date(dto.date);
    if ((dto.status ?? AppointmentStatus.PROGRAMADA) === AppointmentStatus.PROGRAMADA) {
      await this.assertVetFree(dto.vetId, date);
    }

    const saved = await this.repo.save(this.repo.create({ ...dto, date }));
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appt = await this.repo.findOneBy({ id });
    if (!appt) throw new NotFoundException('Cita no encontrada');

    if (dto.petId) await this.assertPetExists(dto.petId);
    if (dto.vetId) await this.assertVetExists(dto.vetId);

    const { date, ...rest } = dto;
    Object.assign(appt, rest);
    if (date) appt.date = new Date(date);

    if (appt.status === AppointmentStatus.PROGRAMADA) {
      await this.assertVetFree(appt.vetId, appt.date, id);
    }

    await this.repo.save(appt);
    return this.findOne(id);
  }

  async remove(id: string) {
    const appt = await this.repo.findOneBy({ id });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    await this.repo.remove(appt);
    return { deleted: true };
  }
}
