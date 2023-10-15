package oauth2

import (
	"encoding/base64"
	"encoding/json"

	"github.com/google/uuid"
)

type State struct {
	// random characters
	Nonce string `json:"n"`
	// integration name
	IntegrationName string `json:"i"`
}

func NewState(integrationName string) *State {
	return &State{
		uuid.New().String(),
		integrationName,
	}
}

func UnmarshalState(state string) (*State, error) {
	var s *State
	b, err := base64.StdEncoding.DecodeString(state)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(b, s)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (s *State) Marshal() (string, error) {
	b, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(b), nil
}
