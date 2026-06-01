import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAgendaDto {
  @ApiProperty({ description: 'Judul aktivitas' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Catatan aktivitas' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: String, format: 'date-time', description: 'Waktu mulai agenda' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ type: String, format: 'date-time', description: 'Waktu selesai agenda' })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ description: 'Lokasi aktivitas' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Apakah agenda seharian' })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;
}
