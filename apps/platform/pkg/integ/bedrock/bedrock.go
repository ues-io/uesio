package bedrock

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func estimateTokens(value string) int64 {
	// I read it's a good rule of thumb to estimate tokens by dividing the
	// character count of input and output tokens by 6
	return int64(len(value) / 6)
}

type InvokeModelOptions struct {
	Input string `json:"input"`
	Model string `json:"model"`
}

type BedrockIntegration struct {
}

func (i *BedrockIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (adapt.IntegrationConnection, error) {

	cfg, err := creds.GetAWSConfig(context.Background(), credentials)
	if err != nil {
		return nil, err
	}

	client := bedrockruntime.NewFromConfig(cfg)

	return &Connection{
		session:     session,
		integration: integration,
		credentials: credentials,
		client:      client,
	}, nil
}

type Connection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *adapt.Credentials
	client      *bedrockruntime.Client
}

func (c *Connection) GetCredentials() *adapt.Credentials {
	return c.credentials
}

func (c *Connection) GetIntegration() *meta.Integration {
	return c.integration
}

func (c *Connection) RunAction(actionName string, requestOptions interface{}) (interface{}, error) {

	switch actionName {
	case "invokemodel":
		return c.InvokeModel(requestOptions)
	}

	return nil, errors.New("Invalid Action Name for Open AI integration")

}

func (c *Connection) InvokeModel(requestOptions interface{}) (interface{}, error) {

	options := &InvokeModelOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return nil, err
	}

	body, err := json.Marshal(&map[string]interface{}{
		"prompt":               options.Input,
		"max_tokens_to_sample": 2000,
	})
	if err != nil {
		return nil, err
	}

	input := &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	}

	output, err := c.client.InvokeModel(context.Background(), input)
	if err != nil {
		return nil, err
	}

	completionMap := map[string]string{}

	err = json.Unmarshal(output.Body, &completionMap)
	if err != nil {
		return nil, err
	}

	response := completionMap["completion"]

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimateTokens(options.Input), c.session)
	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimateTokens(response), c.session)

	return []string{response}, nil

}
