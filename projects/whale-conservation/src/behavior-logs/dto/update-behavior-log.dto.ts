/**
 * 更新行为日志 DTO
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateBehaviorLogDto } from './create-behavior-log.dto';

export class UpdateBehaviorLogDto extends PartialType(CreateBehaviorLogDto) {}
