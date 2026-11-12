import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/client.entity';
import { Pet } from './pet.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet) private readonly repo: Repository<Pet>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
  ) {}

  findAll(q?: string, clientId?: string) {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.client', 'c')
      .orderBy('p.name', 'ASC');

    if (clientId) qb.andWhere('p.clientId = :clientId', { clientId });
    if (q?.trim()) {
      qb.andWhere(
        '(p.name ILIKE :q OR p.breed ILIKE :q OR c.firstName ILIKE :q OR c.lastName ILIKE :q)',
        { q: `%${q.trim()}%` },
      );
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    const pet = await this.repo.findOne({
      where: { id },
      relations: { client: true },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    return pet;
  }

  private async assertClientExists(clientId: string) {
    if ((await this.clients.count({ where: { id: clientId } })) === 0) {
      throw new NotFoundException('El cliente indicado no existe');
    }
  }

  async create(dto: CreatePetDto) {
    await this.assertClientExists(dto.clientId);
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdatePetDto) {
    const pet = await this.repo.findOneBy({ id });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    if (dto.clientId) await this.assertClientExists(dto.clientId);
    Object.assign(pet, dto);
    await this.repo.save(pet);
    return this.findOne(id);
  }

  async remove(id: string) {
    const pet = await this.repo.findOneBy({ id });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    await this.repo.remove(pet);
    return { deleted: true };
  }
}
