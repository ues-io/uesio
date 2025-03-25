package bedrock

import (
	"encoding/json"
	"errors"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
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

func (smh *StabilityModelHandler) GetInvokeResult(body []byte) (result any, inputTokens, outputTokens int64, err error) {

	var response StabilityResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", 0, 0, err
	}

	return response.Images[0], 0, 0, nil

}

func (mh *StabilityModelHandler) HandleStreamChunk(chunk []byte) (result []byte, inputTokens, outputTokens int64, isDone bool, err error) {

	return nil, 0, 0, true, errors.New("Streaming not supported")
}
