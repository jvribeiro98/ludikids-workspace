import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@ApiTags('Crianças')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@AcademicAccess()
@Controller('children')
export class ChildrenController {
  constructor(private childrenService: ChildrenService) {}

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateChildDto,
  ) {
    return this.childrenService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('classId') classId?: string,
  ) {
    return this.childrenService.findAll(tenantId, classId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.childrenService.findOne(tenantId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.childrenService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.childrenService.remove(tenantId, id);
  }

  @Get(':childId/addresses')
  listAddresses(@CurrentUser('tenantId') tenantId: string, @Param('childId') childId: string) {
    return this.childrenService.listAddresses(tenantId, childId);
  }

  @Post(':childId/addresses')
  addAddress(
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
    @Body() dto: { label?: string; street: string; number?: string; complement?: string; neighborhood?: string; city: string; state: string; zipCode?: string },
  ) {
    return this.childrenService.addAddress(tenantId, childId, dto);
  }

  @Put(':childId/addresses/:addressId')
  updateAddress(
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
    @Param('addressId') addressId: string,
    @Body() dto: Partial<{ label: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string; zipCode: string }>,
  ) {
    return this.childrenService.updateAddress(tenantId, childId, addressId, dto);
  }

  @Delete(':childId/addresses/:addressId')
  removeAddress(
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.childrenService.removeAddress(tenantId, childId, addressId);
  }

  @Get(':childId/authorized-pickups')
  listAuthorizedPickups(@CurrentUser('tenantId') tenantId: string, @Param('childId') childId: string) {
    return this.childrenService.listAuthorizedPickups(tenantId, childId);
  }

  @Post(':childId/authorized-pickups')
  addAuthorizedPickup(
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
    @Body() dto: { type: string; name?: string; phone?: string; document?: string },
  ) {
    return this.childrenService.addAuthorizedPickup(tenantId, childId, dto);
  }

  @Put(':childId/authorized-pickups/:pickupId')
  updateAuthorizedPickup(
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
    @Param('pickupId') pickupId: string,
    @Body() dto: Partial<{ type: string; name: string; phone: string; document: string }>,
  ) {
    return this.childrenService.updateAuthorizedPickup(tenantId, childId, pickupId, dto);
  }

  @Delete(':childId/authorized-pickups/:pickupId')
  removeAuthorizedPickup(
    @CurrentUser('tenantId') tenantId: string,
    @Param('childId') childId: string,
    @Param('pickupId') pickupId: string,
  ) {
    return this.childrenService.removeAuthorizedPickup(tenantId, childId, pickupId);
  }
}
