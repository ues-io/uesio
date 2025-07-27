package sess

import (
	"context"
	"sort"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

func New(ctx context.Context, user *meta.User, site *meta.Site) *Session {
	return NewWithAuthToken(ctx, user, site, "")
}

func NewWithAuthToken(ctx context.Context, user *meta.User, site *meta.Site, authToken string) *Session {
	return &Session{
		authToken:   authToken,
		siteSession: NewSiteSession(site, user),
		ctx:         ctx,
	}
}

type WorkspaceSession struct {
	workspace *meta.Workspace
	user      *meta.User
	labels    map[string]string
}

func NewWorkspaceSession(
	workspace *meta.Workspace,
	user *meta.User,
	profileName string,
	permissions *meta.PermissionSet,
) *WorkspaceSession {
	// Shallow clone the user and change the profile name
	wsUser := *user
	wsUser.Profile = profileName
	wsUser.Permissions = permissions
	return &WorkspaceSession{
		workspace: workspace,
		user:      &wsUser,
	}
}

func (s *WorkspaceSession) GetWorkspace() *meta.Workspace {
	return s.workspace
}

func (s *WorkspaceSession) GetID() string {
	return s.workspace.ID
}

func (s *WorkspaceSession) GetUniqueKey() string {
	return s.workspace.UniqueKey
}

func (s *WorkspaceSession) GetAppFullName() string {
	return s.workspace.GetAppFullName()
}

func (s *WorkspaceSession) GetVersion() string {
	return s.workspace.Name
}

type SiteSession struct {
	site   *meta.Site
	user   *meta.User
	labels map[string]string
}

func NewSiteSession(
	site *meta.Site,
	user *meta.User,
) *SiteSession {
	return &SiteSession{
		site: site,
		user: user,
	}
}

func (s *SiteSession) GetSite() *meta.Site {
	return s.site
}

func (s *SiteSession) GetID() string {
	return s.site.ID
}

func (s *SiteSession) GetUniqueKey() string {
	return s.site.UniqueKey
}

func (s *SiteSession) GetAppFullName() string {
	return s.site.GetAppFullName()
}

func (s *SiteSession) GetVersion() string {
	return s.site.Bundle.GetVersionString()
}

type VersionSession struct {
	app       string
	version   string
	user      *meta.User
	bundleDef *meta.BundleDef
}

func NewVersionSession(
	app string,
	version string,
	user *meta.User,
	bundleDef *meta.BundleDef,
) *VersionSession {
	// Shallow clone the user and change the profile name
	vUser := *user
	vUser.Profile = "uesio/system.admin"
	vUser.Permissions = meta.GetAdminPermissionSet()
	return &VersionSession{
		app:       app,
		version:   version,
		user:      &vUser,
		bundleDef: bundleDef,
	}
}

type Session struct {
	authToken        string
	siteSession      *SiteSession
	workspaceSession *WorkspaceSession
	siteAdminSession *SiteSession
	versionSession   *VersionSession
	tokens           TokenMap
	// Original comment from when context property was added to Session in https://github.com/ues-io/uesio/pull/3619/files#diff-b50d36d253129bd263753674a60b24374b3b91b19cd0b492aa4c0d700bf1c885R28:
	// attach the Go context to the session so that we can access the context from basically anywhere.
	// This was done because it was deemed less invasive than refactoring all of our code to pass a context around,
	// since we already have a Session basically everywhere.
	// Ideally, we would have a context.Context in virtually all of our Go method calls,
	// but I leave that for another day, since it would be very time-consuming to refactor all of our Go method calls.
	// TODO (not from original comment): We need to eliminate this, refactor and pass a context through the API flow. Currently, session & connection have context but some places do not
	// have session and connection can sometimes be nil. We also have some things on background contexts (e.g., platform file connection) that are involved in
	// request processing which results in having multiple contexts involved in a request leading to confusion but more importantly, potentially unexpected outcomes.
	ctx context.Context
}

// Context returns the session's associated Go Context
func (s *Session) Context() context.Context {
	return s.ctx
}

func (s *Session) SetLabels(labels map[string]string) {
	if s.workspaceSession != nil {
		s.workspaceSession.labels = labels
	}
	if s.siteAdminSession != nil {
		s.siteAdminSession.labels = labels
	}
	s.siteSession.labels = labels
}

func (s *Session) HasLabels() bool {
	if s.workspaceSession != nil {
		return s.workspaceSession.labels != nil
	}
	if s.siteAdminSession != nil {
		return s.siteAdminSession.labels != nil
	}
	return s.siteSession.labels != nil
}

func (s *Session) GetLabel(labelKey string) string {
	if s.workspaceSession != nil {
		return s.workspaceSession.labels[labelKey]
	}
	if s.siteAdminSession != nil {
		return s.siteAdminSession.labels[labelKey]
	}
	return s.siteSession.labels[labelKey]
}

func (s *Session) GetLabels() map[string]string {
	if s.workspaceSession != nil {
		return s.workspaceSession.labels
	}
	if s.siteAdminSession != nil {
		return s.siteAdminSession.labels
	}
	return s.siteSession.labels
}

func (s *Session) GetFlatTokens() []string {
	if s.tokens == nil {
		return []string{}
	}
	return s.tokens.Flatten()
}

func (s *Session) GetTokenMap() TokenMap {
	if s.tokens == nil {
		return TokenMap{}
	}
	return s.tokens
}

func (s *Session) SetTokenMap(tokenMap TokenMap) {
	s.tokens = tokenMap
}

func (s *Session) SetSiteSession(site *SiteSession) *Session {
	s.siteSession = site
	return s
}

func (s *Session) GetSiteSession() *SiteSession {
	return s.siteSession
}

func (s *Session) SetSiteAdminSession(site *SiteSession) *Session {
	s.siteAdminSession = site
	return s
}

func (s *Session) GetSiteAdminSession() *SiteSession {
	return s.siteAdminSession
}

func (s *Session) GetSiteAdmin() *meta.Site {
	sa := s.GetSiteAdminSession()
	if sa == nil {
		return nil
	}
	return sa.GetSite()
}

func (s *Session) GetWorkspaceSession() *WorkspaceSession {
	return s.workspaceSession
}

func (s *Session) GetWorkspace() *meta.Workspace {
	ws := s.GetWorkspaceSession()
	if ws == nil {
		return nil
	}
	return ws.GetWorkspace()
}

func (s *Session) SetWorkspaceSession(workspace *WorkspaceSession) *Session {
	s.workspaceSession = workspace
	return s
}

func (s *Session) SetVersionSession(version *VersionSession) *Session {
	s.versionSession = version
	return s
}

func MakeSiteTenantID(ID string) string {
	return "site:" + ID
}

func MakeWorkspaceTenantID(ID string) string {
	return "workspace:" + ID
}

func (s *Session) GetTenantIDForCollection(collectionKey string) string {
	// If we're loading uesio/core.user from a workspace, always use the site
	// tenant id, not the workspace tenant id. Since workspaces don't have users.
	if collectionKey == "uesio/core.user" && s.GetWorkspaceSession() != nil {
		return s.GetSiteTenantID()
	}
	return s.GetTenantID()
}

func (s *Session) GetTenantID() string {
	if s.workspaceSession != nil {
		return MakeWorkspaceTenantID(s.workspaceSession.GetUniqueKey())
	}
	if s.siteAdminSession != nil {
		return MakeSiteTenantID(s.siteAdminSession.GetUniqueKey())
	}
	return MakeSiteTenantID(s.siteSession.GetUniqueKey())
}

func (s *Session) GetSiteTenantID() string {
	if s.siteAdminSession != nil {
		return MakeSiteTenantID(s.siteAdminSession.GetUniqueKey())
	}
	return MakeSiteTenantID(s.siteSession.GetUniqueKey())
}

func (s *Session) GetWorkspaceID() string {
	if s.workspaceSession != nil {
		return s.workspaceSession.GetID()
	}
	return ""
}

// IsPublicUser returns true if the session is for a public user (i.e., not logged in).
//
// NOTE: This should not be used for sensitive operations and limited to things like whether or not
// to redirect to login page, etc.  Given current implementation, the public user will always be
// "guest" which is a user that cannot be deleted. Due to the way things are currently implemented,
// the most reliable way to detect the "public user" is by checking the username rather than setting
// a flag when session is created due to the multiple ways that sessions that may involve the public
// user are constructed (doing it upon session creation would require much more invasive changes with
// little to no benefit currently).There are improvements that need to be made to the underlying
// authentication and authorization system and session creation/management to more reliably determine if
// a user is the public user and more specifically, whether or not the user is  logged in/authenticated.
// For now based on how things work this can reliably be used to determine if the session user is the
// public user.
func (s *Session) IsPublicUser() bool {
	// TODO: Once underlying improvements are made to authentication and authorization, middleware, etc.
	// this should be replaced with an "IsAuthenticated" function that will be a more reliable method of
	// determining if a user is authenticated or not.
	return s.GetSiteUser() == nil || s.GetSiteUser().UniqueKey == meta.PublicUsername
}

func (s *Session) GetPublicProfile() string {
	appBundle := s.GetContextAppBundle()
	if appBundle == nil {
		return ""
	}
	return appBundle.PublicProfile
}

func (s *Session) GetLoginRoute() string {
	appBundle := s.GetContextAppBundle()
	if appBundle == nil {
		return ""
	}
	return appBundle.LoginRoute
}

func (s *Session) GetSignupRoute() string {
	appBundle := s.GetContextAppBundle()
	if appBundle == nil {
		return ""
	}
	return appBundle.SignupRoute
}

func (s *Session) GetHomeRoute() string {
	appBundle := s.GetContextAppBundle()
	if appBundle == nil {
		return ""
	}
	return appBundle.HomeRoute
}

func (s *Session) RemoveWorkspaceContext() *Session {
	newSess := s.Clone()
	newSess.workspaceSession = nil
	return newSess
}

func (s *Session) RemoveVersionContext() *Session {
	newSess := s.Clone()
	newSess.versionSession = nil
	return newSess
}

func (s *Session) Clone() *Session {
	newSess := *s
	return &newSess
}

func (s *Session) GetContextNamespaces() []string {
	bundleDef := s.GetContextAppBundle()
	namespaces := []string{
		bundleDef.Name,
	}
	namespaces = append(namespaces, s.GetContextInstalledNamespaces()...)
	return namespaces
}

func (s *Session) GetContextInstalledNamespaces() []string {
	bundleDef := s.GetContextAppBundle()
	namespaces := []string{}
	for name := range bundleDef.Dependencies {
		namespaces = append(namespaces, name)
	}
	sort.Strings(namespaces)
	return namespaces
}

func (s *Session) GetContextURLPrefix() string {
	if s.workspaceSession != nil {
		return "/workspace/" + s.workspaceSession.GetAppFullName() + "/" + s.workspaceSession.GetVersion()
	}
	return "/site"
}

func (s *Session) GetContextAppBundle() *meta.BundleDef {
	if s.versionSession != nil {
		return s.versionSession.bundleDef
	}
	if s.workspaceSession != nil {
		return s.workspaceSession.workspace.GetAppBundle()
	}
	if s.siteAdminSession != nil {
		return s.siteAdminSession.site.GetAppBundle()
	}
	return s.siteSession.site.GetAppBundle()
}

func (s *Session) GetDefaultTheme() string {
	defaultTheme := s.GetContextAppBundle().DefaultTheme
	if defaultTheme == "" {
		return "uesio/core.default"
	}
	return defaultTheme
}

func (s *Session) GetContextAppName() string {
	if s.versionSession != nil {
		return s.versionSession.app
	}
	if s.workspaceSession != nil {
		return s.workspaceSession.GetAppFullName()
	}
	if s.siteAdminSession != nil {
		return s.siteAdminSession.GetAppFullName()
	}
	return s.siteSession.GetAppFullName()
}

func (s *Session) GetContextVersionName() string {
	if s.versionSession != nil {
		return s.versionSession.version
	}
	if s.workspaceSession != nil {
		return s.workspaceSession.GetVersion()
	}
	if s.siteAdminSession != nil {
		return s.siteAdminSession.GetVersion()
	}
	return s.siteSession.GetVersion()
}

func (s *Session) GetContextUser() *meta.User {
	if s.versionSession != nil {
		return s.versionSession.user
	}
	if s.workspaceSession != nil {
		return s.workspaceSession.user
	}
	if s.siteAdminSession != nil {
		return s.siteAdminSession.user
	}
	return s.siteSession.user
}

func (s *Session) GetSiteUser() *meta.User {
	return s.siteSession.user
}

func (s *Session) GetSite() *meta.Site {
	site := s.GetSiteSession()
	if site == nil {
		return nil
	}
	return site.GetSite()
}

func (s *Session) GetContextPermissions() *meta.PermissionSet {
	return s.GetContextUser().Permissions
}

func (s *Session) GetSitePermissions() *meta.PermissionSet {
	return s.GetSiteUser().Permissions
}

func (s *Session) GetContextProfile() string {
	user := s.GetContextUser()
	if user != nil {
		return user.Profile
	}
	return ""
}

func (s *Session) GetContextSite() *meta.Site {
	if s.siteAdminSession != nil {
		return s.GetSiteAdmin()
	}
	return s.GetSite()
}

// This is only required because we allow bots to use it to make calls to the APIs. Based on
// discussion with @humandad, it was largely added in order to support testing more than a real-world
// use case. Providing bots the ability to do this comes with pros/cons but there is something to be
// said for eliminating this completely until a real-world use case arises and a solution fully vetted
// and designed. For now, leaving this in for backwards compatibility.
// TODO: Per above, evaluate if this should even exist and if so, if it should be implemented differently.
func (s *Session) GetAuthToken() string {
	return s.authToken
}
