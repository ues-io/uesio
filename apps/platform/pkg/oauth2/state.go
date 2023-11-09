package oauth2

import (
	"encoding/base64"
	"encoding/json"

	"github.com/gofrs/uuid"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

const (
	siteAdmin = "s"
	workspace = "w"
)

type State struct {
	// random characters
	Nonce string `json:"n"`
	// integration name
	IntegrationName string `json:"i"`
	// context type - "w" for workspace, "s" for site admin
	ContextType string `json:"c,omitempty"`
	// App name
	AppName string `json:"a,omitempty"`
	// Workspace name
	WorkspaceName string `json:"w,omitempty"`
	// Site Name
	SiteName string `json:"s,omitempty"`
}

func NewState(integrationName string) *State {
	v7UUID, _ := uuid.NewV7()
	return &State{
		Nonce:           v7UUID.String(),
		IntegrationName: integrationName,
	}
}

func UnmarshalState(state string) (*State, error) {
	dst := make([]byte, base64.RawURLEncoding.DecodedLen(len(state)))
	_, err := base64.RawURLEncoding.Decode(dst, []byte(state))
	if err != nil {
		return nil, err
	}
	var s State
	if err = json.Unmarshal(dst, &s); err != nil {
		return nil, err
	}
	return &s, nil
}

func (s *State) Marshal() (string, error) {
	b, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func (s *State) WithContext(session *sess.Session) *State {
	ws := session.GetWorkspace()
	if ws != nil {
		appFullName, _ := ws.GetAppFullName()
		s.ContextType = workspace
		s.WorkspaceName = ws.Name
		s.AppName = appFullName
		return s
	}
	sa := session.GetSiteAdmin()
	if sa != nil {
		s.ContextType = siteAdmin
		s.SiteName = sa.Name
		s.AppName = sa.GetAppFullName()
		return s
	}
	return s
}

func (s *State) HasWorkspaceContext() bool {
	return s.ContextType == workspace
}
func (s *State) HasSiteAdminContext() bool {
	return s.ContextType == siteAdmin
}
