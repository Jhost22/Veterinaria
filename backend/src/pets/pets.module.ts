import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/client.entity';
import { Pet } from './pet.entity';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, Client])],
  providers: [PetsService],
  controllers: [PetsController],
})
export class PetsModule {}
