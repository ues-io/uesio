package controller

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"net/http"
	"os"

	openai "github.com/sashabaranov/go-openai"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

var client *openai.Client

func init() {
	token := os.Getenv("OPENAI_API_KEY")
	if token != "" {
		client = openai.NewClient(token)
	}
}

type AutocompleteRequest struct {
	Input      string `json:"input"`
	Model      string `json:"model"`
	Format     string `json:"format"`
	MaxResults int    `json:"maxResults"`
}

func (r *AutocompleteRequest) ToString() string {
	return fmt.Sprintf("%s-%s-%s-%d", r.Input, r.Model, r.Format, r.MaxResults)
}

type AutocompleteResponse struct {
	Choices []string `json:"choices,omitempty"`
	Error   string   `json:"error,omitempty"`
}

func getCachedResponse(req *AutocompleteRequest) (*AutocompleteResponse, error) {
	var response AutocompleteResponse
	err := cache.Get(req.ToString(), &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func cacheResponse(req *AutocompleteRequest, response *AutocompleteResponse) error {
	return cache.Set(req.ToString(), response)
}

func AutocompleteHandler(w http.ResponseWriter, r *http.Request) {

	var req AutocompleteRequest

	// Try to decode the request body into the struct. If there is an error,
	// respond to the client with the error message and a 400 status code.
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if the user has the Use AI Signals feature flag
	session := middleware.GetSession(r)
	flags, err := featureflagstore.GetFeatureFlags(session, session.GetUserID())
	if err != nil {
		http.Error(w, "You do not have permission to use this feature", http.StatusForbidden)
		return
	}

	hasUseAiFlag := false

	err = flags.Loop(func(item meta.Item, index string) error {
		featureFlag := item.(*meta.FeatureFlag)
		if featureFlag.GetNamespace() == "uesio/studio" && featureFlag.Name == "use_ai_signals" && featureFlag.Value == true {
			hasUseAiFlag = true
		}
		return nil
	})
	if err != nil || hasUseAiFlag == false {
		http.Error(w, "You do not have permission to use this feature", http.StatusForbidden)
		return
	}

	// Check if we already have this response in cache
	autocompleteResponse, err := getCachedResponse(&req)
	if autocompleteResponse == nil || err != nil {
		// Invoke OpenAI
		autocompleteResponse = &AutocompleteResponse{}
		choices, err := Autocomplete(&req)
		if err != nil {
			autocompleteResponse.Error = err.Error()
		} else {
			autocompleteResponse.Choices = choices
			// Cache our response
			cacheResponse(&req, autocompleteResponse)
		}
	}

	file.RespondJSON(w, r, autocompleteResponse)
}

func Autocomplete(request *AutocompleteRequest) ([]string, error) {

	if client == nil {
		return nil, errors.New("api token not configured, autocomplete service unavailable")
	}

	// Constrain results and input size to limit the blast radius
	maxResults := request.MaxResults
	if maxResults < 1 || maxResults > 3 {
		maxResults = 1
	}
	// mas tokens = mas $$$$
	maxTokens := 200

	var outputs []string

	// Chat requests
	if request.Format == "chat" {
		resp, err := client.CreateChatCompletion(
			context.Background(),
			openai.ChatCompletionRequest{
				Model: request.Model,
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: request.Input,
					},
				},
				N:         request.MaxResults,
				MaxTokens: maxTokens,
			},
		)

		if err != nil {
			fmt.Printf("error performing chat completion: %v\n", err)
			return nil, err
		}
		for _, choice := range resp.Choices {
			outputs = append(outputs, choice.Message.Content)
		}
	} else {
		// Text requests
		resp, err := client.CreateCompletion(
			context.Background(),
			openai.CompletionRequest{
				Model:     request.Model,
				Prompt:    request.Input,
				MaxTokens: maxTokens,
				N:         request.MaxResults,
			},
		)

		if err != nil {
			fmt.Printf("error performing text completion: %v\n", err)
			return nil, err
		}
		for _, choice := range resp.Choices {
			outputs = append(outputs, choice.Text)
		}
	}
	return outputs, nil
}
