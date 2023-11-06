package openai

import (
	"context"
	"errors"
	"fmt"

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

type OpenAIIntegration struct {
}

func (i *OpenAIIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (adapt.IntegrationConnection, error) {
	token, err := credentials.GetRequiredEntry("apikey")
	if err != nil {
		return nil, err
	}

	client := oai.NewClient(token)

	return &Connection{
		session:     session,
		integration: integration,
		credentials: credentials,
		client:      client,
	}, nil
}

type Connection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *adapt.Credentials
	client      *oai.Client
}

func (c *Connection) GetCredentials() *adapt.Credentials {
	return c.credentials
}

func (c *Connection) GetIntegration() *meta.Integration {
	return c.integration
}

func (c *Connection) RunAction(actionName string, requestOptions interface{}) (interface{}, error) {

	switch actionName {
	case "autocomplete":
		return c.AutoComplete(requestOptions)
	}

	return nil, errors.New("Invalid Action Name for Open AI integration")

}

func (c *Connection) AutoComplete(requestOptions interface{}) (interface{}, error) {

	options := &AutoCompleteOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return nil, err
	}

	if options.Format == "chat" {
		return c.AutoCompleteChat(options)
	}

	return c.AutoCompleteDefault(options)

}

func (c *Connection) AutoCompleteDefault(options *AutoCompleteOptions) ([]string, error) {
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

func (c *Connection) AutoCompleteChat(options *AutoCompleteOptions) ([]string, error) {
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

	outputs := []string{}

	for _, choice := range resp.Choices {
		outputs = append(outputs, choice.Message.Content)
	}

	return outputs, nil
}
