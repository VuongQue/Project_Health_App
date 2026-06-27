import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GoalStatus } from './entities/user-goal.entity';
import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  currentValue: number;
}

class UpdateStatusDto {
  @IsEnum(GoalStatus)
  status: GoalStatus;
}

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateGoalDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  getAll(@Req() req) {
    return this.service.getAll(req.user.userId);
  }

  @Get('active')
  getActive(@Req() req) {
    return this.service.getActive(req.user.userId);
  }

  @Put(':id/progress')
  updateProgress(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.service.updateProgress(req.user.userId, id, dto.currentValue);
  }

  @Put(':id/status')
  updateStatus(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.updateStatus(req.user.userId, id, dto.status);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(req.user.userId, id);
  }
}
