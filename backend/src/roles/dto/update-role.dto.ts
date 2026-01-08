import { IsString, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  description?: string;
}

