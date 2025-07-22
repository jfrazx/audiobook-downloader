import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as LibAuthModule } from '@abd/auth';

@Module({
  imports: [LibAuthModule],
  controllers: [AuthController],
})
export class AuthModule {}
