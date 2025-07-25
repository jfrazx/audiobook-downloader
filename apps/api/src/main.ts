import { ConfigService } from '@nestjs/config';
import type { ApiConfig } from '@abd/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import session from 'express-session';
import process from 'node:process';
import passport from 'passport';
import 'multer';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const api = configService.get<ApiConfig>('api');

  app.enableCors({
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
    exposedHeaders: ['Authorization'],
  });

  app.use(
    session({
      secret:
        configService.get<string>('SESSION_SECRET') ||
        'super-secret-key-that-you-should-replace-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      },
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
