import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rig } from './rig.entity';
import { RigsService } from './rigs.service';
import { RigsController } from './rigs.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Rig])],
    controllers: [RigsController],
    providers: [RigsService],
    exports: [RigsService],
})
export class RigsModule { }
