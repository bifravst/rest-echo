import config from '@bifravst/eslint-config-typescript'
import globals from 'globals'

export default [
	...config,
	{
		// lambda/api.js is plain JavaScript and not part of the TypeScript
		// project, so the project service has to put it in the default project
		// for it to be linted at all. The project service is created once for
		// the whole run, so this must not be scoped to `files`.
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['lambda/api.js'],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		// ... and it is CommonJS running on Node.
		files: ['lambda/api.js'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: globals.node,
		},
	},
	{ ignores: ['cdk.out/*'] },
]
