package openai

import (
	"context"
	"errors"
	"fmt"
	"strings"

	oai "github.com/sashabaranov/go-openai"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type AutoCompleteOptions struct {
	Input  string `json:"input"`
	Model  string `json:"model"`
	Format string `json:"format"`
}

type connection struct {
	client      *oai.Client
	integration *meta.Integration
	session     *sess.Session
}

func newOpenAiConnection(ic *adapt.IntegrationConnection) (*connection, error) {
	apikey, err := ic.GetCredentials().GetRequiredEntry("apikey")
	if err != nil || apikey == "" {
		return nil, errors.New("OpenAI API Key not provided")
	}
	return &connection{
		client:      oai.NewClient(apikey),
		integration: ic.GetIntegration(),
		session:     ic.GetSession(),
	}, nil
}

// RunAction implements the system bot interface
func RunAction(bot *meta.Bot, action *meta.IntegrationAction, ic *adapt.IntegrationConnection, params map[string]interface{}) (interface{}, error) {

	c, err := newOpenAiConnection(ic)
	if err != nil {
		return nil, err
	}
	switch strings.ToLower(action.Name) {
	case "autocomplete":
		return c.autoComplete(params)
	}

	return nil, errors.New("invalid action name for Open AI integration")

}

func (c *connection) autoComplete(requestOptions interface{}) (interface{}, error) {

	options := &AutoCompleteOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return nil, err
	}

	if options.Format == "chat" {
		return c.autoCompleteChat(options)
	}

	return c.autoCompleteDefault(options)

}

func (c *connection) autoCompleteDefault(options *AutoCompleteOptions) ([]string, error) {
	// Text requests
	resp, err := c.client.CreateCompletion(
		context.Background(),
		oai.CompletionRequest{
			Model:     options.Model,
			Prompt:    options.Input,
			MaxTokens: 2000,
			N:         1,
		},
	)

	if err != nil {
		fmt.Printf("error performing text completion: %v\n", err)
		return nil, err
	}

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), int64(resp.Usage.PromptTokens), c.session)
	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), int64(resp.Usage.CompletionTokens), c.session)

	outputs := []string{}

	for _, choice := range resp.Choices {
		outputs = append(outputs, choice.Text)
	}

	return outputs, nil
}

func (c *connection) autoCompleteChat(options *AutoCompleteOptions) ([]string, error) {
	resp, err := c.client.CreateChatCompletion(
		context.Background(),
		oai.ChatCompletionRequest{
			Model: options.Model,
			Messages: []oai.ChatCompletionMessage{
				{
					Role:    oai.ChatMessageRoleUser,
					Content: options.Input,
				},
			},
			N:         1,
			MaxTokens: 2000,
		},
	)

	if err != nil {
		fmt.Printf("error performing chat completion: %v\n", err)
		return nil, err
	}

	usage.RegisterEvent("INPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), int64(resp.Usage.PromptTokens), c.session)
	usage.RegisterEvent("OUTPUT_TOKENS", "INTEGRATION", c.integration.GetKey(), int64(resp.Usage.CompletionTokens), c.session)

	var outputs []string

	for _, choice := range resp.Choices {
		outputs = append(outputs, choice.Message.Content)
	}

	return outputs, nil
}
