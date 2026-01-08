import { IsArray, IsUUID } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  roleIds: string[];
}

