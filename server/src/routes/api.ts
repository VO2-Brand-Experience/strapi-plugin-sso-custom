export default [
  {
    method: 'POST',
    path: '/sso-passport/connect',
    handler: 'api.connect',
  },
  {
    method: 'POST',
    path: '/sso-passport/redirect',
    handler: 'api.redirect',
  },
]
