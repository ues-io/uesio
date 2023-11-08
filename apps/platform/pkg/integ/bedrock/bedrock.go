package bedrock

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/creds"
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

func getBedrockConnection(ic *adapt.IntegrationConnection) (*connection, error) {

	cfg, err := creds.GetAWSConfig(context.Background(), ic.GetCredentials())
	if err != nil {
		return nil, err
	}

	client := bedrockruntime.NewFromConfig(cfg)

	return &connection{
		session:     ic.GetSession(),
		integration: ic.GetIntegration(),
		credentials: ic.GetCredentials(),
		client:      client,
	}, nil

}

type connection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *adapt.Credentials
	client      *bedrockruntime.Client
}

// RunAction implements the system bot interface
func RunAction(bot *meta.Bot, ic *adapt.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error) {

	bc, err := getBedrockConnection(ic)
	if err != nil {
		return nil, err
	}

	switch strings.ToLower(actionName) {
	case "invokemodel":
		return bc.invokeModel(params)
	}

	return nil, errors.New("invalid action name for Bedrock integration")

}

func (c *connection) invokeModel(requestOptions map[string]interface{}) (interface{}, error) {

	options := &InvokeModelOptions{
		requestOptions["input"].(string),
		requestOptions["model"].(string),
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
