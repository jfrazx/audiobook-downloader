import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiConfig } from '@abd/config';
import type { Request } from 'express';

@Injectable()
export class OdmGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const headerKey = request.get('x-api-key');
    const api = this.configService.get<ApiConfig>('api');

    return api.keys.includes(headerKey);
  }
}
