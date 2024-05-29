package bedrock

import (
	"encoding/json"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type MessagesModelUsage struct {
	InputTokens  int64 `json:"input_tokens"`
	OutputTokens int64 `json:"output_tokens"`
}

type MessagesContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type MessagesModelOutput struct {
	Content    []MessagesContent   `json:"content"`
	StopReason string              `json:"stop_reason"`
	Usage      *MessagesModelUsage `json:"usage"`
}

type AnthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AnthropicMessagesInput struct {
	Messages         []AnthropicMessage `json:"messages"`
	AnthropicVersion string             `json:"anthropic_version"`
	MaxTokens        int                `json:"max_tokens"`
	Temperature      float64            `json:"temperature,omitempty"`
	TopK             int                `json:"top_k,omitempty"`
	TopP             float64            `json:"top_p,omitempty"`
	StopSequences    []string           `json:"stop_sequences,omitempty"`
	System           string             `json:"system"`
}

func (c *connection) invokeModel(requestOptions map[string]interface{}) (interface{}, error) {

	options, err := hydrateOptions(requestOptions)
	if err != nil {
		return nil, err
	}
	// TODO: Validate the model against Bedrock's known valid models!!!
	body, err := getModelBody(options)
	if err != nil {
		return nil, err
	}

	input := &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	}

	output, err := c.client.InvokeModel(c.session.Context(), input)
	if err != nil {
		return nil, handleBedrockError(err)
	}

	var modelOutput MessagesModelOutput
	if err := json.Unmarshal(output.Body, &modelOutput); err != nil {
		return "", err
	}

	if modelOutput.Content == nil {
		return "", errors.New("Invalid Response from Bedrock")
	}
	if len(modelOutput.Content) < 1 {
		return "", errors.New("Invalid Response from Bedrock")
	}
	if modelOutput.Usage == nil {
		return "", errors.New("No usage information provided")
	}

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), modelOutput.Usage.InputTokens, c.session)

	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), modelOutput.Usage.OutputTokens, c.session)

	return modelOutput.Content[0].Text, nil
}
