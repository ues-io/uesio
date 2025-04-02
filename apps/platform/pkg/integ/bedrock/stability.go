package bedrock

import (
	"encoding/json"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/thecloudmasters/uesio/pkg/integ"
)

type StabilityRequest struct {
	Prompt      string `json:"prompt"`
	AspectRatio string `json:"aspect_ratio"`
}

type StabilityResponse struct {
	Images        []string `json:"images"`
	FinishReasons []string `json:"finishReasons"`
	Seed          []int64  `json:"seeds"`
}

type StabilityModelHandler struct {
}

var stabilityModelHandler = &StabilityModelHandler{}

func (smh *StabilityModelHandler) GetClientOptions(input *bedrockruntime.InvokeModelInput) func(o *bedrockruntime.Options) {
	return func(o *bedrockruntime.Options) {
		// TODO: The stability models are currently only supported on us-west-2
		// see: https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html
		// If there becomes broader support for this model on other regions, we can remove this.
		o.Region = "us-west-2"
	}
}

func (smh *StabilityModelHandler) GetBody(options *InvokeModelOptions) ([]byte, error) {
	return json.Marshal(StabilityRequest{
		Prompt:      options.Input,
		AspectRatio: options.AspectRatio,
	})
}

func (smh *StabilityModelHandler) Invoke(connection *Connection, options *InvokeModelOptions) (result any, inputTokens, outputTokens int64, err error) {
	body, err := smh.GetBody(options)
	if err != nil {
		return "", 0, 0, err
	}

	input := &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	}

	output, err := connection.client.InvokeModel(connection.session.Context(), input, smh.GetClientOptions(input))
	if err != nil {
		return "", 0, 0, err
	}

	return smh.GetInvokeResult(output.Body)

}

func (utmh *StabilityModelHandler) Stream(connection *Connection, options *InvokeModelOptions) (stream *integ.Stream, err error) {
	return nil, errors.New("streaming is not supported for the stability model handler")
}

func (smh *StabilityModelHandler) GetInvokeResult(body []byte) (result any, inputTokens, outputTokens int64, err error) {

	var response StabilityResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", 0, 0, err
	}

	return response.Images[0], 0, 0, nil

}
