package systemdialect

import (
	"bytes"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ/bedrock"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runAgentListenerBot(params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	agentKey, err := param.GetRequiredString(params, "agent")
	if err != nil {
		return nil, err
	}

	threadID, err := param.GetRequiredString(params, "thread")
	if err != nil {
		return nil, err
	}

	userInput, err := param.GetRequiredString(params, "input")
	if err != nil {
		return nil, err
	}

	modelID := param.GetOptionalString(params, "model", bedrock.CLAUDE_3_5_SONNET_MODEL_ID)

	hiddenInputPrefix := param.GetOptionalString(params, "hiddenInputPrefix", "")

	fullInput := userInput
	if hiddenInputPrefix != "" {
		fullInput = hiddenInputPrefix + userInput
	}

	// Load in the agent metadata
	agent, err := meta.NewAgent(agentKey)
	if err != nil {
		return nil, exceptions.NewBadRequestException("", err)
	}

	err = bundle.Load(agent, nil, session.RemoveVersionContext(), connection)
	if err != nil {
		if exceptions.IsType[*exceptions.NotFoundException](err) {
			return nil, exceptions.NewBadRequestException("", err)
		}
		return nil, err
	}

	buf := &bytes.Buffer{}
	_, err = bundle.GetItemAttachment(buf, agent, "prompt.txt", session.RemoveVersionContext(), connection)
	if err != nil {
		return nil, err
	}

	systemPrompt := buf.String()
	agentTools := []map[string]string{}

	for _, tool := range agent.Tools {
		agentTools = append(agentTools, map[string]string{
			"type": tool.Type,
			"name": tool.Name,
		})
	}

	messages, err := loadPreviousMessages(threadID, connection, session)
	if err != nil {
		return nil, err
	}

	// Now add the user message
	messages = append(messages, bedrock.AnthropicMessage{
		Role:    "user",
		Content: fullInput,
	})

	ic, err := datasource.GetIntegrationConnection("uesio/aikit.bedrock", session, connection)
	if err != nil {
		return nil, err
	}
	result, err := datasource.RunIntegrationAction(ic, "invokemodel", map[string]any{
		"model":    modelID,
		"messages": messages,
		"system":   systemPrompt,
		"tools":    agentTools,
	}, connection)
	if err != nil {
		return nil, err
	}

	resultMessages, ok := result.([]bedrock.MessagesContent)
	if !ok {
		return nil, exceptions.NewBadRequestException("invalid message format for agent", nil)
	}

	err = saveNewMessages(userInput, resultMessages, threadID, connection, session)
	if err != nil {
		return nil, exceptions.NewBadRequestException("", err)
	}

	return map[string]any{"results": resultMessages}, nil
}

func threadItemToMessage(threadItem *wire.Item) (*bedrock.AnthropicMessage, error) {
	itemType, err := threadItem.GetFieldAsString("uesio/aikit.type")
	if err != nil {
		return nil, err
	}
	author, err := threadItem.GetFieldAsString("uesio/aikit.author")
	if err != nil {
		return nil, err
	}
	content, _ := threadItem.GetFieldAsString("uesio/aikit.content")
	toolUseID, _ := threadItem.GetFieldAsString("uesio/aikit.tool_use_id")
	toolName, _ := threadItem.GetFieldAsString("uesio/aikit.tool_name")
	toolInput, _ := threadItem.GetField("uesio/aikit.tool_input")

	if itemType == "text" || itemType == "" {
		role := "assistant"
		if author == "USER" {
			role = "user"
		}
		return &bedrock.AnthropicMessage{
			Role:    role,
			Content: content,
		}, nil
	}

	if itemType == "tool_use" {
		return &bedrock.AnthropicMessage{
			Role: "assistant",
			Content: []map[string]any{
				{
					"type":  itemType,
					"id":    toolUseID,
					"name":  toolName,
					"input": toolInput,
				},
			},
		}, nil
	}

	if itemType == "tool_result" {
		return &bedrock.AnthropicMessage{
			Role: "user",
			Content: []map[string]any{
				{
					"type":        itemType,
					"tool_use_id": toolUseID,
					"content":     content,
				},
			},
		}, nil
	}

	return nil, errors.New("Thread item type not supported: " + itemType)

}

// Converts a collection of threadItems to the anthropic message format.
func threadItemsToMessages(threadItems *wire.Collection) ([]bedrock.AnthropicMessage, error) {
	messages := []bedrock.AnthropicMessage{}

	for _, threadItem := range *threadItems {
		message, err := threadItemToMessage(threadItem)
		if err != nil {
			return nil, err
		}
		messages = append(messages, *message)
	}

	return messages, nil
}

// Loads the previous messages in the thread
func loadPreviousMessages(threadID string, connection wire.Connection, session *sess.Session) ([]bedrock.AnthropicMessage, error) {
	threadItems := &wire.Collection{}
	err := datasource.LoadWithError(&wire.LoadOp{
		CollectionName: "uesio/aikit.thread_item",
		Collection:     threadItems,
		Query:          true,
		Fields: []wire.LoadRequestField{
			{
				ID: "uesio/aikit.content",
			},
			{
				ID: "uesio/aikit.type",
			},
			{
				ID: "uesio/aikit.author",
			},
			{
				ID: "uesio/aikit.tool_use_id",
			},
			{
				ID: "uesio/aikit.tool_name",
			},
			{
				ID: "uesio/aikit.tool_input",
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field: "uesio/aikit.thread",
				Value: threadID,
			},
		},
	}, session, &datasource.LoadOptions{
		Connection: connection,
	})
	if err != nil {
		return nil, err
	}

	return threadItemsToMessages(threadItems)
}

func saveNewMessages(input string, messages []bedrock.MessagesContent, threadID string, connection wire.Connection, session *sess.Session) error {
	threadItems := wire.Collection{
		{
			"uesio/aikit.content": input,
			"uesio/aikit.author":  "USER",
			"uesio/aikit.type":    "text",
			"uesio/aikit.thread": &wire.Item{
				"uesio/core.id": threadID,
			},
		},
	}

	for _, message := range messages {
		if message.Type == "text" {
			threadItems = append(threadItems, &wire.Item{
				"uesio/aikit.content": message.Text,
				"uesio/aikit.author":  "ASSISTANT",
				"uesio/aikit.type":    message.Type,
				"uesio/aikit.thread": &wire.Item{
					"uesio/core.id": threadID,
				},
			})
		}
		if message.Type == "tool_use" {
			threadItems = append(threadItems, &wire.Item{
				"uesio/aikit.content":     "",
				"uesio/aikit.author":      "ASSISTANT",
				"uesio/aikit.type":        message.Type,
				"uesio/aikit.tool_use_id": message.ID,
				"uesio/aikit.tool_input":  message.Input,
				"uesio/aikit.tool_name":   message.Name,
				"uesio/aikit.thread": &wire.Item{
					"uesio/core.id": threadID,
				},
			})

		}
	}

	return datasource.SaveWithOptions([]datasource.SaveRequest{
		{
			Collection: "uesio/aikit.thread_item",
			Wire:       "AgentThreadItems",
			Changes:    &threadItems,
		},
	}, session, datasource.NewSaveOptions(connection, nil))

}
