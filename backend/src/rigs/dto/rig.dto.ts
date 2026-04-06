import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { RigType, RigStatus } from '../rig.entity';

export class CreateRigDto {
    @IsString()
    name: string;

    @IsEnum(RigType)
    type: RigType;

    @IsOptional()
    @IsEnum(RigStatus)
    status?: RigStatus;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;
}

export class UpdateRigDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(RigType)
    type?: RigType;

    @IsOptional()
    @IsEnum(RigStatus)
    status?: RigStatus;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;
}
