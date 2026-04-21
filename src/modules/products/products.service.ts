import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto & { photoUrl?: string; photoPublicId?: string }): Promise<ProductDocument> {
    return this.productModel.create(dto);
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel.find().sort({ order: 1, createdAt: 1 }).lean() as unknown as ProductDocument[];
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).lean() as unknown as ProductDocument;
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByIds(ids: Types.ObjectId[]): Promise<ProductDocument[]> {
    return this.productModel.find({ _id: { $in: ids } }).lean() as unknown as ProductDocument[];
  }

  async update(
    id: string,
    dto: UpdateProductDto | Record<string, unknown>,
  ): Promise<ProductDocument> {
    const updated = await this.productModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Product not found');
  }
}
