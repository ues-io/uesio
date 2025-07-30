package bedrock

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/bedrock"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

var BEDROCK_METRICS_KEY = "amazon-bedrock-invocationMetrics"

func NewBedrockInvocationMetrics(event *anthropic.MessageStopEvent) (*BedrockInvocationMetrics, error) {
	metricsData, ok := event.JSON.ExtraFields[BEDROCK_METRICS_KEY]
	if !ok {
		return nil, errors.New("no bedrock metrics provided")
	}
	fmt.Println(metricsData.Raw())
	metrics := &BedrockInvocationMetrics{}
	err := json.Unmarshal([]byte(metricsData.Raw()), metrics)
	if err != nil {
		return nil, err
	}
	return metrics, nil
}

type BedrockInvocationMetrics struct {
	InputTokens       int64 `json:"inputTokenCount"`
	OutputTokens      int64 `json:"outputTokenCount"`
	InvocationLatency int64 `json:"invocationLatency"`
	FirstByteLatency  int64 `json:"firstByteLatency"`
}

type ClaudeModelHandler struct {
	ic      *wire.IntegrationConnection
	options anthropic.MessageNewParams
}

var claudeModelHandler = &ClaudeModelHandler{}

func (cmh *ClaudeModelHandler) Hydrate(ic *wire.IntegrationConnection, params map[string]any) error {
	cmh.ic = ic
	options := anthropic.MessageNewParams{}

	// NOTE: Special case for system parameter sent as string
	// The anthropic sdk will not unmarshal strings correctly into
	// the "System" option. So we have to manually check for a system
	// parameter that is a string and set its value.
	systemPrompt, err := param.GetRequiredString(params, "system")
	// If no err was returned, that means we successfully parsed the
	// system parameter as a string.
	if err == nil {
		options.System = []anthropic.TextBlockParam{
			{Text: systemPrompt},
		}
		delete(params, "system")
	}

	// NOTE: Special case for input parameter
	// To ensure backwards compatibility and to handle simple cases,
	// we accept an input parameter as the input from the user.
	// If we find the input parameter, we convert it to the correct
	// messages API format.
	input, err := param.GetRequiredString(params, "input")
	// If no error was returned, that means we successfully parsed the
	// input parameter as a string.
	if err == nil {
		options.Messages = []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(input)),
		}
		delete(params, "input")
	}
	err = datasource.HydrateOptions(params, &options)
	if err != nil {
		return err
	}
	options.MaxTokens = 4096
	cmh.options = options
	return nil
}

func (cmh *ClaudeModelHandler) RecordUsage(inputTokens, outputTokens int64) {
	integrationKey := cmh.ic.GetIntegration().GetKey()
	session := cmh.ic.GetSession()
	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", integrationKey, inputTokens, session)
	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", integrationKey, outputTokens, session)
}

func (cmh *ClaudeModelHandler) Invoke(ctx context.Context) (result any, err error) {
	cfg, err := creds.GetAWSConfig(ctx, cmh.ic.GetCredentials())
	if err != nil {
		return nil, err
	}

	client := anthropic.NewClient(
		bedrock.WithConfig(cfg),
	)

	message, err := client.Messages.New(ctx, cmh.options)
	if err != nil {
		return nil, handleBedrockError(err)
	}

	cmh.RecordUsage(message.Usage.InputTokens, message.Usage.OutputTokens)

	return cmh.GetInvokeResult(message)

}

func (cmh *ClaudeModelHandler) Stream(ctx context.Context) (*integ.Stream, error) {
	cfg, err := creds.GetAWSConfig(ctx, cmh.ic.GetCredentials())
	if err != nil {
		return nil, err
	}

	client := anthropic.NewClient(
		bedrock.WithConfig(cfg),
	)

	outputStream := integ.NewStream()

	go (func() {
		defer close(outputStream.Chunk())
		defer close(outputStream.Err())
		defer close(outputStream.Done())

		stream := client.Messages.NewStreaming(ctx, cmh.options)

		for stream.Next() {
			event := stream.Current()
			outputStream.Chunk() <- []byte(event.RawJSON() + "\n")
			switch eventVariant := event.AsAny().(type) {
			case anthropic.MessageStopEvent:
				metrics, err := NewBedrockInvocationMetrics(&eventVariant)
				if err != nil {
					outputStream.Err() <- err
					return
				}
				cmh.RecordUsage(metrics.InputTokens, metrics.OutputTokens)
			}
		}
		err := stream.Err()
		if err != nil {
			if err != io.EOF {
				outputStream.Err() <- handleBedrockError(err)
				return
			}
		}
		outputStream.Done() <- 0
	})()

	return outputStream, nil

}

func (cmh *ClaudeModelHandler) GetInvokeResult(message *anthropic.Message) (result any, err error) {
	resultMap := map[string]any{}

	err = json.Unmarshal([]byte(message.RawJSON()), &resultMap)
	if err != nil {
		return nil, err
	}

	resultContent, ok := resultMap["content"]
	if !ok {
		return nil, errors.New("no contents provided in result")
	}

	return resultContent, nil
}
