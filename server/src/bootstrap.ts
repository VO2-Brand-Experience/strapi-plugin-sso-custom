import type { Core } from '@strapi/strapi'
import type { OpenAPIV3 } from 'openapi-types'

import { PLUGIN_ID } from './pluginId'

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  // bootstrap phase

  // Override the documentation plugin to add this plugin's endpoints
  const documentationPlugin = strapi.plugin('documentation')
  if (documentationPlugin) {
    const paths: Record<string, Record<string, Partial<OpenAPIV3.OperationObject>>> = {
      [`/${PLUGIN_ID}/connect`]: {
        get: {
          tags: [PLUGIN_ID],
          responses: {
            '301': {
              description: 'Redirect response',
            },
          },
        },
      },
      [`/${PLUGIN_ID}/connect/redirect`]: {
        get: {
          tags: [PLUGIN_ID],
          responses: {
            '301': {
              description: 'Redirect response',
            },
          },
        },
      },
    }
    
    documentationPlugin.service('override').registerOverride({ paths })
  }
}

export default bootstrap
