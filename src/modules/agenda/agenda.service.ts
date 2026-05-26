import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agenda } from './entities/agenda.entity';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Agenda)
    private readonly agendaRepository: Repository<Agenda>,
  ) {}

  async createAgenda(userId: string, dto: CreateAgendaDto): Promise<Agenda> {
    const agenda = this.agendaRepository.create({
      userId,
      title: dto.title,
      description: dto.description,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      location: dto.location,
      isAllDay: dto.isAllDay,
    });
    return this.agendaRepository.save(agenda);
  }

  async getAgenda(id: string, userId: string): Promise<Agenda> {
    const agenda = await this.agendaRepository.findOne({
      where: { id, userId },
    });
    if (!agenda) {
      throw new NotFoundException('Agenda not found');
    }
    return agenda;
  }

  async listAgenda(userId: string): Promise<Agenda[]> {
    return this.agendaRepository.find({ where: { userId } });
  }

  async updateAgenda(
    id: string,
    userId: string,
    dto: UpdateAgendaDto,
  ): Promise<Agenda> {
    const agenda = await this.getAgenda(id, userId);
    if (dto.title !== undefined) agenda.title = dto.title;
    if (dto.description !== undefined) agenda.description = dto.description;
    if (dto.startAt !== undefined) agenda.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) agenda.endAt = new Date(dto.endAt);
    if (dto.location !== undefined) agenda.location = dto.location;
    if (dto.isAllDay !== undefined) agenda.isAllDay = dto.isAllDay;
    return this.agendaRepository.save(agenda);
  }
}
