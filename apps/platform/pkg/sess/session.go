package sess

import (
	"fmt"
	"net/http"
	"time"

	"github.com/twmb/murmur3"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func createBrowserSession(userid, sitename string) *session.Session {
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]interface{}{
			"Site":   sitename,
			"UserID": userid,
		},
		// TODO: Make Session timeout configurable by App/Site
		// https://github.com/TheCloudMasters/uesio/issues/2643
		Timeout: time.Hour * 12,
	})
	return &sess
}

func GetSessionAttribute(browserSession *session.Session, key string) string {
	value, ok := (*browserSession).CAttr(key).(string)
	if !ok {
		return ""
	}
	return value
}

func NewSession(browserSession *session.Session, user *meta.User, site *meta.Site) *Session {
	return &Session{
		browserSession: browserSession,
		site:           NewSiteSession(site, user),
	}
}

func Login(w http.ResponseWriter, user *meta.User, site *meta.Site) *Session {
	s := New(user, site)
	session.Add(*s.browserSession, w)
	return s
}

func New(user *meta.User, site *meta.Site) *Session {
	browserSession := createBrowserSession(user.ID, site.GetFullName())
	return NewSession(browserSession, user, site)
}

func Logout(w http.ResponseWriter, publicUser *meta.User, s *Session) *Session {
	// Remove the logged-out session
	session.Remove(*s.browserSession, w)
	sitesession := s.GetSiteSession()
	// Login as the public user
	return Login(w, publicUser, sitesession.GetSite())
}

type VersionInfo struct {
	App       string
	Namespace string
	Version   string
}

type WorkspaceSession struct {
	workspace *meta.Workspace
	user      *meta.User
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

type SiteSession struct {
	site *meta.Site
	user *meta.User
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

type Session struct {
	browserSession *session.Session
	site           *SiteSession
	workspace      *WorkspaceSession
	siteadmin      *SiteSession
	version        *VersionInfo
	tokens         TokenMap
	labels         map[string]string
}

func (s *Session) SetLabels(labels map[string]string) {
	s.labels = labels
}

func (s *Session) HasLabels() bool {
	return s.labels != nil
}

func (s *Session) GetLabel(labelKey string) string {
	return s.labels[labelKey]
}

func (s *Session) GetLabels() map[string]string {
	return s.labels
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
	s.site = site
	return s
}

func (s *Session) GetSiteSession() *SiteSession {
	return s.site
}

func (s *Session) SetSiteAdminSession(site *SiteSession) *Session {
	s.siteadmin = site
	return s
}

func (s *Session) GetSiteAdminSession() *SiteSession {
	return s.siteadmin
}

func (s *Session) GetSiteAdmin() *meta.Site {
	sa := s.GetSiteAdminSession()
	if sa == nil {
		return nil
	}
	return sa.GetSite()
}

func (s *Session) GetWorkspaceSession() *WorkspaceSession {
	return s.workspace
}

func (s *Session) GetWorkspace() *meta.Workspace {
	ws := s.GetWorkspaceSession()
	if ws == nil {
		return nil
	}
	return ws.GetWorkspace()
}

func (s *Session) SetWorkspaceSession(workspace *WorkspaceSession) *Session {
	s.workspace = workspace
	return s
}

func MakeSiteTenantID(ID string) string {
	return fmt.Sprintf("site:%s", ID)
}

func MakeWorkspaceTenantID(ID string) string {
	return fmt.Sprintf("workspace:%s", ID)
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
	if s.workspace != nil {
		return MakeWorkspaceTenantID(s.workspace.GetUniqueKey())
	}
	if s.siteadmin != nil {
		return MakeSiteTenantID(s.siteadmin.GetUniqueKey())
	}
	return MakeSiteTenantID(s.site.GetUniqueKey())
}

func (s *Session) GetSiteTenantID() string {
	if s.siteadmin != nil {
		return MakeSiteTenantID(s.siteadmin.GetUniqueKey())
	}
	return MakeSiteTenantID(s.site.GetUniqueKey())
}

func (s *Session) GetWorkspaceID() string {
	if s.workspace != nil {
		return s.workspace.GetID()
	}
	return ""
}

func (s *Session) getBrowserSessionAttribute(key string) string {
	return GetSessionAttribute(s.browserSession, key)
}

func (s *Session) GetBrowserSession() *session.Session {
	return s.browserSession
}

// IsExpired returns true if the browser session's last access time, plus the timeout duration,
// is prior to the current timestamp.
func (s *Session) IsExpired() bool {
	if s.browserSession == nil {
		return true
	}
	val := *s.browserSession
	return val.Accessed().Add(val.Timeout()).Before(time.Now())
}

func (s *Session) IsPublicProfile() bool {
	return s.GetContextProfile() == s.GetPublicProfile()
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

func (s *Session) RemoveWorkspaceContext() *Session {
	newSess := *s
	newSess.workspace = nil
	return &newSess
}

func (s *Session) AddVersionContext(versionInfo *VersionInfo) *Session {
	s.version = versionInfo
	return s
}

func (s *Session) GetContextNamespaces() []string {
	bundleDef := s.GetContextAppBundle()
	namespaces := []string{
		bundleDef.Name,
	}
	for name := range bundleDef.Dependencies {
		namespaces = append(namespaces, name)
	}
	return namespaces
}

func (s *Session) GetContextInstalledNamespaces() []string {
	bundleDef := s.GetContextAppBundle()
	namespaces := []string{}
	for name := range bundleDef.Dependencies {
		namespaces = append(namespaces, name)
	}
	return namespaces
}

func (s *Session) GetContextAppBundle() *meta.BundleDef {
	if s.workspace != nil {
		return s.workspace.workspace.GetAppBundle()
	}
	if s.siteadmin != nil {
		return s.siteadmin.site.GetAppBundle()
	}
	return s.site.site.GetAppBundle()
}

func (s *Session) GetDefaultTheme() string {
	defaultTheme := s.GetContextAppBundle().DefaultTheme
	if defaultTheme == "" {
		return "uesio/core.default"
	}
	return defaultTheme
}

func (s *Session) GetContextAppName() string {
	if s.workspace != nil {
		return s.workspace.GetAppFullName()
	}
	if s.siteadmin != nil {
		return s.siteadmin.GetAppFullName()
	}
	if s.version != nil {
		return s.version.App
	}
	return s.site.GetAppFullName()
}

func (s *Session) GetContextVersionName() string {
	if s.workspace != nil {
		return s.workspace.GetWorkspace().Name
	}
	if s.siteadmin != nil {
		return s.siteadmin.GetSite().Bundle.GetVersionString()
	}
	if s.version != nil {
		return s.version.Version
	}
	return s.site.GetSite().Bundle.GetVersionString()
}

func (s *Session) GetContextUser() *meta.User {
	if s.workspace != nil {
		return s.workspace.user
	}
	if s.siteadmin != nil {
		return s.siteadmin.user
	}
	return s.site.user
}

func (s *Session) GetSiteUser() *meta.User {
	return s.site.user
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
	if s.siteadmin != nil {
		return s.GetSiteAdmin()
	}
	return s.GetSite()
}

func (s *Session) GetSessionId() string {
	bs := (*s).GetBrowserSession()
	if bs == nil {
		return ""
	}
	return (*bs).ID()
}

func (s *Session) GetSessionIdHash() string {
	sessionId := s.GetSessionId()
	if sessionId == "" {
		return ""
	}
	hasher := murmur3.New64()
	_, err := hasher.Write([]byte(sessionId))
	if err != nil {
		return ""
	}
	return fmt.Sprintf("%d", hasher.Sum64())
}
