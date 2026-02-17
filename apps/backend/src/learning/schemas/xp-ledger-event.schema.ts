import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export type XpLedgerEventDocument = HydratedDocument<XpLedgerEvent>;

@Schema({ collection: "xp_ledger_events", timestamps: true })
export class XpLedgerEvent {
  @Prop({ required: true })
  user_id!: string;

  @Prop({ required: true })
  event_type!: "progress" | "video" | "purchase";

  @Prop({ required: true })
  xp_delta!: number;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export const XpLedgerEventSchema = SchemaFactory.createForClass(XpLedgerEvent);
