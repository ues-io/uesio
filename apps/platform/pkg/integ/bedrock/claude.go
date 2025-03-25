package bedrock

import (
	"encoding/json"
	"errors"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
)

type MessagesModelUsage struct {
	InputTokens  int64 `json:"input_tokens"`
	OutputTokens int64 `json:"output_tokens"`
}

type MessagesContent struct {
	Type  string         `json:"type" bot:"type,omitempty"`
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

	// Force claude 3.5 v2 to use the us west model
	if *input.ModelId == "anthropic.claude-3-5-sonnet-20241022-v2:0" {
		return func(o *bedrockruntime.Options) {
			o.Region = "us-west-2"
		}
	}

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
	// Add the antropic beta flag
	if options.Model == "anthropic.claude-3-5-sonnet-20241022-v2:0" {
		anthropicBeta = []string{"computer-use-2024-10-22"}
	}

	/*
				GoError: Malformed input request: #: subject must not be valid against schema
				{"required":["messages"]}#/anthropic_beta: expected type: JSONArray, found: Null#/tools/0: extraneous key [input_schema] is not permitted#/tools/0: extraneous key [description] is not permitted#/tools/0/name: #/tools/0/name: create_website is not a valid enum value#/tools/0/type: is not a valid enum value#/tools/0/type: #/tools/0: required key [display_height_px] not found#/tools/0: required key [display_width_px] not found#/tools/0: extraneous key [input_schema] is not permitted#/tools/0: extraneous key [description] is not permitted#/tools/0/name: #/tools/0/name: create_website is not a valid enum value#/tools/0/type: #/tools/0/type: is not a valid enum value#/tools/0: extraneous key [input_schema] is not permitted#/tools/0: extraneous key [description] is not permitted#/tools/0/name: create_website is not a valid enum value#/tools/0/name: #/tools/0/type: #/tools/0/type: is not a valid enum value#/tools/0/type: expected: null, found: String#/tools/0/type: #/tools/0/type: is not a valid enum value, please reformat your input and try again. at reflect.methodValueCall (native)
		    GoError: Malformed input request: #: subject must not be valid against schema {"required":["messages"]}#/tools/0: extraneous key [input_schema] is not permitted#/tools/0: extraneous key [description] is not permitted#/tools/0/name: #/tools/0/name: create_website is not a valid enum value#/tools/0/type: is not a valid enum value#/tools/0/type: #/tools/0: required key [display_height_px] not found#/tools/0: required key [display_width_px] not found#/tools/0: extraneous key [input_schema] is not permitted#/tools/0: extraneous key [description] is not permitted#/tools/0/name: #/tools/0/name: create_website is not a valid enum value#/tools/0/type: #/tools/0/type: is not a valid enum value#/tools/0: extraneous key [input_schema] is not permitted#/tools/0: extraneous key [description] is not permitted#/tools/0/name: #/tools/0/name: create_website is not a valid enum value#/tools/0/type: #/tools/0/type: is not a valid enum value#/tools/0/type: expected: null, found: String#/tools/0/type: #/tools/0/type: is not a valid enum value, please reformat your input and try again. at reflect.methodValueCall (native)
	*/

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
