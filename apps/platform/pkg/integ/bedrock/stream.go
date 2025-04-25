package bedrock

import (
	"errors"
)

type MessagesModelStreamOutput struct {
	Type  string `json:"type"`
	Delta *struct {
		StopReason   string `json:"stop_reason"`
		StopSequence string `json:"stop_sequence"`
		MessagesContent
	} `json:"delta"`
	ContentBlock *struct {
		MessagesContent
	} `json:"content_block"`
	Message *struct {
		Usage *MessagesModelUsage `json:"usage"`
	} `json:"message"`
	AmazonBedrockInvocationMetrics *struct {
		InputTokenCount   int `json:"inputTokenCount"`
		OutputTokenCount  int `json:"outputTokenCount"`
		InvocationLatency int `json:"invocationLatency"`
		FirstByteLatency  int `json:"firstByteLatency"`
	} `json:"amazon-bedrock-invocationMetrics"`
	Usage *MessagesModelUsage `json:"usage"`
}

func (c *Connection) streamModel(requestOptions map[string]any) (any, error) {

	options, err := hydrateOptions(requestOptions)
	if err != nil {
		return nil, err
	}

	handler, ok := modelHandlers[options.Model]
	if !ok {
		return nil, errors.New("Model Not Supported: " + options.Model)
	}

	return handler.Stream(c, options)
}
