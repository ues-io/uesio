package sess

import (
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

func createBrowserSession(user *metadata.User, site *metadata.Site) *session.Session {
	if user == nil {
		user = &metadata.User{
			FirstName: "Guest",
			LastName:  "User",
			Profile:   "uesio.public",
		}
	}
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]interface{}{
			"Profile":   user.Profile,
			"Site":      site.Name,
			"FirstName": user.FirstName,
			"LastName":  user.LastName,
		},
	})
	return &sess
}

func create(browserSession *session.Session, site *metadata.Site) *Session {
	return &Session{
		browserSession: browserSession,
		site:           site,
	}
}

// Login function
func Login(w http.ResponseWriter, user *metadata.User, site *metadata.Site) *Session {
	s := New(user, site)
	session.Add(*s.browserSession, w)
	return s
}

// New function
func New(user *metadata.User, site *metadata.Site) *Session {
	browserSession := createBrowserSession(user, site)
	return create(browserSession, site)
}

// NewPublic function
func NewPublic(site *metadata.Site) *Session {
	return New(nil, site)
}

// Logout function
func Logout(w http.ResponseWriter, s *Session, site *metadata.Site) *Session {
	// Remove the logged out session
	session.Remove(*s.browserSession, w)
	// Login as the public user
	return Login(w, nil, site)
}

// GetSessionFromRequest function
func GetSessionFromRequest(w http.ResponseWriter, r *http.Request, site *metadata.Site) (*Session, error) {
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
	if browserSessionSite != site.Name {
		return Logout(w, create(&browserSession, site), site), nil
	}
	return create(&browserSession, site), nil
}

// Session struct
type Session struct {
	browserSession *session.Session
	site           *metadata.Site
	workspace      *metadata.Workspace
}

// GetSite function
func (s *Session) GetSite() *metadata.Site {
	return s.site
}

// SetWorkspace function
func (s *Session) SetWorkspace(workspace *metadata.Workspace) {
	s.workspace = workspace
}

// GetWorkspace function
func (s *Session) GetWorkspace() *metadata.Workspace {
	return s.workspace
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
		return s.workspace.AppRef
	}
	return ""
}

func (s *Session) getBrowserSessionAttribute(key string) string {
	browserSession := *s.browserSession
	return browserSession.CAttr(key).(string)
}

// GetUserInfo function
func (s *Session) GetUserInfo() *metadata.User {
	return &metadata.User{
		FirstName: s.getBrowserSessionAttribute("FirstName"),
		LastName:  s.getBrowserSessionAttribute("LastName"),
		Profile:   s.getBrowserSessionAttribute("Profile"),
		Site:      s.site.Name,
	}
}

// GetProfile function
func (s *Session) GetProfile() string {
	return s.getBrowserSessionAttribute("Profile")
}
