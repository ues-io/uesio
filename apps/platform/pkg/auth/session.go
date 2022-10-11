package auth

import (
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetSessionFromRequest(browserSession session.Session, site *meta.Site) (*sess.Session, error) {

	session, err := loadSession(browserSession, site)
	if err != nil {
		return nil, err
	}

	permSet, err := getProfilePermSet(session)
	if err != nil {
		return nil, err
	}

	session.SetPermissions(permSet)

	return session, nil
}

func getPublicSession(site *meta.Site) (*sess.Session, error) {
	user, err := GetPublicUser(site, nil)
	if err != nil {
		return nil, err
	}
	return sess.New(user, site), nil
}

func loadSession(browserSession session.Session, site *meta.Site) (*sess.Session, error) {

	if browserSession == nil {
		return getPublicSession(site)
	}
	// Check to make sure our session site matches the site from our domain.
	browserSessionSite := sess.GetSessionAttribute(&browserSession, "Site")
	browserSessionUser := sess.GetSessionAttribute(&browserSession, "UserID")

	if browserSessionSite != site.GetFullName() {
		logger.Log("Sites mismatch: "+browserSessionUser, logger.INFO)
		return getPublicSession(site)
	}

	user, err := getUserFromSession(browserSessionUser, site)
	if err != nil {
		if _, ok := err.(*datasource.RecordNotFoundError); ok {
			// User not found. No error though.
			logger.Log("Could not find user: "+browserSessionUser, logger.INFO)
			return getPublicSession(site)
		}
		return nil, err
	}

	session := sess.NewSession(&browserSession, user, site)

	return session, nil
}

func getUserFromSession(userid string, site *meta.Site) (*meta.User, error) {

	// Get Cache site info for the host
	cachedUser, ok := GetUserCache(userid, site.GetAppFullName())
	if ok {
		return cachedUser, nil
	}

	session, err := GetStudioAnonSession()
	if err != nil {
		return nil, err
	}

	user, err := GetUserByID(userid, session, nil)
	if err != nil {
		return nil, err
	}

	err = SetUserCache(userid, site.GetAppFullName(), user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
