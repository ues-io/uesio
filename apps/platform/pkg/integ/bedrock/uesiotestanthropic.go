package bedrock

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type UesioTestAnthropicModelHandler struct {
	options map[string]any
}

var uesioTestAnthropicModelHandler = &UesioTestAnthropicModelHandler{}

func (utamh *UesioTestAnthropicModelHandler) Hydrate(ic *wire.IntegrationConnection, params map[string]any) error {
	utamh.options = params
	return nil
}

func (utamh *UesioTestAnthropicModelHandler) Invoke() (result any, err error) {
	body, err := json.MarshalIndent(utamh.options, "", "  ")
	if err != nil {
		return nil, err
	}
	text := fmt.Sprintf("Uesio Test Model was invoked with the following options:\n\n%s\n", string(body))
	return []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(text)),
	}, nil
}

func (utamh *UesioTestAnthropicModelHandler) Stream() (stream *integ.Stream, err error) {
	return nil, errors.New("streaming is not supported for the uesio test anthropic handler")
}
