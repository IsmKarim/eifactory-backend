import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Create a product (optional photo upload, max 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'link'],
      properties: {
        name: { type: 'string', example: 'Smart Watch Pro' },
        link: { type: 'string', example: 'https://store.example.com/smart-watch-pro' },
        order: { type: 'number', example: 0 },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Product image is required.');
    const photo = await this.cloudinaryService.upload(file, 'eifactory/products');
    return this.productsService.create({
      ...dto,
      photoUrl: photo.secure_url,
      photoPublicId: photo.public_id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Update a product (optional photo upload, max 5 MB)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Smart Watch Pro' },
        link: { type: 'string', example: 'https://store.example.com/smart-watch-pro' },
        order: { type: 'number', example: 0 },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const photo = file ? await this.cloudinaryService.upload(file, 'eifactory/products') : null;
    return this.productsService.update(id, {
      ...dto,
      ...(photo && { photoUrl: photo.secure_url, photoPublicId: photo.public_id }),
    });
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
