package bedrock

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type StabilityRequest struct {
	Prompt      string `json:"prompt"`
	AspectRatio string `json:"aspect_ratio"`
}

type StabilityOptions struct {
	Model       string `json:"model"`
	Prompt      string `json:"prompt"`
	AspectRatio string `json:"aspect_ratio"`
}

type StabilityResponse struct {
	Images        []string `json:"images"`
	FinishReasons []string `json:"finishReasons"`
	Seed          []int64  `json:"seeds"`
}

type StabilityModelHandler struct {
	ic      *wire.IntegrationConnection
	options StabilityOptions
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

func (smh *StabilityModelHandler) Hydrate(ic *wire.IntegrationConnection, params map[string]any) error {
	smh.ic = ic
	options := StabilityOptions{}
	err := datasource.HydrateOptions(params, &options)
	if err != nil {
		return err
	}
	smh.options = options
	return nil
}

func (smh *StabilityModelHandler) RecordUsage(ctx context.Context) {
	integrationKey := smh.ic.GetIntegration().GetKey()
	session := smh.ic.GetSession()
	usage.RegisterEvent(ctx, "IMAGE_GENERATION", "INTEGRATION", integrationKey, 0, session)
}

func (smh *StabilityModelHandler) Invoke(ctx context.Context) (result any, err error) {
	cfg, err := creds.GetAWSConfig(ctx, smh.ic.GetCredentials())
	if err != nil {
		return nil, err
	}

	client := bedrockruntime.NewFromConfig(cfg)
	body, err := json.Marshal(&StabilityRequest{
		Prompt:      smh.options.Prompt,
		AspectRatio: smh.options.AspectRatio,
	})
	if err != nil {
		return nil, err
	}

	input := &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(smh.options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	}

	output, err := client.InvokeModel(ctx, input, smh.GetClientOptions(input))
	if err != nil {
		return nil, err
	}

	smh.RecordUsage(ctx)

	return smh.GetInvokeResult(output.Body)

}

func (utmh *StabilityModelHandler) Stream(ctx context.Context) (stream *integ.Stream, err error) {
	return nil, errors.New("streaming is not supported for the stability model handler")
}

func (smh *StabilityModelHandler) GetInvokeResult(body []byte) (result any, err error) {

	var response StabilityResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", err
	}

	return response.Images[0], nil

}
