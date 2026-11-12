import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../pets/pet.entity';
import { MedicalRecord } from './medical-record.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecord) private readonly repo: Repository<MedicalRecord>,
    @InjectRepository(Pet) private readonly pets: Repository<Pet>,
  ) {}

  findAll(petId?: string) {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.vet', 'vet')
      .orderBy('r.date', 'DESC');
    if (petId) qb.where('r.petId = :petId', { petId });
    return qb.getMany();
  }

  async findOne(id: string) {
    const record = await this.repo.findOne({
      where: { id },
      relations: { vet: true },
    });
    if (!record) throw new NotFoundException('Registro clínico no encontrado');
    return record;
  }

  async create(dto: CreateMedicalRecordDto, vetId: string) {
    const pet = await this.pets.findOneBy({ id: dto.petId });
    if (!pet) throw new NotFoundException('La mascota indicada no existe');

    const { date, ...rest } = dto;
    const saved = await this.repo.save(
      this.repo.create({
        ...rest,
        vetId,
        ...(date ? { date: new Date(date) } : {}),
      }),
    );

    // Si se registró un peso, la ficha de la mascota queda actualizada
    if (dto.weightKg) {
      await this.pets.update(pet.id, { weightKg: dto.weightKg });
    }
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateMedicalRecordDto) {
    const record = await this.repo.findOneBy({ id });
    if (!record) throw new NotFoundException('Registro clínico no encontrado');

    const { date, ...rest } = dto;
    Object.assign(record, rest);
    if (date) record.date = new Date(date);

    await this.repo.save(record);
    return this.findOne(id);
  }

  async remove(id: string) {
    const record = await this.repo.findOneBy({ id });
    if (!record) throw new NotFoundException('Registro clínico no encontrado');
    await this.repo.remove(record);
    return { deleted: true };
  }
}
