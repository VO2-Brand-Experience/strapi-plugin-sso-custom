export default [
  {
    method: 'GET',
    path: '/sso-passport/connect',
    handler: 'api.connect',
  },
  {
    method: 'GET',
    path: '/sso-passport/redirect',
    handler: 'api.redirect',
  },
]
