import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/role.enum';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  // Crea el primer administrador si no hay usuarios todavía
  async onModuleInit() {
    if ((await this.repo.count()) > 0) return;

    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn(
        'No hay usuarios y faltan ADMIN_EMAIL / ADMIN_PASSWORD: no se creó el administrador.',
      );
      return;
    }
    await this.create({
      name: 'Administrador',
      email,
      password,
      role: Role.ADMIN,
    });
    this.logger.log(`Administrador inicial creado: ${email}`);
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findVets() {
    return this.repo.find({
      where: { role: Role.VET, active: true },
      select: { id: true, name: true },
      order: { name: 'ASC' },
    });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    if ((await this.repo.count({ where: { email } })) > 0) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
    const user = this.repo.create({
      ...dto,
      email,
      password: await bcrypt.hash(dto.password, 10),
    });
    const saved = await this.repo.save(user);
    const { password: _omit, ...safe } = saved;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { password, ...rest } = dto;
    if (rest.email) rest.email = rest.email.toLowerCase();
    Object.assign(user, rest);
    if (password) user.password = await bcrypt.hash(password, 10);

    await this.repo.save(user);
    return this.findById(id);
  }
}
