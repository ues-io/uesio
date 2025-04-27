package bedrock

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/usage"
)

func (c *Connection) invokeModel(requestOptions map[string]any) (any, error) {

	options, err := hydrateOptions(requestOptions)
	if err != nil {
		return nil, err
	}

	handler, ok := modelHandlers[options.Model]
	if !ok {
		return nil, fmt.Errorf("model not supported: %s", options.Model)
	}

	result, inputTokens, outputTokens, err := handler.Invoke(c, options)
	if err != nil {
		return nil, handleBedrockError(err)
	}

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), inputTokens, c.session)

	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), outputTokens, c.session)

	return result, nil
}
