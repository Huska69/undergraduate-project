import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('gGauge')
    .setDescription('gGauge backend services')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable CORS for your mobile app
  app.enableCors();
  
  await app.listen(3000);  // Use correct port and listen on all interfaces
  console.log(`Application is running on:  ${await app.getUrl()}`);
}
bootstrap();

