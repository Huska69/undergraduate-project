import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // Strip extra fields
  

  app.enableCors();
  
  await app.listen(3000);  // Use correct port and listen on all interfaces
  console.log(`Application is running on:  ${await app.getUrl()}`);
}
bootstrap();




