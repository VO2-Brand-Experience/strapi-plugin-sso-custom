# Strapi v5 - Plugin SSO Custom

## Usage

To configure the plugin, add your configuration to the plugin settings:

```typescript
import { type Config as SSOConfig } from 'strapi-plugin-sso-custom/dist/server/src/config'
import jwt from 'jsonwebtoken'

export default ({ env }) => ({
  // ...
  'sso-custom': {
    enabled: true,
    config: {
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      scopes: process.env.OAUTH_SCOPES.split(','),
      authorizationUrl: 'https://some-domain.com/oauth2/authorize',
      tokenUrl: 'https://some-domain.com/oauth2/token',
      ssoRedirectUri: 'https://strapi.your-application.com/api/sso-custom/connect/redirect',
      appRedirectUri: 'https://your-application.com/auth/callback',
      getUserProfile: (accessToken: string) => {
        const decodedToken = jwt.decode(accessToken, { json: true })
        return {
          email: decodedToken.upn,
          username: decodedToken.unique_name,
        }
      },
    } satisfies SSOConfig,
  },
})
```
