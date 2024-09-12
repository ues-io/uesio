package bedrock

import (
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func (c *connection) invokeModel(requestOptions map[string]interface{}) (interface{}, error) {

	options, err := hydrateOptions(requestOptions)
	if err != nil {
		return nil, err
	}

	handler, ok := modelHandlers[options.Model]
	if !ok {
		return nil, errors.New("Model Not Supported: " + options.Model)
	}

	body, err := handler.GetBody(options)
	if err != nil {
		return nil, err
	}

	input := &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	}

	output, err := c.client.InvokeModel(c.session.Context(), input, handler.GetClientOptions)
	if err != nil {
		return nil, handleBedrockError(err)
	}

	result, inputTokens, outputTokens, err := handler.GetInvokeResult(output.Body)
	if err != nil {
		return nil, handleBedrockError(err)
	}

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), inputTokens, c.session)

	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), outputTokens, c.session)

	return result, nil
}
