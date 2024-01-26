package jsdialect

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// SessionAPI and UserAPI expose a limited set of Session information for usage in Bots

type SessionAPI struct {
	session *sess.Session
	wsApi   *WorkspaceAPI
}
type WorkspaceAPI struct {
	workspace *meta.Workspace
}

func (w *WorkspaceAPI) GetAppFullName() string {
	return w.workspace.GetAppFullName()
}
func (w *WorkspaceAPI) GetName() string {
	return w.workspace.Name
}
func (w *WorkspaceAPI) GetUrlPrefix() string {
	return fmt.Sprintf("/workspace/%s/%s", w.workspace.GetAppFullName(), w.workspace.Name)
}

func NewSessionAPI(session *sess.Session) *SessionAPI {
	return &SessionAPI{
		session: session,
	}
}

func (s *SessionAPI) GetId() string {
	return s.session.GetSessionId()
}

func (s *SessionAPI) InWorkspaceContext() bool {
	return s.session.GetWorkspace() != nil
}

func (s *SessionAPI) GetWorkspace() *WorkspaceAPI {
	if s.wsApi != nil {
		return s.wsApi
	}
	if s.session.GetWorkspace() != nil {
		s.wsApi = &WorkspaceAPI{workspace: s.session.GetWorkspace()}
		return s.wsApi
	}
	return nil
}
