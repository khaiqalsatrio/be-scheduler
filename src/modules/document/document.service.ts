import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../typeorm/entities/document.entity';
import { AgentService } from '../agent/agent.service';
import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');

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

  async create(
    file: Express.Multer.File,
    userId: string,
    title?: string,
    location?: string,
  ) {
    const newDoc = this.documentRepo.create({
      title: title || file.originalname,
      file_url: `/uploads/${file.filename}`,
      file_size: file.size,
      file_type: file.mimetype,
      location: location || 'Server Upload',
      modifiedBy: { id: userId },
    });
    return this.documentRepo.save(newDoc);
  }

  async remove(id: string) {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.documentRepo.remove(doc);
  }

  private async extractFileText(doc: Document): Promise<string | null> {
    try {
      if (!doc || !doc.file_url) return null;
      const filename = doc.file_url.split('/').pop();
      if (!filename) return null;
      
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (!fs.existsSync(filePath)) return null;

      if (doc.file_type === 'application/pdf' || doc.file_url.endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
      }
      
      if (doc.file_type === 'text/plain' || doc.file_url.endsWith('.txt')) {
        return fs.readFileSync(filePath, 'utf8');
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting text:', error);
      return null;
    }
  }

  async generateRecap(sourceDocumentIds: string[], context: string) {
    let docTitle = 'Dokumen';
    let fileContent = '';
    if (sourceDocumentIds && sourceDocumentIds.length > 0) {
      const doc = await this.documentRepo.findOne({ where: { id: sourceDocumentIds[0] } });
      if (doc) {
        docTitle = doc.title;
        const text = await this.extractFileText(doc);
        if (text) fileContent = `\n\nIsi Dokumen:\n${text.substring(0, 15000)}`;
      }
    }
    const prompt = `Tolong buatkan rekap/ringkasan berdasarkan konteks: ${context}. Judul dokumen adalah "${docTitle}". ${fileContent ? fileContent : '(Teks tidak tersedia, buatkan simulasi logis berdasarkan judul saja)'}`;
    const aiResponse = await this.agentService.askAgent(prompt);
    return {
      result: aiResponse.answer,
      document_url: 'http://mockurl.com/recap.pdf',
    };
  }

  async generateReport(sourceDocumentIds: string[], context: string) {
    let docTitle = 'Dokumen';
    let fileContent = '';
    if (sourceDocumentIds && sourceDocumentIds.length > 0) {
      const doc = await this.documentRepo.findOne({ where: { id: sourceDocumentIds[0] } });
      if (doc) {
        docTitle = doc.title;
        const text = await this.extractFileText(doc);
        if (text) fileContent = `\n\nIsi Dokumen:\n${text.substring(0, 15000)}`;
      }
    }
    const prompt = `Tolong buatkan laporan (report) berdasarkan konteks: ${context}. Judul dokumen adalah "${docTitle}". ${fileContent ? fileContent : '(Teks tidak tersedia, buatkan simulasi logis berdasarkan judul saja)'}`;
    const aiResponse = await this.agentService.askAgent(prompt);
    return {
      result: aiResponse.answer,
      document_url: 'http://mockurl.com/report.pdf',
    };
  }

  async generateMom(sourceDocumentIds: string[], context: string) {
    let docTitle = 'Dokumen';
    let fileContent = '';
    if (sourceDocumentIds && sourceDocumentIds.length > 0) {
      const doc = await this.documentRepo.findOne({ where: { id: sourceDocumentIds[0] } });
      if (doc) {
        docTitle = doc.title;
        const text = await this.extractFileText(doc);
        if (text) fileContent = `\n\nIsi Dokumen:\n${text.substring(0, 15000)}`;
      }
    }
    const prompt = `Tolong buatkan Minutes of Meeting (MoM) berdasarkan konteks: ${context}. Judul dokumen adalah "${docTitle}". ${fileContent ? fileContent : '(Teks tidak tersedia, buatkan simulasi MoM logis berdasarkan judul saja)'}`;
    const aiResponse = await this.agentService.askAgent(prompt);
    return {
      result: aiResponse.answer,
      document_url: 'http://mockurl.com/mom.pdf',
    };
  }
}
