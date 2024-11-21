import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { CLIENT_PROXY } from '@abd/constants';
import { OdmController } from './odm.controller';
import { Logger, Module } from '@nestjs/common';
import { OdmService } from './odm.service';
import * as fs from 'node:fs';

@Module({
  controllers: [OdmController],
  providers: [OdmService],
  imports: [
    ClientsModule.register([{ name: CLIENT_PROXY, transport: Transport.MQTT }]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dest = configService.get<string>('files.uploadPath');

        const exists = await fs.promises.stat(dest).catch(() => false);
        if (!exists) {
          Logger.log(`Creating upload directory ${dest}`);
          await fs.promises.mkdir(dest, { recursive: true });
        }

        return {
          dest,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class OdmModule {}
