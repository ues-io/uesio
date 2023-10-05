package controller

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
	"github.com/twmb/murmur3"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
)

var client *openai.Client

var sampleCollectionFieldsSuggestedResult = `[
  {
    "type": "SERIAL",
    "label": "ID"
  },
  {
    "type": "VARCHAR(50)",
    "label": "Name"
  },
  {
    "type": "INTEGER",
    "label": "Quantity"
  },
  {
    "type": "DECIMAL(10,2)",
    "label": "Price"
  },
  {
    "type": "DATE",
    "label": "Date Added"
  },
  {
    "type": "VARCHAR(50)",
    "label": "Supplier"
  },
  {
    "type": "VARCHAR(50)",
    "label": "Category"
  },
  {
    "type": "VARCHAR(50)",
    "label": "Location"
  },
  {
    "type": "BOOLEAN",
    "label": "Availability"
  },
  {
    "type": "TEXT",
    "label": "Description"
  }
]`

var responsesCache cache.Cache[*AutocompleteResponse]

func init() {
	token := os.Getenv("OPENAI_API_KEY")
	if token != "" {
		client = openai.NewClient(token)
	}

	responsesCache = cache.NewRedisCache[*AutocompleteResponse]("openai-request")
}

type AutocompleteRequest struct {
	Input      string `json:"input"`
	Model      string `json:"model"`
	Format     string `json:"format"`
	MaxResults int    `json:"maxResults"`
	UseCache   bool   `json:"useCache"`
}

func (r *AutocompleteRequest) hashCode() uint64 {
	hasher := murmur3.New64()
	_, err := hasher.Write([]byte(fmt.Sprintf("%s-%s-%s-%d", r.Input, r.Model, r.Format, r.MaxResults)))
	if err != nil {
		return 0
	}
	return hasher.Sum64()
}

func (r *AutocompleteRequest) GetRedisKey() string {
	return fmt.Sprintf("%d", r.hashCode())
}

type AutocompleteResponse struct {
	Choices []string `json:"choices,omitempty"`
	Error   string   `json:"error,omitempty"`
}

func getCachedResponse(req *AutocompleteRequest) (*AutocompleteResponse, error) {
	response, err := responsesCache.Get(req.GetRedisKey())
	if err != nil || response == nil {
		return nil, err
	}
	return response, nil
}

func cacheResponse(req *AutocompleteRequest, response *AutocompleteResponse) error {
	return responsesCache.Set(req.GetRedisKey(), response)
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

	var autocompleteResponse *AutocompleteResponse
	if req.UseCache {
		// Check if we already have this response in cache
		autocompleteResponse, err = getCachedResponse(&req)
	}
	if autocompleteResponse == nil || err != nil {
		// Invoke OpenAI
		autocompleteResponse = &AutocompleteResponse{}
		choices, err := Autocomplete(&req)
		if err != nil {
			autocompleteResponse.Error = err.Error()
		} else {
			autocompleteResponse.Choices = choices
			if req.UseCache {
				// Cache our response
				cacheResponse(&req, autocompleteResponse)
			}
		}
	}

	file.RespondJSON(w, r, autocompleteResponse)
}

func Autocomplete(request *AutocompleteRequest) ([]string, error) {

	if client == nil {
		// Hack to facilitate local development, where a dev might not have the API key
		if strings.HasPrefix(request.Input, "I am creating a new PostgreSQL database table") {
			// Return a canned response
			return []string{
				sampleCollectionFieldsSuggestedResult,
			}, nil
		}

		return nil, errors.New("api token not configured, autocomplete service unavailable")
	}

	// Constrain results and input size to limit the blast radius
	maxResults := request.MaxResults
	if maxResults < 1 || maxResults > 3 {
		maxResults = 1
	}
	// mas tokens = mas $$$$
	maxTokens := 2000

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
