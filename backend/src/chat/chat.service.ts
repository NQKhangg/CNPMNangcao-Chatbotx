import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(private readonly httpService: HttpService) {}

  async chatWithAI(question: string) {
    try {
      // Gọi sang Python Service đang chạy ở port 8000
      const url = 'http://localhost:8000/chat';
      const response = await lastValueFrom(
        this.httpService.post(url, { question }),
      );
      return response.data; // { answer: "..." , context_used: "..."}
    } catch (error) {
      return { answer: 'Hệ thống AI đang bảo trì, vui lòng thử lại sau!' };
    }
  }
}
