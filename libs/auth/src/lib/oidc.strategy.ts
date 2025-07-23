import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-openidconnect';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor() {
    super({
      issuer: 'YOUR_OIDC_ISSUER',
      authorizationURL: 'YOUR_OIDC_AUTHORIZATION_URL',
      tokenURL: 'YOUR_OIDC_TOKEN_URL',
      userInfoURL: 'YOUR_OIDC_USERINFO_URL',
      clientID: 'YOUR_OIDC_CLIENT_ID',
      clientSecret: 'YOUR_OIDC_CLIENT_SECRET',
      callbackURL: 'http://localhost:3333/api/auth/oidc/callback',
      scope: 'openid profile email',
    });
  }

  async validate(issuer: string, profile: any) {
    // In a real app, you'd link the OIDC profile to a user in your database
    return {
      id: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName,
    };
  }
}
