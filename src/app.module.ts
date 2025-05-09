import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { GlucoseModule } from './glucose/glucose.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ChatModule,
    GlucoseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}