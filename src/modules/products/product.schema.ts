import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, default: null })
  photoUrl!: string | null;

  @Prop({ type: String, default: null })
  photoPublicId!: string | null;

  @Prop({ type: String, required: true, trim: true })
  link!: string;

  @Prop({ type: Number, default: 0 })
  order!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
