package bedrock

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/integ"
)

type UesioTestModelHandler struct {
}

var uesioTestModelHandler = &UesioTestModelHandler{}

func (utmh *UesioTestModelHandler) Invoke(connection *Connection, options *InvokeModelOptions) (result any, inputTokens, outputTokens int64, err error) {
	body, err := json.MarshalIndent(options, "", "  ")
	if err != nil {
		return "", 0, 0, err
	}
	content := fmt.Sprintf("Uesio Test Model was invoked with the following options:\n\n%s\n", string(body))
	return content, 0, 0, nil
}

func (utmh *UesioTestModelHandler) Stream(connection *Connection, options *InvokeModelOptions) (stream *integ.Stream, err error) {
	return nil, errors.New("streaming is not supported for the uesio test handler")
}
