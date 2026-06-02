import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../typeorm/entities/document.entity';
import { AgentService } from '../agent/agent.service';
import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly agentService: AgentService,
  ) {}

  async findAll(userId: string) {
    return this.documentRepo.find({
      where: { modifiedBy: { id: userId } },
      relations: ['modifiedBy'],
    });
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

  private async createPdfFromText(text: string, filePath: string, title: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // Tambahkan Judul
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      
      // Tambahkan Konten
      doc.fontSize(12).text(text, { align: 'justify' });
      
      doc.end();
      
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  async generateRecap(sourceDocumentIds: string[], context: string, userId: string, customTitle?: string) {
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
    
    const finalTitle = customTitle || 'AI Generate - Recap';
    const filename = `${Date.now()}-recap.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    await this.createPdfFromText(aiResponse.answer, filePath, finalTitle);
    
    const stat = fs.statSync(filePath);
    const newDoc = this.documentRepo.create({
      title: finalTitle,
      file_url: `/uploads/${filename}`,
      file_size: stat.size,
      file_type: 'application/pdf',
      location: 'AI Generated',
      modifiedBy: { id: userId },
    });
    const savedDoc = await this.documentRepo.save(newDoc);

    return {
      result: aiResponse.answer,
      document: savedDoc,
      document_url: savedDoc.file_url,
    };
  }

  async generateReport(sourceDocumentIds: string[], context: string, userId: string, customTitle?: string) {
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
    
    const finalTitle = customTitle || 'AI Generate - Report';
    const filename = `${Date.now()}-report.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    await this.createPdfFromText(aiResponse.answer, filePath, finalTitle);
    
    const stat = fs.statSync(filePath);
    const newDoc = this.documentRepo.create({
      title: finalTitle,
      file_url: `/uploads/${filename}`,
      file_size: stat.size,
      file_type: 'application/pdf',
      location: 'AI Generated',
      modifiedBy: { id: userId },
    });
    const savedDoc = await this.documentRepo.save(newDoc);

    return {
      result: aiResponse.answer,
      document: savedDoc,
      document_url: savedDoc.file_url,
    };
  }

  async generateMom(sourceDocumentIds: string[], context: string, userId: string, customTitle?: string) {
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
    
    const finalTitle = customTitle || 'AI Generate - MoM';
    const filename = `${Date.now()}-mom.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    await this.createPdfFromText(aiResponse.answer, filePath, finalTitle);
    
    const stat = fs.statSync(filePath);
    const newDoc = this.documentRepo.create({
      title: finalTitle,
      file_url: `/uploads/${filename}`,
      file_size: stat.size,
      file_type: 'application/pdf',
      location: 'AI Generated',
      modifiedBy: { id: userId },
    });
    const savedDoc = await this.documentRepo.save(newDoc);

    return {
      result: aiResponse.answer,
      document: savedDoc,
      document_url: savedDoc.file_url,
    };
  }
}
