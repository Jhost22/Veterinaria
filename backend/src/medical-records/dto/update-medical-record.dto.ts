import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateMedicalRecordDto } from './create-medical-record.dto';

// La mascota de un registro no se puede cambiar una vez creado
export class UpdateMedicalRecordDto extends PartialType(
  OmitType(CreateMedicalRecordDto, ['petId'] as const),
) {}
