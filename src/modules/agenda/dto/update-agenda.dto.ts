import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateAgendaDto {
  @ApiPropertyOptional({ description: 'Judul aktivitas' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Catatan aktivitas' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Waktu mulai agenda' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Waktu selesai agenda' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ description: 'Lokasi aktivitas' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Apakah agenda seharian' })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;
}
