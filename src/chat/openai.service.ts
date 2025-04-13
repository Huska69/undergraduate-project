import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; name?: string }>) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages,
      });
      
      return response.choices[0].message;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateContextAwareResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    user: any
  ) {
    // Create a system message with user context
    const systemPrompt = this.createSystemPrompt(user, messages);
    
    // Create message array with system prompt
    const contextualizedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [{
      role: 'system' as const,
      content: systemPrompt
    }];
    
    // Add user and assistant messages (excluding any existing system messages)
    messages.forEach(msg => {
      if (msg.role !== 'system') {
        contextualizedMessages.push(msg);
      }
    });
    
    return this.generateResponse(contextualizedMessages);
  }

  private createSystemPrompt(user: any, messages: Array<any>): string {
    // Base user context
    let systemPrompt = this.formatUserContext(user);
    
    // Detect question type from the latest user message
    const latestUserMessage = messages.findLast(msg => msg.role === 'user')?.content || '';
    
    // Add specialized instructions based on question type
    if (this.isAboutGlucose(latestUserMessage)) {
      systemPrompt += this.getGlucoseSpecificInstructions();
    } 
    else if (this.isAboutDiet(latestUserMessage)) {
      systemPrompt += this.getDietSpecificInstructions();
    }
    else if (this.isAboutExercise(latestUserMessage)) {
      systemPrompt += this.getExerciseSpecificInstructions();
    }
    
    return systemPrompt;
  }

  private formatUserContext(user: any): string {
    // Format user data into a helpful system prompt
    return `You are a helpful health assistant for our glucose monitoring app.
You provide advice about diet, exercise and health based on the user's profile.

Here's what you know about the user:
- Name: ${user.name}
- Age: ${user.age || 'Not specified'}
- Sex: ${user.sex || 'Not specified'}
- Height: ${user.height ? `${user.height} cm` : 'Not specified'}
- Weight: ${user.weight ? `${user.weight} kg` : 'Not specified'}
- Blood Type: ${user.blood || 'Not specified'}
- Allergies: ${user.allergies || 'None specified'}
- Medical Conditions: ${user.medCond || 'None specified'}
- Medications: ${user.meds || 'None specified'}
- Pregnancy Status: ${user.pregnancy ? 'Pregnant' : 'Not pregnant or not specified'}

Your goal is to help the user manage their glucose levels through diet and lifestyle advice.
Be personalized but cautious - always recommend consulting healthcare professionals for medical issues.
The application uses ESP32 hardware to monitor glucose levels and has ML models for prediction.
`;
  }

  private isAboutGlucose(message: string): boolean {
    const glucoseKeywords = ['glucose', 'sugar level', 'blood sugar', 'diabetes', 'hyperglycemia', 'hypoglycemia'];
    return glucoseKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isAboutDiet(message: string): boolean {
    const dietKeywords = ['diet', 'food', 'eat', 'meal', 'nutrition', 'carb', 'carbohydrate', 'protein', 'fat'];
    return dietKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isAboutExercise(message: string): boolean {
    const exerciseKeywords = ['exercise', 'workout', 'fitness', 'activity', 'sport', 'run', 'walk', 'gym'];
    return exerciseKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private getGlucoseSpecificInstructions(): string {
    return `\nThe user is asking about glucose levels. Based on their profile, provide specific advice 
on managing glucose. Remember that normal blood glucose levels typically range from 70-140 mg/dL. 
Suggest foods that help stabilize glucose based on their profile information.
Explain how different foods affect blood glucose levels, focusing on glycemic index and load.
For someone monitoring glucose, emphasize the importance of regular monitoring and how to interpret readings.`;
  }

  private getDietSpecificInstructions(): string {
    return `\nThe user is asking about diet. Provide personalized dietary recommendations 
based on their profile information. Consider their allergies, medical conditions and medications.
Focus on foods that help maintain stable glucose levels. Recommend specific meal plans or food choices.
Be mindful of cultural preferences and practical considerations, suggesting real-world implementable changes.`;
  }

  private getExerciseSpecificInstructions(): string {
    return `\nThe user is asking about exercise. Provide personalized exercise recommendations
based on their profile. Consider their age, sex, medical conditions, and medications.
Explain how different types of exercise can impact glucose levels. Be specific about duration, frequency, and intensity
while keeping recommendations realistic and achievable. Emphasize safety and gradual progression.`;
  }
}