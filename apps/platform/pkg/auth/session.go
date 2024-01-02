package auth

import (
	"context"
	"errors"

	"github.com/icza/session"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetUserFromBrowserSession(browserSession session.Session, site *meta.Site) (*meta.User, error) {
	if browserSession == nil {
		return GetPublicUser(site, nil)
	}
	browserSessionSite := sess.GetSessionAttribute(browserSession, "Site")
	browserSessionUser := sess.GetSessionAttribute(browserSession, "UserID")
	// Check to make sure our session site matches the site from our domain.
	if browserSessionSite != site.GetFullName() {
		return nil, errors.New("Sites mismatch for user: " + browserSessionUser)
	}
	return GetCachedUserByID(browserSessionUser, site)
}

func GetSessionFromUser(sessionID string, user *meta.User, site *meta.Site) (*sess.Session, error) {
	s := sess.New(sessionID, user, site)
	return s, HydrateUserPermissions(user, s)
}

func HydrateUserPermissions(user *meta.User, session *sess.Session) error {
	profileKey := user.Profile
	if profileKey == "" {
		return errors.New("No profile found in session")
	}
	profile, err := datasource.LoadAndHydrateProfile(profileKey, session)
	if err != nil {
		return errors.New("Error Loading Profile: " + profileKey + " : " + err.Error())
	}
	user.Permissions = profile.FlattenPermissions()
	user.ProfileRef = profile
	return nil
}

func GetCachedUserByID(userid string, site *meta.Site) (*meta.User, error) {

	// Get Cache site info for the host
	cachedUser, ok := getUserCache(userid, site.GetAppFullName())
	if ok {
		return cachedUser, nil
	}

	s := sess.GetAnonSession(context.Background(), site)

	user, err := GetUserByID(userid, s, nil)
	if err != nil {
		return nil, err
	}

	err = setUserCache(userid, site.GetAppFullName(), user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
