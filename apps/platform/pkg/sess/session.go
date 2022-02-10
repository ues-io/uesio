package sess

import (
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func createBrowserSession(userID, sitename string) *session.Session {
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]interface{}{
			"Site":   sitename,
			"UserID": userID,
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

// Login function
func Login(w http.ResponseWriter, user *meta.User, site *meta.Site) *Session {
	s := New(user, site)
	session.Add(*s.browserSession, w)
	return s
}

// New function
func New(user *meta.User, site *meta.Site) *Session {
	browserSession := createBrowserSession(user.ID, site.GetFullName())
	return NewSession(browserSession, user, site)
}

func GetPublicUser(site *meta.Site) *meta.User {
	// Get the site's default profile
	defaultSitePublicProfile := site.GetAppBundle().PublicProfile

	if defaultSitePublicProfile == "" {
		defaultSitePublicProfile = "uesio.public"
	}
	return &meta.User{
		FirstName: "Guest",
		LastName:  "User",
		ID:        "system_guest",
		Profile:   defaultSitePublicProfile,
	}
}

// NewPublic function
func NewPublic(site *meta.Site) *Session {
	return New(GetPublicUser(site), site)
}

// Logout function
func Logout(w http.ResponseWriter, s *Session) *Session {
	// Remove the logged out session
	session.Remove(*s.browserSession, w)
	site := s.GetSite()
	// Login as the public user
	return Login(w, GetPublicUser(site), site)
}

type VersionInfo struct {
	App     string
	Version string
}

// Session struct
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

// SetSite function
func (s *Session) SetSite(site *meta.Site) {
	s.site = site
}

// GetSite function
func (s *Session) GetSite() *meta.Site {
	return s.site
}

// SetSiteAdmin function
func (s *Session) SetSiteAdmin(site *meta.Site) {
	s.siteadmin = site
}

// GetSiteAdmin function
func (s *Session) GetSiteAdmin() *meta.Site {
	return s.siteadmin
}

// GetWorkspace function
func (s *Session) GetWorkspace() *meta.Workspace {
	return s.workspace
}

// SetPermissions function
func (s *Session) SetPermissions(permissions *meta.PermissionSet) {
	s.permissions = permissions
}

// GetPermissions function
func (s *Session) GetPermissions() *meta.PermissionSet {
	return s.permissions
}

func (s *Session) GetTenantID() string {
	if s.workspace != nil {
		return "workspace:" + s.workspace.ID
	}
	if s.siteadmin != nil {
		return "site:" + s.siteadmin.ID
	}
	return "site:" + s.site.ID
}

// GetWorkspaceID function
func (s *Session) GetWorkspaceID() string {
	if s.workspace != nil {
		return s.workspace.ID
	}
	return ""
}

// GetWorkspaceApp function
func (s *Session) GetWorkspaceApp() string {
	if s.workspace != nil {
		return s.workspace.GetAppID()
	}
	return ""
}

func (s *Session) getBrowserSessionAttribute(key string) string {
	return GetSessionAttribute(s.browserSession, key)
}

func (s *Session) GetBrowserSession() *session.Session {
	return s.browserSession
}

// GetUserInfo function
func (s *Session) GetUserInfo() *meta.User {
	return s.user
}

func (s *Session) GetUserID() string {
	return s.user.ID
}

// GetProfile function
func (s *Session) GetProfile() string {
	return s.user.Profile
}

// IsPublicProfile function
func (s *Session) IsPublicProfile() bool {
	return s.GetProfile() == s.GetPublicProfile()
}

// GetPublicProfile function
func (s *Session) GetPublicProfile() string {
	appBundle := s.site.GetAppBundle()
	if appBundle == nil {
		return ""
	}
	return appBundle.PublicProfile
}

// GetLoginRoute function
func (s *Session) GetLoginRoute() string {
	appBundle := s.site.GetAppBundle()
	if appBundle == nil {
		return ""
	}
	return appBundle.LoginRoute
}

// RemoveWorkspaceContext function
func (s *Session) RemoveWorkspaceContext() *Session {
	newSess := NewSession(s.browserSession, s.user, s.site)
	newSess.tokens = s.tokens
	return newSess
}

// AddWorkspaceContext function
func (s *Session) AddWorkspaceContext(workspace *meta.Workspace) {
	s.workspace = workspace
}

func (s *Session) AddVersionContext(versionInfo *VersionInfo) {
	s.version = versionInfo
}

// GetContextNamespaces function
func (s *Session) GetContextNamespaces() map[string]bool {
	bundleDef := s.GetContextAppBundle()
	namespaces := map[string]bool{
		bundleDef.Name: true,
	}
	for name := range bundleDef.Dependencies {
		namespaces[name] = true
	}
	return namespaces
}

// GetContextAppBundle returns the appbundle in context
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
		return "uesio.default"
	}
	return defaultTheme
}

// GetContextAppName returns the appname in context
func (s *Session) GetContextAppName() string {
	if s.workspace != nil {
		return s.workspace.GetAppID()
	}
	if s.siteadmin != nil {
		return s.siteadmin.GetAppID()
	}
	if s.version != nil {
		return s.version.App
	}
	return s.site.GetAppID()
}

// GetContextVersionName returns the appversion in context
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

// GetContextPermissions returns the permissions in context
func (s *Session) GetContextPermissions() *meta.PermissionSet {
	if s.workspace != nil {
		return s.workspace.Permissions
	}
	return s.permissions
}
