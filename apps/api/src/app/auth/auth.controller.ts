import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '@abd/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('oidc'))
  @Get('oidc')
  async oidcLogin() {
    // initiates the OIDC redirection
  }

  @UseGuards(AuthGuard('oidc'))
  @Get('oidc/callback')
  async oidcCallback(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  getStatus(@Request() req) {
    return req.user;
  }
}
