import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Role name can only contain letters, numbers, underscores and hyphens',
  })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

