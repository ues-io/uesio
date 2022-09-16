package sess

import (
	"fmt"
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var SYSTEM_USER = &meta.User{}
var GUEST_USER = &meta.User{}

func createBrowserSession(userid, sitename string) *session.Session {
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]interface{}{
			"Site":   sitename,
			"UserID": userid,
		},
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

func GetPublicUser(site *meta.Site) *meta.User {
	// Get the site's default profile
	defaultSitePublicProfile := site.GetAppBundle().PublicProfile

	if defaultSitePublicProfile == "" {
		defaultSitePublicProfile = "uesio/core.public"
	}

	return &meta.User{
		FirstName: GUEST_USER.FirstName,
		LastName:  GUEST_USER.LastName,
		UniqueKey: GUEST_USER.UniqueKey,
		Username:  GUEST_USER.Username,
		ID:        GUEST_USER.ID,
		Profile:   defaultSitePublicProfile,
	}
}

func NewPublic(site *meta.Site) *Session {
	return New(GetPublicUser(site), site)
}

func Logout(w http.ResponseWriter, s *Session) *Session {
	// Remove the logged out session
	session.Remove(*s.browserSession, w)
	site := s.GetSite()
	// Login as the public user
	return Login(w, GetPublicUser(site), site)
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
	tokens         map[string][]string
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

func (s *Session) AddToken(name string, value []string) {
	if s.tokens == nil {
		s.tokens = map[string][]string{}
	}
	s.tokens[name] = value
}

func (s *Session) HasToken(name string) bool {
	if s.tokens == nil {
		return false
	}
	_, ok := s.tokens[name]
	return ok
}

func (s *Session) GetTokens() []string {
	flatTokens := []string{}
	for name, values := range s.tokens {
		for _, value := range values {
			flatTokens = append(flatTokens, name+":"+value)
		}
	}
	return flatTokens
}

func (s *Session) SetSite(site *meta.Site) {
	s.site = site
}

func (s *Session) GetSite() *meta.Site {
	return s.site
}

func (s *Session) SetSiteAdmin(site *meta.Site) {
	s.siteadmin = site
}

func (s *Session) GetSiteAdmin() *meta.Site {
	return s.siteadmin
}

func (s *Session) GetWorkspace() *meta.Workspace {
	return s.workspace
}

func (s *Session) SetPermissions(permissions *meta.PermissionSet) {
	s.permissions = permissions
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

func (s *Session) AddWorkspaceContext(workspace *meta.Workspace) {
	s.workspace = workspace
}

func (s *Session) AddVersionContext(versionInfo *VersionInfo) {
	s.version = versionInfo
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
