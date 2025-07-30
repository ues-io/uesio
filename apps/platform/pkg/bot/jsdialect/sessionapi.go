package jsdialect

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

// SessionAPI and UserAPI expose a limited set of Session information for usage in Bots

type SessionAPI struct {
	session *sess.Session
	wsApi   *WorkspaceAPI
	appApi  *AppAPI
	siteApi *SiteAPI
	// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
	// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
	ctx context.Context
}

type SiteAPI struct {
	site *meta.Site
}

func (s *SiteAPI) GetName() string {
	return s.site.Name
}

func (s *SiteAPI) GetTitle() string {
	return s.site.Title
}

func (s *SiteAPI) GetDomain() string {
	return s.site.Domain
}

func (s *SiteAPI) GetSubDomain() string {
	return s.site.Subdomain
}

func (s *SiteAPI) GetScheme() string {
	return s.site.Scheme
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

type AppAPI struct {
	name        string
	fullName    string
	icon        string
	color       string
	description string
}

func (a *AppAPI) GetName() string {
	return a.name
}
func (a *AppAPI) GetIcon() string {
	return a.icon
}
func (a *AppAPI) GetDescription() string {
	return a.description
}
func (a *AppAPI) GetColor() string {
	return a.color
}

func NewSessionAPI(ctx context.Context, session *sess.Session) *SessionAPI {
	return &SessionAPI{
		session: session,
		ctx:     ctx,
	}
}

func (s *SessionAPI) GetAuthToken() string {
	return s.session.GetAuthToken()
}

func (s *SessionAPI) InWorkspaceContext() bool {
	return s.session.GetWorkspace() != nil
}

func (s *SessionAPI) GetSite() *SiteAPI {
	if s.siteApi != nil {
		return s.siteApi
	}
	if s.session.GetSite() != nil {
		s.siteApi = &SiteAPI{site: s.session.GetSite()}
		return s.siteApi
	}
	return nil
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

func (s *SessionAPI) GetApp(connection wire.Connection) *AppAPI {
	if s.appApi != nil {
		return s.appApi
	}

	appName := s.session.GetContextAppName()
	appApi := &AppAPI{
		fullName: appName,
	}
	s.appApi = appApi
	_, name, err := meta.ParseNamespace(appName)
	if err != nil {
		return appApi
	}

	appApi.name = name

	appData, err := datasource.GetAppData(s.ctx, []string{appName}, connection)
	if err != nil {
		return appApi
	}

	appDataForNamespace, ok := appData[appName]
	if !ok {
		return appApi
	}

	appApi.color = appDataForNamespace.Color
	appApi.icon = appDataForNamespace.Icon
	appApi.description = appDataForNamespace.Description

	return appApi
}
