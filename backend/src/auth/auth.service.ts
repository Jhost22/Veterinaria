import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(
      dto.email.toLowerCase(),
    );
    const valid =
      !!user && user.active && (await bcrypt.compare(dto.password, user.password));
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });
    return {
      access_token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
