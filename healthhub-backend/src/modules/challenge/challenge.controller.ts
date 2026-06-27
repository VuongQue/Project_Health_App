import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  // Public list (có thể kèm joined nếu có token)
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    return this.challengeService.listForUser(req.user.userId);
  }


  // Admin create
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateChallengeDto) {
    return this.challengeService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateChallengeDto) {
    return this.challengeService.update(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: number) {
    return this.challengeService.deactivate(Number(id));
  }

  // Join
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Req() req: any, @Param('id') id: number) {
    return this.challengeService.join(req.user.userId, Number(id));
  }

  // Leave (theo userChallengeId)
  @UseGuards(JwtAuthGuard)
  @Delete('me/:userChallengeId')
  leave(@Req() req: any, @Param('userChallengeId') userChallengeId: number) {
    return this.challengeService.leave(req.user.userId, Number(userChallengeId));
  }

  // My challenges
  @UseGuards(JwtAuthGuard)
  @Get('me')
  myChallenges(@Req() req: any) {
    return this.challengeService.myChallenges(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/:userChallengeId')
  myChallengeDetail(@Req() req: any, @Param('userChallengeId') userChallengeId: number) {
    return this.challengeService.getOneUserChallenge(req.user.userId, Number(userChallengeId));
  }
}
