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

func loadSession(browserSession session.Session, site *meta.Site) (*sess.Session, error) {

	if browserSession == nil {
		return sess.NewPublic(site), nil
	}
	// Check to make sure our session site matches the site from our domain.
	browserSessionSite := sess.GetSessionAttribute(&browserSession, "Site")
	browserSessionUser := sess.GetSessionAttribute(&browserSession, "UserID")

	if browserSessionSite != site.GetFullName() {
		logger.Log("Sites mismatch: "+browserSessionUser, logger.INFO)
		return sess.NewPublic(site), nil
	}

	fakeSession := sess.NewSession(nil, &meta.User{
		ID:        "system",
		FirstName: "Super",
		LastName:  "Admin",
		Profile:   "uesio/uesio.public",
	}, site)
	fakeSession.SetPermissions(&meta.PermissionSet{
		CollectionRefs: map[string]bool{
			"uesio/uesio.user":      true,
			"uesio/uesio.userfiles": true,
		},
	})

	user, err := getUserFromSession(browserSessionUser, fakeSession)
	if err != nil {
		if _, ok := err.(*datasource.RecordNotFoundError); ok {
			// User not found. No error though.
			logger.Log("Could not find user: "+browserSessionUser, logger.INFO)
			return sess.NewPublic(site), nil
		}
		return nil, err
	}

	session := sess.NewSession(&browserSession, user, site)

	return session, nil
}

func getUserFromSession(userid string, session *sess.Session) (*meta.User, error) {

	if userid == "guest" {
		return sess.GetPublicUser(session.GetSite()), nil
	}
	// Get Cache site info for the host
	cachedUser, ok := GetUserCache(userid, session.GetSite().GetAppID())
	if ok {
		return cachedUser, nil
	}

	user, err := GetUserByID(userid, session)
	if err != nil {
		return nil, err
	}

	err = SetUserCache(userid, session.GetSite().GetAppID(), user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
