package creds

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getConfig(ctx context.Context, region, endpoint, accessKeyID, secretAccessKey, sessionToken string) (aws.Config, error) {
	// If we have UESIO_AWS_* variables, apply them to options.  Note that AWS SDK will look for AWS_* environment variables
	// as a fallback if not provided explicitly in the config meaning if the enviornment has AWS_* variables but not UESIO_AWS_*
	// AWS will still work.
	// TODO: Reevaluate how we translate config values from UESIO_ to variable third-party systems like AWS.  SHould we always
	// require UESIO_<provider>_* variables or allow fallback to the third-party default functionality.
	var opts []func(*config.LoadOptions) error
	if region != "" {
		opts = append(opts, config.WithRegion(region))
	}
	if accessKeyID != "" || secretAccessKey != "" {
		// note that sessionToken is optional (although recommended) and therefore not enforced
		// TODO: Evaluate if we should require session token.  Need to look in to AWS SDK to see if
		// there is underlying automatic refresh logic when explicit values are provided and when
		// IAM role is used in lieu of explicit config from env.
		opts = append(opts, config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, sessionToken)))
	}
	cfg, err := config.LoadDefaultConfig(ctx, opts...)
	if err != nil {
		return cfg, err
	}

	// TODO: This was legacy behavior for Digital Ocean which required setting the endpoint. From reading AWS docs, the usage of BaseEndpoint appears
	// to be very service specific.  Since this credential is generic to AWS, setting an endpoint here may cause issues with some services.  Need
	// to monitor this and potentially remove or adjust how it is used.  @humandad has the background on this.
	if endpoint != "" {
		cfg.BaseEndpoint = aws.String(endpoint)
	}

	return cfg, err
}

func GetAWSConfig(ctx context.Context, dbcreds *wire.Credentials) (aws.Config, error) {

	region, ok := (*dbcreds)["region"]
	if !ok {
		return aws.Config{}, errors.New("no region provided in credentials")
	}

	endpoint := (*dbcreds)["endpoint"]
	accessKeyID := (*dbcreds)["accessKeyId"]
	secretAccessKey := (*dbcreds)["secretAccessKey"]
	sessionToken := (*dbcreds)["sessionToken"]

	return getConfig(ctx, region, endpoint, accessKeyID, secretAccessKey, sessionToken)

}
