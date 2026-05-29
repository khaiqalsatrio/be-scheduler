import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentService {
  async askAgent(query: string) {
    return {
      answer: `This is a mocked AI response for the query: "${query}"`,
      references: [],
    };
  }
}
