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

export class CloudFront extends Construct {
	public readonly distribution: Cf.Distribution
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

		this.distribution = new Cf.Distribution(this, 'cloudFront', {
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
					defaultTtl: Duration.minutes(1),
					minTtl: Duration.minutes(1),
				}),
			},
			domainNames: ['echo.thingy.rocks'],
			certificate: CertificateManager.Certificate.fromCertificateArn(
				this,
				'distributionCert',
				// us-east-1 is required for CloudFront
				`arn:aws:acm:us-east-1:${
					Stack.of(this).account
				}:certificate/067dc75e-e8a7-4a28-aaa8-ff26f43f639c`,
			),
		})
	}
}
