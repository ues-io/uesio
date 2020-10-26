package sess

import (
	"errors"
	"net/http"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// CreatePublicBrowserSession function
func CreatePublicBrowserSession(site *metadata.Site) (*session.Session, error) {
	return CreateBrowserSession(&metadata.User{
		FirstName: "Guest",
		LastName:  "User",
		Profile:   "uesio.public",
	}, site)
}

// CreateBrowserSession function
func CreateBrowserSession(user *metadata.User, site *metadata.Site) (*session.Session, error) {
	sess := session.NewSessionOptions(&session.SessOptions{
		CAttrs: map[string]interface{}{
			"Profile":   user.Profile,
			"Site":      site.Name,
			"FirstName": user.FirstName,
			"LastName":  user.LastName,
		},
	})
	return &sess, nil
}

// Login function
func Login(w http.ResponseWriter, user *metadata.User, site *metadata.Site) (*Session, error) {
	browserSession, err := CreateBrowserSession(user, site)
	if err != nil {
		return nil, errors.New("Failed Creating session: " + err.Error())
	}

	session.Add(*browserSession, w)
	return &Session{
		browserSession: browserSession,
		site:           site,
	}, nil
}

// Logout function
func Logout(w http.ResponseWriter, s *Session, site *metadata.Site) (*Session, error) {
	oldBrowserSession := s.GetBrowserSession()
	// Remove the logged out session
	session.Remove(*oldBrowserSession, w)

	publicBrowserSession, err := CreatePublicBrowserSession(site)
	if err != nil {
		return nil, errors.New("Failed Creating Public session: " + err.Error())
	}
	session.Add(*publicBrowserSession, w)
	return &Session{
		browserSession: publicBrowserSession,
		site:           site,
	}, nil
}

// GetSessionFromRequest function
func GetSessionFromRequest(w http.ResponseWriter, r *http.Request, site *metadata.Site) (*Session, error) {
	browserSession := session.Get(r)
	if browserSession == nil {
		newSession, err := CreatePublicBrowserSession(site)
		if err != nil {
			return nil, err
		}
		browserSession = *newSession
		// Don't add the session cookie for the login route
		if r.URL.Path != "/site/auth/login" {
			session.Add(browserSession, w)
		}
	}
	return &Session{
		browserSession: &browserSession,
		site:           site,
	}, nil
}

// Session struct
type Session struct {
	browserSession *session.Session
	site           *metadata.Site
	workspace      *metadata.Workspace
}

// GetBrowserSession function (TODO: We could make this go away!)
func (s *Session) GetBrowserSession() *session.Session {
	return s.browserSession
}

// GetSite function
func (s *Session) GetSite() *metadata.Site {
	return s.site
}
