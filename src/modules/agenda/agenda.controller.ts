import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@ApiBearerAuth('access-token')
@Controller('agendas')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createAgenda(@User('userId') userId: string, @Body() dto: CreateAgendaDto) {
    return this.agendaService.createAgenda(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listAgenda(@User('userId') userId: string) {
    return this.agendaService.listAgenda(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getAgenda(@User('userId') userId: string, @Param('id') id: string) {
    return this.agendaService.getAgenda(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateAgenda(@User('userId') userId: string, @Param('id') id: string, @Body() dto: UpdateAgendaDto) {
    return this.agendaService.updateAgenda(id, userId, dto);
  }
}
