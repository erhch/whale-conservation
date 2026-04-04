import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenealogyRecord, WhalePedigree } from './entities/genealogy-record.entity';
import { GenealogyService } from './genealogy.service';
import { GenealogyController } from './genealogy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GenealogyRecord, WhalePedigree])],
  controllers: [GenealogyController],
  providers: [GenealogyService],
  exports: [GenealogyService],
})
export class GenealogyModule {}
