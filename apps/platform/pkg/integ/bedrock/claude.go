package bedrock

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/bedrock"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ"
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
	err := datasource.HydrateOptions(params, &options)
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

func (cmh *ClaudeModelHandler) Invoke() (result any, err error) {
	cfg, err := creds.GetAWSConfig(cmh.ic.Context(), cmh.ic.GetCredentials())
	if err != nil {
		return nil, err
	}

	client := anthropic.NewClient(
		bedrock.WithConfig(cfg),
	)

	message, err := client.Messages.New(cmh.ic.Context(), cmh.options)
	if err != nil {
		return "", handleBedrockError(err)
	}

	resultMap := map[string]any{}

	err = json.Unmarshal([]byte(message.RawJSON()), &resultMap)
	if err != nil {
		return "", err
	}

	cmh.RecordUsage(message.Usage.InputTokens, message.Usage.OutputTokens)

	resultContent, ok := resultMap["content"]
	if !ok {
		return "", errors.New("no contents provided in result")
	}

	return resultContent, nil
}

func (cmh *ClaudeModelHandler) Stream() (*integ.Stream, error) {
	cfg, err := creds.GetAWSConfig(cmh.ic.Context(), cmh.ic.GetCredentials())
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

		stream := client.Messages.NewStreaming(cmh.ic.Context(), cmh.options)

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
