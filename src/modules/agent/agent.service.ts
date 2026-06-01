import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async askAgent(query: string) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      const result = await model.generateContent(query);
      const responseText = result.response.text();

      return {
        answer: responseText,
        references: [],
      };
    } catch (error: any) {
      this.logger.error('Error asking Gemini:', error);

      // Jika error karena limit API
      if (
        error?.status === 429 ||
        (error?.message && error.message.includes('429'))
      ) {
        throw new HttpException(
          'Mohon maaf, kuota harian penggunaan AI telah mencapai batas. Silakan coba lagi nanti.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Jika error karena server sibuk
      if (
        error?.status === 503 ||
        (error?.message && error.message.includes('503'))
      ) {
        throw new HttpException(
          'Server AI sedang sibuk. Silakan coba beberapa saat lagi.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        error?.message || 'Gagal mendapatkan respon dari AI Agent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
