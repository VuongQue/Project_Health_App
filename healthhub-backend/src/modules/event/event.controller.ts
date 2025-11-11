import { Controller, Post, Get, Body, Req, Param, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(req.user.email, dto);
  }

  @Get()
  getAll() {
    return this.eventService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  register(@Req() req, @Param('id') id: number) {
    return this.eventService.register(req.user.email, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/registrations')
  myRegistrations(@Req() req) {
    return this.eventService.getRegistrations(req.user.email);
  }
}
