package bedrock

import (
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
	Tools             []Tool             `json:"tools,omitempty"`
	ToolChoice        *ToolChoice        `json:"tool_choice,omitempty"`
}

type ToolChoice struct {
	Type string `json:"type"`
	Name string `json:"name,omitempty"`
}

type Tool struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	InputSchema *InputSchema `json:"input_schema"`
}

type InputSchema struct {
	Type        string                 `json:"type,omitempty"`
	Properties  map[string]InputSchema `json:"properties,omitempty"`
	Items       *InputSchema           `json:"items,omitempty"`
	Required    []string               `json:"required,omitempty"`
	Description string                 `json:"description,omitempty"`
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

type ModelHandler interface {
	GetBody(options *InvokeModelOptions) ([]byte, error)
	GetInvokeResult(body []byte) (result any, inputTokens, outputTokens int64, err error)
	HandleStreamChunk(chunk []byte) (result []byte, inputTokens, outputTokens int64, isDone bool, err error)
}

var modelHandlers = map[string]ModelHandler{
	"anthropic.claude-3-haiku-20240307-v1:0":  claudeModelHandler,
	"anthropic.claude-3-sonnet-20240229-v1:0": claudeModelHandler,
	"anthropic.claude-3-opus-20240229-v1:0":   claudeModelHandler,
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
