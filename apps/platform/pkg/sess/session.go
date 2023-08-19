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
		site:           site,
		user:           user,
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
	site := s.GetSite()
	// Login as the public user
	return Login(w, publicUser, site)
}

type VersionInfo struct {
	App       string
	Namespace string
	Version   string
}

type Session struct {
	browserSession *session.Session
	site           *meta.Site
	workspace      *meta.Workspace
	siteadmin      *meta.Site
	version        *VersionInfo
	permissions    *meta.PermissionSet
	user           *meta.User
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

func (s *Session) SetSite(site *meta.Site) *Session {
	s.site = site
	return s
}

func (s *Session) GetSite() *meta.Site {
	return s.site
}

func (s *Session) SetUser(user *meta.User) *Session {
	s.user = user
	return s
}

func (s *Session) SetSiteAdmin(site *meta.Site) *Session {
	s.siteadmin = site
	return s
}

func (s *Session) GetSiteAdmin() *meta.Site {
	return s.siteadmin
}

func (s *Session) GetWorkspace() *meta.Workspace {
	return s.workspace
}

func (s *Session) SetPermissions(permissions *meta.PermissionSet) *Session {
	s.permissions = permissions
	return s
}

func (s *Session) GetPermissions() *meta.PermissionSet {
	return s.permissions
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
	if collectionKey == "uesio/core.user" && s.GetWorkspace() != nil {
		return s.GetSiteTenantID()
	}
	return s.GetTenantID()
}

func (s *Session) GetTenantID() string {
	if s.workspace != nil {
		return MakeWorkspaceTenantID(s.workspace.UniqueKey)
	}
	if s.siteadmin != nil {
		return MakeSiteTenantID(s.siteadmin.UniqueKey)
	}
	return MakeSiteTenantID(s.site.UniqueKey)
}

func (s *Session) GetSiteTenantID() string {
	if s.siteadmin != nil {
		return MakeSiteTenantID(s.siteadmin.UniqueKey)
	}
	return MakeSiteTenantID(s.site.UniqueKey)
}

func (s *Session) GetWorkspaceID() string {
	if s.workspace != nil {
		return s.workspace.ID
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

func (s *Session) GetUserInfo() *meta.User {
	return s.user
}

func (s *Session) GetUserID() string {
	return s.user.ID
}

func (s *Session) GetUserUniqueKey() string {
	return s.user.UniqueKey
}

func (s *Session) GetProfile() string {
	return s.user.Profile
}

func (s *Session) IsPublicProfile() bool {
	return s.GetProfile() == s.GetPublicProfile()
}

func (s *Session) GetPublicProfile() string {
	appBundle := s.site.GetAppBundle()

	if s.siteadmin != nil {
		appBundle = s.siteadmin.GetAppBundle()
	}

	if appBundle == nil {
		return ""
	}
	return appBundle.PublicProfile
}

func (s *Session) GetLoginRoute() string {
	appBundle := s.site.GetAppBundle()
	if appBundle == nil {
		return ""
	}
	return appBundle.LoginRoute
}

func (s *Session) RemoveWorkspaceContext() *Session {
	newSess := NewSession(s.browserSession, s.user, s.site)
	newSess.tokens = s.tokens
	newSess.permissions = s.permissions
	return newSess
}

func (s *Session) Clone() *Session {
	newSess := NewSession(s.browserSession, s.user, s.site)
	newSess.tokens = s.tokens
	newSess.permissions = s.permissions
	if s.workspace != nil {
		newSess.workspace = s.workspace.Clone()
	}
	if s.siteadmin != nil {
		newSess.siteadmin = s.siteadmin.Clone()
	}
	newSess.site = s.site.Clone()
	return newSess
}

func (s *Session) AddWorkspaceContext(workspace *meta.Workspace) *Session {
	s.workspace = workspace
	return s
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
		return s.workspace.GetAppBundle()
	}
	if s.siteadmin != nil {
		return s.siteadmin.GetAppBundle()
	}
	return s.site.GetAppBundle()
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
		return s.workspace.Name
	}
	if s.siteadmin != nil {
		return s.siteadmin.Bundle.GetVersionString()
	}
	if s.version != nil {
		return s.version.Version
	}
	return s.site.Bundle.GetVersionString()
}

func (s *Session) GetContextPermissions() *meta.PermissionSet {
	if s.workspace != nil {
		return s.workspace.Permissions
	}
	if s.siteadmin != nil {
		return s.siteadmin.Permissions
	}
	return s.permissions
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
