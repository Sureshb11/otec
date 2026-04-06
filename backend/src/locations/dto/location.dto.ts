import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateLocationDto {
    @IsString()
    name: string;

    @IsString()
    country: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @IsString()
    coordinates?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateLocationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @IsString()
    coordinates?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
