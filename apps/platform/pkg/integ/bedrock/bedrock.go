package bedrock

import (
	"errors"
	"net/http"
	"strings"

	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ"
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
	Temperature       float64            `json:"temperature,omitempty"`
	TopK              int                `json:"top_k,omitempty"`
	TopP              float64            `json:"top_p,omitempty"`
	Tools             []Tool             `json:"tools,omitempty"`
	ToolChoice        *ToolChoice        `json:"tool_choice,omitempty"`
	AspectRatio       string             `json:"aspect_ratio,omitempty"`
}

type ToolChoice struct {
	Type string `json:"type"`
	Name string `json:"name,omitempty"`
}

type Tool struct {
	Type        string       `json:"type,omitempty"`
	Name        string       `json:"name,omitempty"`
	Description string       `json:"description,omitempty"`
	InputSchema *InputSchema `json:"input_schema,omitempty"`
}

type InputSchema struct {
	Type        string                 `json:"type,omitempty"`
	Properties  map[string]InputSchema `json:"properties,omitempty"`
	Items       *InputSchema           `json:"items,omitempty"`
	Required    []string               `json:"required,omitempty"`
	Description string                 `json:"description,omitempty"`
}

func getBedrockConnection(ic *wire.IntegrationConnection) (*Connection, error) {

	cfg, err := creds.GetAWSConfig(ic.Context(), ic.GetCredentials())
	if err != nil {
		return nil, err
	}

	client := bedrockruntime.NewFromConfig(cfg)

	return &Connection{
		session:     ic.GetSession(),
		integration: ic.GetIntegration(),
		credentials: ic.GetCredentials(),
		client:      client,
	}, nil

}

type Connection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *wire.Credentials
	client      *bedrockruntime.Client
}

type ModelHandler interface {
	Invoke(c *Connection, options *InvokeModelOptions) (result any, inputTokens, outputTokens int64, err error)
	Stream(c *Connection, options *InvokeModelOptions) (stream *integ.Stream, err error)
}

const CLAUDE_3_HAIKU_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
const CLAUDE_3_SONNET_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"
const CLAUDE_3_5_SONNET_MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"
const CLAUDE_3_OPUS_MODEL_ID = "anthropic.claude-3-opus-20240229-v1:0"
const STABILITY_IMAGE_ULTRA_MODEL_ID = "stability.stable-image-ultra-v1:0"
const UESIO_TEST_MODEL_ID = "uesio.test-simple-responder"

var modelHandlers = map[string]ModelHandler{
	UESIO_TEST_MODEL_ID:            uesioTestModelHandler,
	CLAUDE_3_HAIKU_MODEL_ID:        claudeModelHandler,
	CLAUDE_3_SONNET_MODEL_ID:       claudeModelHandler,
	CLAUDE_3_5_SONNET_MODEL_ID:     claudeModelHandler,
	CLAUDE_3_OPUS_MODEL_ID:         claudeModelHandler,
	STABILITY_IMAGE_ULTRA_MODEL_ID: stabilityModelHandler,
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

	return options, nil
}

func handleBedrockError(err error) error {
	var validationErr *brtypes.ValidationException
	if errors.As(err, &validationErr) {
		return exceptions.NewBadRequestException(validationErr)
	}

	// the REST API docs and golang sdk docs differ on types of errors & http status
	// codes, some indicating things like "unauthorized" will return a 400 which
	// doesn't make sense.  There are a number of reasons/ways for what should be a
	// 401/403 and given the inconsistencies and limitations of the aws docs, there is no
	// way to be 100% certain what they all are. The prior code here would only check
	// for an error code of "ExpiredTokenException" but I do not even see that code
	// mentioned in any of the bedrock docs. For now, taking the conventional method
	// of checking for a 401/403
	var respErr *awshttp.ResponseError
	if errors.As(err, &respErr) && (respErr.HTTPStatusCode() == http.StatusUnauthorized || respErr.HTTPStatusCode() == http.StatusForbidden) {
		return exceptions.NewUnauthorizedException(respErr.Error())
	}

	return exceptions.NewBadRequestException(err)
}
