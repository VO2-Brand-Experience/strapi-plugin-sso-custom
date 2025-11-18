import type { Context } from 'koa'
import type { Core } from '@strapi/strapi'
import { UserProfile, type Config } from '../config'
import { PLUGIN_ID } from '../pluginId'

interface AdvancedSettings {
  default_role: string
}

interface StrapiRole {
  id: number
  name: string
  type: string
  description: string
}

async function exchangeCodeForToken(code: string) {
  const clientID = strapi.plugin(PLUGIN_ID).config('clientId') as Config['clientId']
  const clientSecret = strapi.plugin(PLUGIN_ID).config('clientSecret') as Config['clientSecret']
  const tokenURL = strapi.plugin(PLUGIN_ID).config('tokenUrl') as Config['tokenUrl']
  const ssoRedirectUri = strapi.plugin(PLUGIN_ID).config('ssoRedirectUri') as Config['ssoRedirectUri']

  const response = await fetch(tokenURL, {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: clientID,
      client_secret: clientSecret,
      redirect_uri: ssoRedirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })
    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      headers,
      body: errorText,
      url: response.url,
    }
    throw new Error(`Failed to exchange code for access token: ${JSON.stringify(errorDetails)}`)
  }

  const data = (await response.json()) as { id_token: string, access_token: string, refresh_token: string }

  return data
}

async function getDefaultRole() {
  const advancedSettings = (await strapi.store.get({ type: 'plugin', name: 'users-permissions', key: 'advanced' })) as AdvancedSettings | null
  const roles = (await strapi.plugin('users-permissions').service('role').find()) as StrapiRole[]
  return roles.find((role) => role.type === advancedSettings?.default_role)
}

async function createUser(userProfile: UserProfile) {
  let user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: {
      email: userProfile.email,
    },
  })
  if (!user) {
    const defaultRole = await getDefaultRole()
    user = await strapi.service('plugin::users-permissions.user').add({
      ...userProfile,
      confirmed: true,
      role: defaultRole?.id,
    })
  }
  const jwt = await strapi.plugin('users-permissions').service('jwt').issue({ id: user.id })
  return { user, jwt }
}

const controller = ({ strapi: _strapi }: { strapi: Core.Strapi }) => ({
  connect(ctx: Context) {
    const clientID = strapi.plugin(PLUGIN_ID).config('clientId') as Config['clientId']
    const authorizationURL = strapi.plugin(PLUGIN_ID).config('authorizationUrl') as Config['authorizationUrl']
    const scopes = strapi.plugin(PLUGIN_ID).config('scopes') as Config['scopes']
    const ssoRedirectUri = strapi.plugin(PLUGIN_ID).config('ssoRedirectUri') as Config['ssoRedirectUri']

    const url = `${authorizationURL}?response_type=code&client_id=${clientID}&scope=${encodeURIComponent(scopes.join(' '))}&redirect_uri=${encodeURIComponent(ssoRedirectUri)}`

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
    const appRedirectUri = strapi.plugin(PLUGIN_ID).config('appRedirectUri') as Config['appRedirectUri']

    ctx.redirect(`${appRedirectUri}?access_token=${jwt}`)
  },
})

export default controller
