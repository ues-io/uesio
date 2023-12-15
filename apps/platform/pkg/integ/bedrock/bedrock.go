package bedrock

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/aws/smithy-go"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func estimateTokens(characterCount int64) int64 {
	// I read it's a good rule of thumb to estimate tokens by dividing the
	// character count of input and output tokens by 6
	return characterCount / 6
}

type InvokeModelOptions struct {
	Input             string  `json:"input"`
	Model             string  `json:"model"`
	MaxTokensToSample int     `json:"max_tokens_to_sample"`
	Temperature       float64 `json:"temperature"`
	TopK              int     `json:"top_k"`
	TopP              float64 `json:"top_p"`
}

func getBedrockConnection(ic *wire.IntegrationConnection) (*connection, error) {

	cfg, err := creds.GetAWSConfig(ic.Context(), ic.GetCredentials())
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

type ModelOutput struct {
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
	case "streammodel":
		return bc.streamModel(params)
	}

	return nil, errors.New("invalid action name for Bedrock integration")

}

const claudePromptStart = "\n\nHuman:"
const claudePromptEnding = "\n\nAssistant:"

func intWithDefault(v interface{}, defaultValue int) int {
	switch val := v.(type) {
	case int:
		return val
	case int64:
		return int(val)
	case float64:
		return int(val)
	}
	return defaultValue
}

func float64WithDefault(v interface{}, defaultValue float64) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case int:
		return float64(val)
	case int64:
		return float64(val)
	case float32:
		return float64(val)
	}
	return defaultValue
}

const MAX_TOKENS_TO_SAMPLE = 200000
const DEFAULT_TOKENS_TO_SAMPLE = 4096

func hydrateInvokeModelOptions(requestOptions map[string]interface{}) *InvokeModelOptions {

	maxTokensToSample := intWithDefault(requestOptions["max_tokens_to_sample"], DEFAULT_TOKENS_TO_SAMPLE)
	// Set a hard limit
	if maxTokensToSample > MAX_TOKENS_TO_SAMPLE {
		maxTokensToSample = MAX_TOKENS_TO_SAMPLE
	}
	temperature := float64WithDefault(requestOptions["temperature"], 0.5)
	if temperature < 0 {
		temperature = 0
	}
	if temperature > 1 {
		temperature = 1
	}
	topP := float64WithDefault(requestOptions["top_p"], 0.999)
	topK := intWithDefault(requestOptions["top_k"], 250)
	return &InvokeModelOptions{
		Input:             goutils.StringValue(requestOptions["input"]),
		Model:             goutils.StringValue(requestOptions["model"]),
		MaxTokensToSample: maxTokensToSample,
		Temperature:       temperature,
		TopK:              topK,
		TopP:              topP,
	}
}

func getModelBody(options *InvokeModelOptions) ([]byte, error) {

	body, err := json.Marshal(&map[string]interface{}{
		"prompt":               options.Input,
		"max_tokens_to_sample": options.MaxTokensToSample,
		// TODO: Verify what other parameters are valid for particular models!!!
		"temperature": options.Temperature,
	})
	if err != nil {
		return nil, err
	}

	// If we are doing Claude, do some special handling
	if options.Model == "anthropic.claude-v2" {
		claudePrompt := options.Input
		if !strings.Contains(claudePrompt, claudePromptStart) {
			claudePrompt = claudePromptStart + claudePrompt
		}
		if !strings.Contains(claudePrompt, claudePromptEnding) {
			claudePrompt = claudePrompt + claudePromptEnding
		}
		body, err = json.Marshal(AnthropicInput{
			// Claude has a VERY particular format. We need to make sure that if the format does not match,
			// that we populate it
			Prompt:            claudePrompt,
			MaxTokensToSample: options.MaxTokensToSample,
			Temperature:       options.Temperature,
			TopK:              options.TopK,
			TopP:              options.TopP,
			StopSequences:     []string{"Human:", "```"},
		})
		if err != nil {
			return nil, err
		}
	}
	return body, nil
}

func (c *connection) streamModel(requestOptions map[string]interface{}) (interface{}, error) {

	options := hydrateInvokeModelOptions(requestOptions)
	// TODO: Validate the model against Bedrock's known valid models!!!
	body, err := getModelBody(options)
	if err != nil {
		return nil, err
	}

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimateTokens(int64(len(options.Input))), c.session)

	input := &bedrockruntime.InvokeModelWithResponseStreamInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("*/*"),
	}

	output, err := c.client.InvokeModelWithResponseStream(c.session.Context(), input)
	if err != nil {
		return nil, handleBedrockError(err)
	}
	reader := output.GetStream().Reader
	eventsChannel := reader.Events()
	outputStream := integ.NewStream()

	sigTerm := make(chan os.Signal, 1)
	signal.Notify(sigTerm, syscall.SIGINT, syscall.SIGTERM)

	go (func(ctx context.Context) {
		totalCharacters := int64(0)
		defer close(outputStream.Chunk())
		defer close(outputStream.Err())
		defer close(outputStream.Done())
		defer reader.Close()
	outer:
		for {
			select {
			case e := <-eventsChannel:
				switch event := e.(type) {
				case *brtypes.ResponseStreamMemberChunk:
					var modelOutput ModelOutput
					if err := json.Unmarshal(event.Value.Bytes, &modelOutput); err != nil {
						outputStream.Err() <- err
						break outer
					}
					totalCharacters = totalCharacters + int64(len(modelOutput.Completion))
					// If we have any stop reason, break, we're done
					if modelOutput.StopReason != "" {
						usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimateTokens(totalCharacters), c.session)
						outputStream.Done() <- totalCharacters
						break outer
					}
					outputStream.Chunk() <- []byte(modelOutput.Completion)
				}
			case <-ctx.Done():
				outputStream.Err() <- errors.New("request cancelled")
				break outer
			}
		}
		if reader != nil && reader.Err() != nil {
			outputStream.Err() <- reader.Err()
		}
	})(c.session.Context())

	return outputStream, nil

}

func (c *connection) invokeModel(requestOptions map[string]interface{}) (interface{}, error) {

	options := hydrateInvokeModelOptions(requestOptions)
	// TODO: Validate the model against Bedrock's known valid models!!!
	body, err := getModelBody(options)
	if err != nil {
		return nil, err
	}

	estimatedInputTokens := estimateTokens(int64(len(options.Input)))

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimatedInputTokens, c.session)

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

	var modelOutput ModelOutput

	if err = json.Unmarshal(output.Body, &modelOutput); err != nil {
		return nil, err
	}

	response := modelOutput.Completion

	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), estimateTokens(int64(len(response))), c.session)

	return []string{response}, nil
}

func handleBedrockError(err error) error {
	switch typedErr := err.(type) {
	case *smithy.OperationError:
		return handleBedrockError(typedErr.Unwrap())
	case *http.ResponseError:
		return handleBedrockError(typedErr.Unwrap())
	case *smithy.GenericAPIError:
		switch typedErr.ErrorCode() {
		case "ExpiredTokenException":
			return exceptions.NewUnauthorizedException(typedErr.ErrorMessage())
		}
	case *brtypes.ValidationException:
		return exceptions.NewBadRequestException(typedErr.ErrorMessage())
	}
	return exceptions.NewBadRequestException(err.Error())
}
