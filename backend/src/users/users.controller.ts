import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';

function actorOf(req: any) {
  return { id: req?.user?.userId, email: req?.user?.email };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    const actor = actorOf(req);
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      return this.usersService.createWithRoles(createUserDto, createUserDto.roleIds, actor);
    }
    return this.usersService.create(createUserDto, 'user', actor);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto, actorOf(req));
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Request() req, @Param('id') id: string) {
    return this.usersService.remove(id, actorOf(req));
  }

  @Put(':id/roles')
  @Roles('admin')
  updateUserRoles(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ) {
    return this.usersService.updateUserRoles(id, updateUserRolesDto.roleIds, actorOf(req));
  }
}
