import { ConfigService } from '@nestjs/config';
import type { ApiConfig } from '@abd/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import session from 'express-session';
import passport from 'passport';
import 'multer';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const api = configService.get<ApiConfig>('api');

  app.enableCors();

  app.use(
    session({
      secret: 'super-secret-key-that-you-should-replace-in-production',
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // TODO: use host?
  await app.listen(api.port, () => {
    Logger.log(`Listening at http://localhost:${api.port}/${globalPrefix}`);
  });
}

bootstrap();
