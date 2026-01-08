import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { RoleType } from '../role.entity';

export class CreateRoleDto {
  @IsEnum(RoleType)
  @IsNotEmpty()
  name: RoleType;

  @IsString()
  @IsOptional()
  description?: string;
}

