package bedrock

import (
	"context"
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
	AmazonBedrockInvocationMetrics *struct {
		InputTokenCount   int `json:"inputTokenCount"`
		OutputTokenCount  int `json:"outputTokenCount"`
		InvocationLatency int `json:"invocationLatency"`
		FirstByteLatency  int `json:"firstByteLatency"`
	} `json:"amazon-bedrock-invocationMetrics"`
	Usage *MessagesModelUsage `json:"usage"`
}

func (c *connection) streamModel(requestOptions map[string]interface{}) (interface{}, error) {

	options, err := hydrateOptions(requestOptions)
	if err != nil {
		return nil, err
	}

	handler, ok := modelHandlers[options.Model]
	if !ok {
		return nil, errors.New("Model Not Supported: " + options.Model)
	}

	body, err := handler.GetBody(options)
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
					result, inputTokens, outputTokens, isDone, err := handler.HandleStreamChunk(event.Value.Bytes)
					if err != nil {
						outputStream.Err() <- err
						break outer
					}
					if result != nil {
						outputStream.Chunk() <- result
					}
					if inputTokens > 0 {
						usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), inputTokens, c.session)
					}
					if outputTokens > 0 {
						usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), outputTokens, c.session)
					}
					if isDone {
						outputStream.Done() <- 0
						break outer
					}
				}
			case <-ctx.Done():
				outputStream.Err() <- errors.New("request cancelled")
				break outer
			}
			if reader != nil && reader.Err() != nil {
				outputStream.Err() <- reader.Err()
			}
		}
	})(c.session.Context())

	return outputStream, nil

}
