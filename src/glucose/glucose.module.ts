import { Module } from '@nestjs/common';
import { GlucoseController } from './glucose.controller';
import { GlucoseService } from './glucose.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserApiKeyService } from './user-api-key.service';

@Module({
  imports: [PrismaModule],
  controllers: [GlucoseController],
  providers: [GlucoseService, UserApiKeyService],
  exports: [GlucoseService, UserApiKeyService],
})
export class GlucoseModule {}
