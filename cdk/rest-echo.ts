import { IAMClient } from '@aws-sdk/client-iam'
import pJSON from '../package.json'
import { RestEchoApp } from './RestEchoApp.js'
import { ensureGitHubOIDCProvider } from './ensureGitHubOIDCProvider.js'

const repoUrl = new URL(pJSON.repository.url)
const repository = {
	owner: repoUrl.pathname.split('/')[1] ?? 'bifravst',
	repo: repoUrl.pathname.split('/')[2]?.replace(/\.git$/, '') ?? 'rest-echo',
}

const iam = new IAMClient({})

new RestEchoApp({
	repository,
	gitHubOICDProviderArn: await ensureGitHubOIDCProvider({
		iam,
	}),
	isTest: process.env.CI === '1',
	customDomain:
		process.env.DOMAIN_NAME !== undefined &&
		process.env.CERTIFICATE_ID !== undefined
			? {
					domainName: process.env.DOMAIN_NAME,
					certificateId: process.env.CERTIFICATE_ID,
				}
			: undefined,
})
