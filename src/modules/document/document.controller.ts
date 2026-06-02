import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getDocuments(@User('userId') userId: string) {
    return this.documentService.findAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('location') location: string,
    @User('userId') userId: string,
  ) {
    return this.documentService.create(file, userId, title, location);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    return this.documentService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate/recap')
  async generateRecap(
    @Body() body: { source_document_ids: string[]; context: string; title?: string },
    @User('userId') userId: string,
  ) {
    return this.documentService.generateRecap(
      body.source_document_ids,
      body.context,
      userId,
      body.title,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate/report')
  async generateReport(
    @Body() body: { source_document_ids: string[]; context: string; title?: string },
    @User('userId') userId: string,
  ) {
    return this.documentService.generateReport(
      body.source_document_ids,
      body.context,
      userId,
      body.title,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate/mom')
  async generateMom(
    @Body() body: { source_document_ids: string[]; context: string; title?: string },
    @User('userId') userId: string,
  ) {
    return this.documentService.generateMom(
      body.source_document_ids,
      body.context,
      userId,
      body.title,
    );
  }
}
