import { z } from 'zod'

const userProfileSchema = z.object({
  username: z.string(),
  email: z.string(),
})
export type UserProfile = z.infer<typeof userProfileSchema>

const getUserProfileSchema = z.function().args(z.string()).returns(z.promise(userProfileSchema))

const configSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  scopes: z.array(z.string()).nonempty(),
  redirectUri: z.string().url(),
  getUserProfile: getUserProfileSchema,
})
export type Config = z.infer<typeof configSchema>

export default {
  validator(config: unknown) {
    configSchema.parse(config)
  },
}
