import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseStreakFreezeDto {
  @IsUUID()
  user_id!: string;

  @IsOptional()
  cost_xp?: number;
}

