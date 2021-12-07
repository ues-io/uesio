package sess

import (
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func createBrowserSession(user *meta.User, site *meta.Site) *session.Session {

	// Get the site's default profile
	defaultSitePublicProfile := site.GetAppBundle().PublicProfile

	if defaultSitePublicProfile == "" {
		defaultSitePublicProfile = "uesio.public"
	}

	if user == nil {
		user = &meta.User{
			FirstName: "Guest",
			LastName:  "User",
			ID:        "-1",
			Profile:   defaultSitePublicProfile,
		}
	}
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]interface{}{
			"Profile":   user.Profile,
			"Site":      site.GetFullName(),
			"FirstName": user.FirstName,
			"LastName":  user.LastName,
			"UserID":    user.ID,
			"Picture":   user.GetPictureID(),
		},
	})
	return &sess
}

func GetHeadlessSession(user *meta.User, site *meta.Site) *Session {
	browserSession := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]interface{}{
			"Profile":   user.Profile,
			"FirstName": user.FirstName,
			"LastName":  user.LastName,
			"UserID":    user.ID,
			"Site":      "studio",
		},
	})
	return &Session{
		browserSession: &browserSession,
		site:           site,
	}
}

func create(browserSession *session.Session, site *meta.Site) *Session {
	return &Session{
		browserSession: browserSession,
		site:           site,
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
	browserSession := createBrowserSession(user, site)
	return create(browserSession, site)
}

// NewPublic function
func NewPublic(site *meta.Site) *Session {
	return New(nil, site)
}

// Logout function
func Logout(w http.ResponseWriter, s *Session) *Session {
	// Remove the logged out session
	session.Remove(*s.browserSession, w)
	// Login as the public user
	return Login(w, nil, s.GetSite())
}

// GetSessionFromRequest function
func GetSessionFromRequest(w http.ResponseWriter, r *http.Request, site *meta.Site) (*Session, error) {
	browserSession := session.Get(r)
	if browserSession == nil {
		newSession := createBrowserSession(nil, site)

		browserSession = *newSession
		// Don't add the session cookie for the login route
		if r.URL.Path != "/site/auth/login" {
			session.Add(browserSession, w)
		}
	}
	// Check to make sure our session site matches the site from our domain.
	browserSessionSite := browserSession.CAttr("Site")
	newSession := create(&browserSession, site)
	if browserSessionSite != site.GetFullName() {
		return Logout(w, newSession), nil
	}
	return newSession, nil
}

// Session struct
type Session struct {
	browserSession *session.Session
	site           *meta.Site
	workspace      *meta.Workspace
	siteadmin      *meta.Site
	permissions    *meta.PermissionSet
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
	browserSession := *s.browserSession
	value, ok := browserSession.CAttr(key).(string)
	if !ok {
		return ""
	}
	return value
}

// GetUserInfo function
func (s *Session) GetUserInfo() *meta.User {
	return &meta.User{
		ID:        s.getBrowserSessionAttribute("UserID"),
		FirstName: s.getBrowserSessionAttribute("FirstName"),
		LastName:  s.getBrowserSessionAttribute("LastName"),
		Profile:   s.getBrowserSessionAttribute("Profile"),
		Picture: &meta.UserFileMetadata{
			ID: s.getBrowserSessionAttribute("Picture"),
		},
		Language: s.getBrowserSessionAttribute("Language"),
	}
}

// GetProfile function
func (s *Session) GetProfile() string {
	return s.getBrowserSessionAttribute("Profile")
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
	return create(s.browserSession, s.site)
}

// AddWorkspaceContext function
func (s *Session) AddWorkspaceContext(workspace *meta.Workspace) {
	s.workspace = workspace
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
		return s.siteadmin.App.ID
	}
	return s.site.App.ID
}

// GetContextVersionName returns the appversion in context
func (s *Session) GetContextVersionName() string {
	if s.workspace != nil {
		return s.workspace.Name
	}
	if s.siteadmin != nil {
		return s.siteadmin.Bundle.GetVersionString()
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
