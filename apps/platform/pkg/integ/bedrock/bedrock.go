package bedrock

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"

	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type Connection struct {
	integration *wire.IntegrationConnection
}

type ModelHandler interface {
	Hydrate(ic *wire.IntegrationConnection, options map[string]any) error
	Invoke() (result any, err error)
	Stream() (stream *integ.Stream, err error)
}

// Deprecated Model IDs
const CLAUDE_3_HAIKU_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
const CLAUDE_3_SONNET_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"
const CLAUDE_3_5_SONNET_MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"
const CLAUDE_3_OPUS_MODEL_ID = "anthropic.claude-3-opus-20240229-v1:0"
const UESIO_TEST_SIMPLE_MODEL_DEPRECATED_ID = "uesio.test-simple-responder-deprecated"

// Supported Model IDs
const CLAUDE_3_5_HAIKU_MODEL_ID = "us.anthropic.claude-3-5-haiku-20241022-v1:0"
const CLAUDE_4_OPUS_MODEL_ID = "us.anthropic.claude-opus-4-20250514-v1:0"
const CLAUDE_4_SONNET_MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"
const STABILITY_IMAGE_ULTRA_MODEL_ID = "stability.stable-image-ultra-v1:0"
const UESIO_TEST_SIMPLE_MODEL_ID = "uesio.test-simple-responder"
const UESIO_TEST_ANTHROPIC_MODEL_ID = "uesio.test-anthropic-format"

const BEDROCK_DEFAULT_MODEL_ID = CLAUDE_3_5_HAIKU_MODEL_ID

var modelHandlers = map[string]ModelHandler{
	UESIO_TEST_ANTHROPIC_MODEL_ID:  uesioTestAnthropicModelHandler,
	UESIO_TEST_SIMPLE_MODEL_ID:     uesioTestModelHandler,
	CLAUDE_3_5_HAIKU_MODEL_ID:      claudeModelHandler,
	CLAUDE_4_OPUS_MODEL_ID:         claudeModelHandler,
	CLAUDE_4_SONNET_MODEL_ID:       claudeModelHandler,
	STABILITY_IMAGE_ULTRA_MODEL_ID: stabilityModelHandler,
}

// This maps old, deprecated models to new, supported ones.
// The key is the deprecated model and the value is the supported one.
var modelCompatibilityMap = map[string]string{
	CLAUDE_3_HAIKU_MODEL_ID:               CLAUDE_3_5_HAIKU_MODEL_ID,
	CLAUDE_3_SONNET_MODEL_ID:              CLAUDE_4_SONNET_MODEL_ID,
	CLAUDE_3_5_SONNET_MODEL_ID:            CLAUDE_4_SONNET_MODEL_ID,
	CLAUDE_3_OPUS_MODEL_ID:                CLAUDE_4_OPUS_MODEL_ID,
	UESIO_TEST_SIMPLE_MODEL_DEPRECATED_ID: UESIO_TEST_SIMPLE_MODEL_ID,
}

func getCompatibleModelId(modelID string) string {
	supportedModelID, hasMapping := modelCompatibilityMap[modelID]
	if hasMapping {
		return supportedModelID
	}
	return modelID
}

func getHandler(ic *wire.IntegrationConnection, params map[string]any) (ModelHandler, error) {
	modelID := param.GetOptionalString(params, "model", BEDROCK_DEFAULT_MODEL_ID)
	// If the model ID is in the compatibility map, upgrade it to a supported one.
	// Otherwise, just use the provide modelID.
	modelID = getCompatibleModelId(modelID)
	params["model"] = modelID
	handler, ok := modelHandlers[modelID]
	if !ok {
		return nil, fmt.Errorf("model not supported: %s", modelID)
	}
	return handler, handler.Hydrate(ic, params)
}

// RunAction implements the system bot interface
func RunAction(bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]any) (any, error) {

	handler, err := getHandler(ic, params)
	if err != nil {
		return nil, err
	}

	switch strings.ToLower(actionName) {
	case "invokemodel":
		return handler.Invoke()
	case "streammodel":
		return handler.Stream()
	}

	return nil, errors.New("invalid action name for Bedrock integration")

}

func handleBedrockError(err error) error {
	var validationErr *brtypes.ValidationException
	if errors.As(err, &validationErr) {
		return exceptions.NewBadRequestException("", validationErr)
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

	return exceptions.NewBadRequestException("", err)
}
