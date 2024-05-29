package bedrock

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/aws/smithy-go"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type InvokeModelOptions struct {
	Input             string             `json:"input"`
	Messages          []AnthropicMessage `json:"messages"`
	System            string             `json:"system"`
	Model             string             `json:"model"`
	MaxTokensToSample int                `json:"max_tokens_to_sample"`
	Temperature       float64            `json:"temperature"`
	TopK              int                `json:"top_k"`
	TopP              float64            `json:"top_p"`
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

const MAX_TOKENS_TO_SAMPLE = 200000
const DEFAULT_TOKENS_TO_SAMPLE = 4096

func hydrateOptions(requestOptions map[string]interface{}) (*InvokeModelOptions, error) {

	options := &InvokeModelOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return nil, err
	}

	// Now set defaults
	if options.MaxTokensToSample == 0 {
		options.MaxTokensToSample = DEFAULT_TOKENS_TO_SAMPLE
		// Set a hard limit
		if options.MaxTokensToSample > MAX_TOKENS_TO_SAMPLE {
			options.MaxTokensToSample = MAX_TOKENS_TO_SAMPLE
		}
	}

	if options.Temperature == 0 {
		options.Temperature = 0.5
	}

	if options.Temperature < 0 {
		options.Temperature = 0
	}

	if options.Temperature > 1 {
		options.Temperature = 1
	}

	if options.TopP == 0 {
		options.TopP = 0.999
	}

	if options.TopK == 0 {
		options.TopK = 250
	}

	return options, nil
}

func getModelBody(options *InvokeModelOptions) ([]byte, error) {

	messages := []AnthropicMessage{}

	if options.Messages != nil {
		messages = options.Messages
	}

	if options.Input != "" {
		messages = append(messages, AnthropicMessage{
			Role:    "user",
			Content: options.Input,
		})
	}

	return json.Marshal(AnthropicMessagesInput{
		Messages:         messages,
		AnthropicVersion: "bedrock-2023-05-31",
		MaxTokens:        options.MaxTokensToSample,
		Temperature:      options.Temperature,
		TopK:             options.TopK,
		TopP:             options.TopP,
		System:           options.System,
	})

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
