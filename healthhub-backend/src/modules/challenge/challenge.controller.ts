import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JoinChallengeDto } from './dto/join-challenge.dto';
import { CreateChallengeDto } from './dto/create-challenge.dto';

@Controller('challenges')
export class ChallengeController {
    constructor(private challengeService: ChallengeService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Req() req, @Body() dto: CreateChallengeDto) {
        return this.challengeService.create(dto);
    }

    @Get()
    getAll() {
        return this.challengeService.getAll();
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/join')
    join(@Req() req, @Param('id') id: number) {
        return this.challengeService.join(req.user.email, id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    my(@Req() req) {
        return this.challengeService.myChallenges(req.user.email);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/complete')
    async complete(@Req() req, @Param('id') id: number) {
    return this.challengeService.completeChallenge(req.user.email, id);
}
}
