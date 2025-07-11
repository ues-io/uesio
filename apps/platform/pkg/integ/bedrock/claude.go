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
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type MessagesModelUsage struct {
	InputTokens  int64 `json:"input_tokens"`
	OutputTokens int64 `json:"output_tokens"`
}

type MessagesContent struct {
	Type  string         `json:"type" bot:"type,omitempty"`
	Text  string         `json:"text,omitempty" bot:"text,omitempty"`
	Name  string         `json:"name,omitempty" bot:"name,omitempty"`
	ID    string         `json:"id,omitempty" bot:"id,omitempty"`
	Input map[string]any `json:"input,omitempty" bot:"input,omitempty"`
}

type MessagesModelOutput struct {
	Content    []MessagesContent   `json:"content"`
	StopReason string              `json:"stop_reason"`
	Usage      *MessagesModelUsage `json:"usage"`
}

type AnthropicMessage struct {
	Role string `json:"role"`
	// Content could be a string or it could be an object
	// Using "any" for now. We could make a special type with a custom
	// unmarshaller, but I'm not sure if it's worth it for now.
	// {
	//   "type": "text",
	//   "text": "My text content."
	// },
	// {
	//     "type": "tool_use",
	//     "id": "my_tool_use_id",
	//     "name": "str_replace_editor",
	//     "input": {
	//         "command": "view",
	//         "path": "ben.yaml"
	//     }
	// }
	Content any `json:"content"`
}

type AnthropicMessagesInput struct {
	Messages         []AnthropicMessage `json:"messages"`
	AnthropicVersion string             `json:"anthropic_version"`
	AnthropicBeta    []string           `json:"anthropic_beta"`
	MaxTokens        int                `json:"max_tokens"`
	Temperature      float64            `json:"temperature,omitempty"`
	TopK             int                `json:"top_k,omitempty"`
	TopP             float64            `json:"top_p,omitempty"`
	StopSequences    []string           `json:"stop_sequences,omitempty"`
	System           string             `json:"system"`
	Tools            []Tool             `json:"tools,omitempty"`
	ToolChoice       *ToolChoice        `json:"tool_choice,omitempty"`
}

type ClaudeModelHandler struct {
}

var claudeModelHandler = &ClaudeModelHandler{}

func (cmh *ClaudeModelHandler) GetClientOptions(input *bedrockruntime.InvokeModelInput) func(o *bedrockruntime.Options) {
	return func(o *bedrockruntime.Options) {}
}

func (cmh *ClaudeModelHandler) GetBody(options *InvokeModelOptions) ([]byte, error) {
	messages := []AnthropicMessage{}

	if options.Messages != nil {
		messages = options.Messages
	}

	if options.Input != "" {
		messages = append(messages, AnthropicMessage{
			Role:    "user",
			Content: options.Input,
		})
	}

	anthropicBeta := []string{}

	return json.Marshal(AnthropicMessagesInput{
		Messages:         messages,
		AnthropicVersion: "bedrock-2023-05-31",
		AnthropicBeta:    anthropicBeta,
		MaxTokens:        options.MaxTokensToSample,
		Temperature:      options.Temperature,
		TopK:             options.TopK,
		TopP:             options.TopP,
		System:           options.System,
		Tools:            options.Tools,
		ToolChoice:       options.ToolChoice,
	})
}

func (cmh *ClaudeModelHandler) Invoke(connection *Connection, options *InvokeModelOptions) (result any, inputTokens, outputTokens int64, err error) {
	body, err := cmh.GetBody(options)
	if err != nil {
		return "", 0, 0, err
	}

	input := &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	}

	output, err := connection.client.InvokeModel(connection.session.Context(), input, cmh.GetClientOptions(input))
	if err != nil {
		return "", 0, 0, err
	}

	return cmh.GetInvokeResult(output.Body)
}

func (cmh *ClaudeModelHandler) Stream(connection *Connection, options *InvokeModelOptions) (stream *integ.Stream, err error) {
	body, err := cmh.GetBody(options)
	if err != nil {
		return nil, err
	}

	input := &bedrockruntime.InvokeModelWithResponseStreamInput{
		ModelId:     aws.String(options.Model),
		Body:        body,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("*/*"),
	}

	output, err := connection.client.InvokeModelWithResponseStream(connection.session.Context(), input)
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
					result, inputTokens, outputTokens, isDone, err := cmh.HandleStreamChunk(event.Value.Bytes)
					if err != nil {
						outputStream.Err() <- err
						break outer
					}
					if result != nil {
						outputStream.Chunk() <- result
					}
					if inputTokens > 0 {
						usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", connection.integration.GetKey(), inputTokens, connection.session)
					}
					if outputTokens > 0 {
						usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", connection.integration.GetKey(), outputTokens, connection.session)
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
				outputStream.Err() <- exceptions.NewBadRequestException("", reader.Err())
				break outer
			}
		}
	})(connection.session.Context())

	return outputStream, nil

}

func (cmh *ClaudeModelHandler) GetInvokeResult(body []byte) (result any, inputTokens, outputTokens int64, err error) {
	var modelOutput MessagesModelOutput
	if err := json.Unmarshal(body, &modelOutput); err != nil {
		return "", 0, 0, err
	}

	content := modelOutput.Content
	usage := modelOutput.Usage

	if len(content) < 1 {
		return "", 0, 0, errors.New("invalid response from bedrock")
	}

	if usage == nil {
		return "", 0, 0, errors.New("no usage information provided")
	}

	return content, usage.InputTokens, usage.OutputTokens, nil

}

func (cmh *ClaudeModelHandler) HandleStreamChunk(chunk []byte) (result []byte, inputTokens, outputTokens int64, isDone bool, err error) {

	var modelOutput MessagesModelStreamOutput
	if err := json.Unmarshal(chunk, &modelOutput); err != nil {
		return nil, 0, 0, false, err
	}

	if modelOutput.Type == "message_start" {
		if modelOutput.Message == nil || modelOutput.Message.Usage == nil {
			return nil, 0, 0, false, errors.New("could not get input token usage")
		}
		inputTokens += modelOutput.Message.Usage.InputTokens
	}

	// If we have any stop reason, break, we're done
	if modelOutput.Type == "message_stop" && modelOutput.AmazonBedrockInvocationMetrics != nil {

		if modelOutput.AmazonBedrockInvocationMetrics == nil {
			return nil, 0, 0, false, errors.New("could not get output token usage")
		}

		outputTokens += int64(modelOutput.AmazonBedrockInvocationMetrics.OutputTokenCount)
		isDone = true
	}

	// Add a newline to each chunk (this helps with client processing)
	chunkWithNewLine := append(chunk, []byte("\n")...)

	return chunkWithNewLine, inputTokens, outputTokens, isDone, nil
}
