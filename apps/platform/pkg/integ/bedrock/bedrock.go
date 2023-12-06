package bedrock

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func estimateTokens(characterCount int64) int64 {
	// I read it's a good rule of thumb to estimate tokens by dividing the
	// character count of input and output tokens by 6
	return characterCount / 6
}

type InvokeModelOptions struct {
	Input string `json:"input"`
	Model string `json:"model"`
}

func getBedrockConnection(ic *wire.IntegrationConnection) (*connection, error) {

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
	credentials *wire.Credentials
	client      *bedrockruntime.Client
}

type AnthropicOutput struct {
	Completion string `json:"completion"`
	StopReason string `json:"stop_reason"`
}

type AnthropicInput struct {
	Prompt            string   `json:"prompt"`
	MaxTokensToSample int      `json:"max_tokens_to_sample"`
	Temperature       float64  `json:"temperature"`
	TopK              int      `json:"top_k"`
	TopP              float64  `json:"top_p"`
	StopSequences     []string `json:"stop_sequences"`
}

// RunAction implements the system bot interface
func RunAction(bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]interface{}) (interface{}, error) {

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
		"max_tokens_to_sample": 2048,
	})
	if err != nil {
		return nil, err
	}

	// If we are doing Claude, do some special handling
	if options.Model == "anthropic.claude-v2" {
		body, err = json.Marshal(AnthropicInput{
			Prompt: "\n\nHuman:" + options.Input + "\n\nAssistant:",
			// TODO:
			MaxTokensToSample: 2048,
			Temperature:       0.0,
			TopK:              250,
			TopP:              0.999,
			StopSequences:     []string{"Human:", "```"},
		})
		if err != nil {
			return nil, err
		}
	}

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimateTokens(int64(len(options.Input))), c.session)

	input := &bedrockruntime.InvokeModelWithResponseStreamInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("*/*"),
	}

	output, err := c.client.InvokeModelWithResponseStream(context.Background(), input)
	if err != nil {
		return nil, err
	}
	reader := output.GetStream().Reader
	eventsChannel := reader.Events()
	outputStream := integ.NewStream()

	fmt.Println("initiating stream")

	go (func() {
		totalCharacters := int64(0)
		defer close(outputStream.Chunk())
		defer close(outputStream.Err())
		defer close(outputStream.Done())
		defer reader.Close()
		for e := range eventsChannel {
			switch event := e.(type) {
			case *brtypes.ResponseStreamMemberChunk:
				var modelOutput AnthropicOutput
				bytesChunk := event.Value.Bytes
				if err := json.Unmarshal(event.Value.Bytes, &modelOutput); err != nil {
					outputStream.Err() <- err
					break
				}
				totalCharacters = totalCharacters + int64(len(modelOutput.Completion))
				if modelOutput.StopReason != "" {
					fmt.Println("STOP REASON ENCOUNTERED: " + modelOutput.StopReason)
					break
				}
				fmt.Println("CHUNK received: " + string(bytesChunk))
				outputStream.Chunk() <- []byte(modelOutput.Completion)
			}
		}
		if reader.Err() != nil {
			outputStream.Err() <- reader.Err()
		}
		usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimateTokens(totalCharacters), c.session)
		outputStream.Done() <- totalCharacters
	})()

	fmt.Println("returning outputStream")

	return outputStream, nil

}
