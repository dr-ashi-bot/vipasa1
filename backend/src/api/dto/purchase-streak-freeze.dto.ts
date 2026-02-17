import { IsUUID } from 'class-validator';

export class PurchaseStreakFreezeDto {
  @IsUUID()
  user_id!: string;
}
