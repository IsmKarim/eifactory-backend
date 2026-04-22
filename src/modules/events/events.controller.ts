import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateEventDto } from './dto/createEvent.dto';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ── Admin routes ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Create an event' })
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post(':id/products/:productId')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Link an existing product to an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  linkProduct(@Param('id') id: string, @Param('productId') productId: string) {
    return this.eventsService.linkProduct(id, productId);
  }

  @Delete(':id/products/:productId')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Unlink a product from an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  unlinkProduct(@Param('id') id: string, @Param('productId') productId: string) {
    return this.eventsService.unlinkProduct(id, productId);
  }

  // ── Public routes ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all events' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an event by slug' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  findOne(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'List products linked to an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  getProducts(@Param('id') id: string) {
    return this.eventsService.getProducts(id);
  }
}
