import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolInstance } from './tool-instance.entity';
import { ToolInstancesService } from './tool-instances.service';
import { ToolInstancesController } from './tool-instances.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ToolInstance])],
    controllers: [ToolInstancesController],
    providers: [ToolInstancesService],
    exports: [ToolInstancesService],
})
export class ToolInstancesModule { }
