import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

@Injectable() 
export class OpenAIService {
    private openai: OpenAI; 

    constructor(private configService: ConfigService){
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async generateResponse(messages: Array<{ role: string; content: string;}>) {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.configService.get<string>('OPENAI_MODEL') || 'chatgpt-4o-latest', 
                messages,
            });

        } catch (error){
            console.error('OPEN AI API ERROR', error);
            throw new Error('Failed to generate AI response');
        }    
    }
}