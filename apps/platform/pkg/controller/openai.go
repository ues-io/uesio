package controller

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	openai "github.com/sashabaranov/go-openai"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"net/http"
	"os"
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

type AutocompleteResponse struct {
	Choices []string `json:"choices,omitempty"`
	Error   string   `json:"error,omitempty"`
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

	// Invoke OpenAI
	choices, err := Autocomplete(&req)

	// Static input for testing
	//choices := []string{
	//	`Here's an example of a JavaScript function that computes the nth Fibonacci number:function fibonacci(n) {  if (n === 0 || n === 1) {    return n;  } else {    return fibonacci(n - 1) + fibonacci(n - 2);  }}console.log(fibonacci(7)); // Output: 13This function takes a single argument, n, which represents the position of the desired Fibonacci number in the sequence. It uses recursion to compute the value of the nth Fibonacci number by summing the values of the two preceding numbers in the sequence. The base case of the recursion is when n is 0 or 1, in which case the function simply returns n.In the example above, the function is called with an argument of 7, which corresponds to the 8th Fibonacci number in the sequence (since the sequence starts at 0). The function returns the value 13, which is indeed the 8th Fibonacci number.`,
	//}

	autocompleteResponse := &AutocompleteResponse{}

	if err != nil {
		autocompleteResponse.Error = err.Error()
	} else {
		autocompleteResponse.Choices = choices
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
