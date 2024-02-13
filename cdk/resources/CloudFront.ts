import {
	aws_certificatemanager as CertificateManager,
	aws_cloudfront as Cf,
	aws_cloudfront_origins as CfOrigins,
	Duration,
	Fn,
	Stack,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import type { RESTAPI } from './RESTAPI'
import { CacheHeaderBehavior } from 'aws-cdk-lib/aws-cloudfront'

export class CloudFront extends Construct {
	public readonly domainNames: string[]
	public constructor(parent: Construct, restAPI: RESTAPI) {
		super(parent, 'CloudFront')

		// We need a CloudFront distribution in front of it to allow non-secure HTTP requests

		const lambdaOrigin = new CfOrigins.HttpOrigin(
			Fn.select(2, Fn.split('/', restAPI.lambdaURL.url)),
			{
				originId: 'lambdaOrigin',
				originPath: '/',
				connectionTimeout: Duration.seconds(1),
				keepaliveTimeout: Duration.seconds(1),
			},
		)

		const customDomainNames = this.node.tryGetContext('customDomainNames')
		const customDomainCertificateId = this.node.tryGetContext(
			'customDomainCertificateId',
		)
		const distribution = new Cf.Distribution(this, 'cloudFront', {
			enabled: true,
			priceClass: Cf.PriceClass.PRICE_CLASS_100,
			defaultBehavior: {
				origin: lambdaOrigin,
				allowedMethods: Cf.AllowedMethods.ALLOW_ALL,
				cachedMethods: Cf.CachedMethods.CACHE_GET_HEAD_OPTIONS,
				compress: false,
				smoothStreaming: false,
				viewerProtocolPolicy: Cf.ViewerProtocolPolicy.ALLOW_ALL,
				cachePolicy: new Cf.CachePolicy(this, 'defaultCachePolicy', {
					defaultTtl: Duration.seconds(1),
					headerBehavior: CacheHeaderBehavior.allowList('accept-encoding'),
				}),
			},
			domainNames:
				customDomainNames !== undefined ? customDomainNames : undefined,
			certificate:
				customDomainCertificateId !== undefined
					? CertificateManager.Certificate.fromCertificateArn(
							this,
							'distributionCert',
							// us-east-1 is required for CloudFront
							`arn:aws:acm:us-east-1:${
								Stack.of(this).account
							}:certificate/${customDomainCertificateId}`,
						)
					: undefined,
		})
		this.domainNames =
			customDomainNames === undefined
				? [distribution.domainName]
				: customDomainNames
	}
}
