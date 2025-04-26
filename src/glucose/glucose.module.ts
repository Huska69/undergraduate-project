// src/glucose/glucose.module.ts
import { Module } from '@nestjs/common';
import { GlucoseController } from './glucose.controller';
import { GlucoseService } from './glucose.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GlucoseController],
  providers: [GlucoseService],
  exports: [GlucoseService],
})
export class GlucoseModule {}