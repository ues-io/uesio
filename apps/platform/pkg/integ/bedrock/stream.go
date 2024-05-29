package bedrock

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/signal"
	"syscall"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/usage"
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
	Usage *MessagesModelUsage `json:"usage"`
}

func (c *connection) streamModel(requestOptions map[string]interface{}) (interface{}, error) {

	options, err := hydrateOptions(requestOptions)
	if err != nil {
		return nil, err
	}
	// TODO: Validate the model against Bedrock's known valid models!!!
	body, err := getModelBody(options)
	if err != nil {
		return nil, err
	}

	input := &bedrockruntime.InvokeModelWithResponseStreamInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("*/*"),
	}

	output, err := c.client.InvokeModelWithResponseStream(c.session.Context(), input)
	if err != nil {
		return nil, handleBedrockError(err)
	}
	reader := output.GetStream().Reader
	eventsChannel := reader.Events()
	outputStream := integ.NewStream()

	sigTerm := make(chan os.Signal, 1)
	signal.Notify(sigTerm, syscall.SIGINT, syscall.SIGTERM)

	go (func(ctx context.Context) {
		totalCharacters := int64(0)
		defer close(outputStream.Chunk())
		defer close(outputStream.Err())
		defer close(outputStream.Done())
		defer reader.Close()
	outer:
		for {
			select {
			case e := <-eventsChannel:
				switch event := e.(type) {
				case *brtypes.ResponseStreamMemberChunk:
					var modelOutput MessagesModelStreamOutput
					if err := json.Unmarshal(event.Value.Bytes, &modelOutput); err != nil {
						outputStream.Err() <- err
						break outer
					}

					if modelOutput.Type == "message_start" {
						if modelOutput.Message == nil || modelOutput.Message.Usage == nil {
							outputStream.Err() <- errors.New("Could not get input token usage")
							break outer
						}

						usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), modelOutput.Message.Usage.InputTokens, c.session)

					}
					if modelOutput.Type == "content_block_delta" {
						if modelOutput.Delta != nil {
							content := modelOutput.Delta.Text
							totalCharacters = totalCharacters + int64(len(content))
							outputStream.Chunk() <- []byte(content)
						}
					}

					// If we have any stop reason, break, we're done
					if modelOutput.Delta != nil && modelOutput.Delta.StopReason != "" {

						if modelOutput.Usage == nil {
							outputStream.Err() <- errors.New("Could not get output token usage")
							break outer
						}

						usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), modelOutput.Usage.OutputTokens, c.session)
						outputStream.Done() <- totalCharacters
						break outer
					}

				}
			case <-ctx.Done():
				outputStream.Err() <- errors.New("request cancelled")
				break outer
			}
		}
		if reader != nil && reader.Err() != nil {
			outputStream.Err() <- reader.Err()
		}
	})(c.session.Context())

	return outputStream, nil

}
