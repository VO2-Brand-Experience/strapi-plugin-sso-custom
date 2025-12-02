import { z } from 'zod'

const userProfileSchema = z.object({
  username: z.string(),
  email: z.string(),
})
export type UserProfile = z.infer<typeof userProfileSchema>

const tokenResponseSchema = z.object({
  id_token: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
})
export type TokenResponse = z.infer<typeof tokenResponseSchema>

const getUserProfileSchema = z.function(z.tuple([tokenResponseSchema]), z.promise(userProfileSchema).or(userProfileSchema))

const configSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  scopes: z.array(z.string()).min(1),
  ssoRedirectUri: z.string().url(),
  appRedirectUri: z.string().url(),
  getUserProfile: getUserProfileSchema,
})
export type Config = z.infer<typeof configSchema>

export default {
  validator(config: unknown) {
    configSchema.parse(config)
  },
}
