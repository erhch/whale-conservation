import { PartialType } from '@nestjs/mapped-types';
import { CreateGenealogyRecordDto } from './create-genealogy-record.dto';

export class UpdateGenealogyRecordDto extends PartialType(CreateGenealogyRecordDto) {}
