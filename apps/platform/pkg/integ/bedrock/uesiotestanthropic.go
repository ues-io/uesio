package bedrock

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type UesioTestAnthropicModelHandler struct {
	cmh *ClaudeModelHandler
}

var uesioTestAnthropicModelHandler = &UesioTestAnthropicModelHandler{}

func (utamh *UesioTestAnthropicModelHandler) Hydrate(ic *wire.IntegrationConnection, params map[string]any) error {
	cmh := &ClaudeModelHandler{}
	utamh.cmh = cmh
	return cmh.Hydrate(ic, params)
}

func (utamh *UesioTestAnthropicModelHandler) Invoke(ctx context.Context) (any, error) {
	body, err := json.MarshalIndent(utamh.cmh.options, "", "  ")
	if err != nil {
		return nil, err
	}
	text := fmt.Sprintf("Uesio Test Model was invoked with the following options:\n\n%s\n", string(body))
	result := &anthropic.MessageParam{
		Content: []anthropic.ContentBlockParamUnion{
			anthropic.NewTextBlock(text),
		},
	}
	message := &anthropic.Message{}
	err = datasource.HydrateOptions(result, message)
	if err != nil {
		return nil, err
	}
	return utamh.cmh.GetInvokeResult(message)

}

func (utamh *UesioTestAnthropicModelHandler) Stream(ctx context.Context) (stream *integ.Stream, err error) {
	return nil, errors.New("streaming is not supported for the uesio test anthropic handler")
}
