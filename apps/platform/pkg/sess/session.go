package sess

import (
	"context"
	"net/http"
	"sort"
	"time"

	"github.com/icza/session"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

func CreateBrowserSession(w http.ResponseWriter, user *meta.User, site *meta.Site) session.Session {
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]any{
			"Site":   site.GetFullName(),
			"UserID": user.ID,
		},
		// TODO: Make Session timeout configurable by App/Site
		// https://github.com/TheCloudMasters/uesio/issues/2643
		Timeout: time.Hour * 12,
	})
	// Remove any previous set-cookie headers
	w.Header().Del("Set-Cookie")
	session.Add(sess, w)
	return sess
}

func GetSessionAttribute(browserSession session.Session, key string) string {
	value, ok := browserSession.CAttr(key).(string)
	if !ok {
		return ""
	}
	return value
}

func New(ID string, user *meta.User, site *meta.Site) *Session {
	return &Session{
		ID:          ID,
		siteSession: NewSiteSession(site, user),
	}
}

func Login(w http.ResponseWriter, user *meta.User, site *meta.Site) *Session {
	return New(CreateBrowserSession(w, user, site).ID(), user, site)
}

func Logout(w http.ResponseWriter, r *http.Request, publicUser *meta.User, s *Session) *Session {
	// Remove the logged-out session
	browserSession := session.Get(r)
	if browserSession != nil {
		session.Remove(browserSession, w)
	}
	// Login as the public user
	return Login(w, publicUser, s.GetSiteSession().GetSite())
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
	ID               string
	siteSession      *SiteSession
	workspaceSession *WorkspaceSession
	siteAdminSession *SiteSession
	versionSession   *VersionSession
	tokens           TokenMap
	// the Go context associated with this session's HTTP request
	ctx context.Context
}

func (s *Session) SetGoContext(ctx context.Context) {
	s.ctx = ctx
}

// Context returns the session's associated Go HTTP request Context
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

// IsExpired returns true if the browser session's last access time, plus the timeout duration,
// is prior to the current timestamp.
func IsExpired(browserSession session.Session) bool {
	if browserSession == nil {
		return true
	}
	return browserSession.Accessed().Add(browserSession.Timeout()).Before(time.Now())
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

func (s *Session) GetSessionId() string {
	return s.ID
}
