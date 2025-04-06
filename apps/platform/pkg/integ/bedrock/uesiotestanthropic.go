package bedrock

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/integ"
)

type UesioTestAnthropicModelHandler struct {
}

var uesioTestAnthropicModelHandler = &UesioTestAnthropicModelHandler{}

func (utamh *UesioTestAnthropicModelHandler) Invoke(connection *Connection, options *InvokeModelOptions) (result any, inputTokens, outputTokens int64, err error) {
	body, err := json.MarshalIndent(options, "", "  ")
	if err != nil {
		return "", 0, 0, err
	}
	content := []MessagesContent{
		{
			Type: "text",
			Text: fmt.Sprintf("Uesio Test Model was invoked with the following options:\n\n%s\n", string(body)),
		},
	}

	return content, 0, 0, nil
}

func (utamh *UesioTestAnthropicModelHandler) Stream(connection *Connection, options *InvokeModelOptions) (stream *integ.Stream, err error) {
	return nil, errors.New("streaming is not supported for the uesio test anthropic handler")
}
