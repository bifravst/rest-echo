import config from '@bifravst/eslint-config-typescript'
export default [...config, { ignores: ['lambda/api.ts', 'cdk.out/*'] }]
