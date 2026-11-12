import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private readonly repo: Repository<Client>,
  ) {}

  findAll(q?: string) {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.pets', 'p')
      .orderBy('c.lastName', 'ASC')
      .addOrderBy('c.firstName', 'ASC');

    if (q?.trim()) {
      qb.where(
        '(c.firstName ILIKE :q OR c.lastName ILIKE :q OR c.phone ILIKE :q OR c.documentId ILIKE :q)',
        { q: `%${q.trim()}%` },
      );
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    const client = await this.repo.findOne({
      where: { id },
      relations: { pets: true },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  create(dto: CreateClientDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await this.repo.findOneBy({ id });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    Object.assign(client, dto);
    return this.repo.save(client);
  }

  async remove(id: string) {
    const client = await this.repo.findOneBy({ id });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    await this.repo.remove(client);
    return { deleted: true };
  }
}
