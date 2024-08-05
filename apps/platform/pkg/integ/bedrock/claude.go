package bedrock

import (
	"encoding/json"
	"errors"
)

type MessagesModelUsage struct {
	InputTokens  int64 `json:"input_tokens"`
	OutputTokens int64 `json:"output_tokens"`
}

type MessagesContent struct {
	Type  string         `json:"type" bot:"type"`
	Text  string         `json:"text,omitempty" bot:"text,omitempty"`
	Name  string         `json:"name,omitempty" bot:"name,omitempty"`
	Input map[string]any `json:"input,omitempty" bot:"input,omitempty"`
}

type MessagesModelOutput struct {
	Content    []MessagesContent   `json:"content"`
	StopReason string              `json:"stop_reason"`
	Usage      *MessagesModelUsage `json:"usage"`
}

type AnthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AnthropicMessagesInput struct {
	Messages         []AnthropicMessage `json:"messages"`
	AnthropicVersion string             `json:"anthropic_version"`
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

	return json.Marshal(AnthropicMessagesInput{
		Messages:         messages,
		AnthropicVersion: "bedrock-2023-05-31",
		MaxTokens:        options.MaxTokensToSample,
		Temperature:      options.Temperature,
		TopK:             options.TopK,
		TopP:             options.TopP,
		System:           options.System,
		Tools:            options.Tools,
		ToolChoice:       options.ToolChoice,
	})
}

func (cmh *ClaudeModelHandler) GetInvokeResult(body []byte) (result any, inputTokens, outputTokens int64, err error) {
	var modelOutput MessagesModelOutput
	if err := json.Unmarshal(body, &modelOutput); err != nil {
		return "", 0, 0, err
	}

	content := modelOutput.Content
	usage := modelOutput.Usage

	if content == nil || len(content) < 1 {
		return "", 0, 0, errors.New("Invalid Response from Bedrock")
	}

	if usage == nil {
		return "", 0, 0, errors.New("No usage information provided")
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
			return nil, 0, 0, false, errors.New("Could not get input token usage")
		}
		inputTokens += modelOutput.Message.Usage.InputTokens
	}

	// If we have any stop reason, break, we're done
	if modelOutput.Type == "message_stop" && modelOutput.AmazonBedrockInvocationMetrics != nil {

		if modelOutput.AmazonBedrockInvocationMetrics == nil {
			return nil, 0, 0, false, errors.New("Could not get output token usage")
		}

		outputTokens += int64(modelOutput.AmazonBedrockInvocationMetrics.OutputTokenCount)
		isDone = true
	}

	// Add a newline to each chunk (this helps with client processing)
	chunkWithNewLine := append(chunk, []byte("\n")...)

	return chunkWithNewLine, inputTokens, outputTokens, isDone, nil
}
