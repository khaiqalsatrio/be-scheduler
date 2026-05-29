import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../typeorm/entities/document.entity';
import { AgentService } from '../agent/agent.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly agentService: AgentService,
  ) {}

  async findAll() {
    return this.documentRepo.find({ relations: ['modifiedBy'] });
  }

  async create(file: Express.Multer.File, userId: string, title?: string, location?: string) {
    const newDoc = this.documentRepo.create({
      title: title || file.originalname,
      file_url: `/uploads/${file.filename}`, 
      file_size: file.size,
      file_type: file.mimetype,
      location: location || 'Server Upload',
      modifiedBy: { id: userId } as any,
    });
    return this.documentRepo.save(newDoc);
  }

  async remove(id: string) {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.documentRepo.remove(doc);
  }

  async generateRecap(sourceDocumentIds: string[], context: string) {
    const prompt = `Tolong buatkan rekap/ringkasan berdasarkan konteks berikut: ${context}. Abaikan sourceDocumentIds untuk saat ini.`;
    const aiResponse = await this.agentService.askAgent(prompt);
    return { result: aiResponse.answer, document_url: "http://mockurl.com/recap.pdf" };
  }

  async generateReport(sourceDocumentIds: string[], context: string) {
    const prompt = `Tolong buatkan laporan (report) berdasarkan konteks berikut: ${context}. Abaikan sourceDocumentIds untuk saat ini.`;
    const aiResponse = await this.agentService.askAgent(prompt);
    return { result: aiResponse.answer, document_url: "http://mockurl.com/report.pdf" };
  }

  async generateMom(sourceDocumentIds: string[], context: string) {
    const prompt = `Tolong buatkan Minutes of Meeting (MoM) berdasarkan konteks berikut: ${context}. Abaikan sourceDocumentIds untuk saat ini.`;
    const aiResponse = await this.agentService.askAgent(prompt);
    return { result: aiResponse.answer, document_url: "http://mockurl.com/mom.pdf" };
  }
}
