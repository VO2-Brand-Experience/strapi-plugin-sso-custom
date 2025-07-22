export default [
  {
    method: 'GET',
    path: '/connect',
    handler: 'api.connect',
  },
  {
    method: 'GET',
    path: '/connect/redirect',
    handler: 'api.redirect',
  },
]
