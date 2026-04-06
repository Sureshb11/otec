import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tool } from './tool.entity';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Tool])],
    controllers: [ToolsController],
    providers: [ToolsService],
    exports: [ToolsService],
})
export class ToolsModule { }
