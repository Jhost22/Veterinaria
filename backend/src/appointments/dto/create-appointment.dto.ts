import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';

export class CreateAppointmentDto {
  @IsUUID()
  petId: string;

  @IsOptional()
  @IsUUID()
  vetId?: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
