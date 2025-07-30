package openai

import (
	"context"
	"errors"
	"fmt"
	"strings"

	oai "github.com/sashabaranov/go-openai"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
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

func newOpenAiConnection(ic *wire.IntegrationConnection) (*connection, error) {
	apikey, err := ic.GetCredentials().GetRequiredEntry("apikey")
	if err != nil || apikey == "" {
		return nil, errors.New("openai api key not provided")
	}
	return &connection{
		client:      oai.NewClient(apikey),
		integration: ic.GetIntegration(),
		session:     ic.GetSession(),
	}, nil
}

// RunAction implements the system bot interface
func RunAction(ctx context.Context, bot *meta.Bot, ic *wire.IntegrationConnection, actionName string, params map[string]any) (any, error) {

	c, err := newOpenAiConnection(ic)
	if err != nil {
		return nil, err
	}
	switch strings.ToLower(actionName) {
	case "autocomplete":
		return c.autoComplete(ctx, params)
	}

	return nil, errors.New("invalid action name for openai integration")

}

func (c *connection) autoComplete(ctx context.Context, requestOptions any) (any, error) {

	options := &AutoCompleteOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return nil, err
	}

	if options.Format == "chat" {
		return c.autoCompleteChat(ctx, options)
	}

	return c.autoCompleteDefault(ctx, options)

}

func (c *connection) autoCompleteDefault(ctx context.Context, options *AutoCompleteOptions) ([]string, error) {
	// Text requests
	resp, err := c.client.CreateCompletion(
		ctx,
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

func (c *connection) autoCompleteChat(ctx context.Context, options *AutoCompleteOptions) ([]string, error) {
	resp, err := c.client.CreateChatCompletion(
		ctx,
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
