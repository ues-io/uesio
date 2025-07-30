package bedrock

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type UesioTestModelHandler struct {
	options map[string]any
}

var uesioTestModelHandler = &UesioTestModelHandler{}

func (utmh *UesioTestModelHandler) Hydrate(ic *wire.IntegrationConnection, params map[string]any) error {
	utmh.options = params
	return nil
}

func (utmh *UesioTestModelHandler) Invoke(ctx context.Context) (result any, err error) {
	body, err := json.MarshalIndent(utmh.options, "", "  ")
	if err != nil {
		return nil, err
	}
	content := fmt.Sprintf("Uesio Test Model was invoked with the following options:\n\n%s\n", string(body))
	return content, nil
}

func (utmh *UesioTestModelHandler) Stream(ctx context.Context) (stream *integ.Stream, err error) {
	return nil, errors.New("streaming is not supported for the uesio test handler")
}
