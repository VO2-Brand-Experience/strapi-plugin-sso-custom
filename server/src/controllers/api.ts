import type { Context } from 'koa'
import type { Core } from '@strapi/strapi'
import { UserProfile, type Config } from '../config'
import { PLUGIN_ID } from '../pluginId'

function getRedirectUri() {
  const url = strapi.config.get('server.url')
  return `${url}/api/sso-passport/connect/redirect`
}

async function exchangeCodeForToken(code: string) {
  const clientID = strapi.plugin(PLUGIN_ID).config('clientId') as Config['clientId']
  const clientSecret = strapi.plugin(PLUGIN_ID).config('clientSecret') as Config['clientSecret']
  const tokenURL = strapi.plugin(PLUGIN_ID).config('tokenUrl') as Config['tokenUrl']
  const redirectUri = getRedirectUri()

  const response = await fetch(tokenURL, {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: clientID,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to exchange code for access token')
  }

  const data = (await response.json()) as { id_token: string, access_token: string, refresh_token: string }

  return data
}

async function createUser(userProfile: UserProfile) {
  let user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: {
      email: userProfile.email,
    },
  })
  if (!user) {
    user = await strapi.service('plugin::users-permissions.user').add(userProfile)
  }
  const jwt = await strapi.plugin('users-permissions').service('jwt').issue({ id: user.id })
  return { user, jwt }
}

const controller = ({ strapi: _strapi }: { strapi: Core.Strapi }) => ({
  connect(ctx: Context) {
    const clientID = strapi.plugin(PLUGIN_ID).config('clientId') as Config['clientId']
    const authorizationURL = strapi.plugin(PLUGIN_ID).config('authorizationUrl') as Config['authorizationUrl']
    const scopes = strapi.plugin(PLUGIN_ID).config('scopes') as Config['scopes']
    const redirectUri = getRedirectUri()

    const url = `${authorizationURL}?response_type=code&client_id=${clientID}&scope=${encodeURIComponent(scopes.join(' '))}&redirect_uri=${encodeURIComponent(redirectUri)}`

    ctx.redirect(url)
  },

  async redirect(ctx: Context) {
    const code = ctx.query.code as string
    if (!code) {
      throw new Error('No code provided')
    }

    const token = await exchangeCodeForToken(code)

    const getUserProfile = strapi.plugin(PLUGIN_ID).config('getUserProfile') as Config['getUserProfile']
    const userProfile = await getUserProfile(token.id_token)

    const { jwt } = await createUser(userProfile)
    const redirectUri = strapi.plugin(PLUGIN_ID).config('redirectUri') as Config['redirectUri']

    ctx.redirect(`${redirectUri}?access_token=${jwt}`)
  },
})

export default controller
