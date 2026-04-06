import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('summary')
    getSummary() {
        return this.dashboardService.getSummary();
    }

    @Get('active-tools')
    getActiveTools(
        @Query('customerId') customerId?: string,
        @Query('rigId') rigId?: string,
        @Query('status') status?: string,
    ) {
        return this.dashboardService.getActiveTools(customerId, rigId, status);
    }

    @Get('active-instances')
    getActiveInstances(@Query('toolId') toolId?: string) {
        return this.dashboardService.getActiveToolInstances(toolId);
    }
}
