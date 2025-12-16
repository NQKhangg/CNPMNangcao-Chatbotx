import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Resource } from 'src/roles/enums/resource.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Action } from 'src/roles/enums/action.enum';

@Controller('statistics')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.statistics, actions: [Action.read] }])
  getDashboard() {
    return this.statisticsService.getDashboardStats();
  }
}
