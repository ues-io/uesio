package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetSessionFromUser(sessionID string, user *meta.User, site *meta.Site) (*sess.Session, error) {

	session := sess.New(sessionID, user, site)

	profileKey := session.GetContextProfile()
	if profileKey == "" {
		return nil, errors.New("No profile found in session")
	}
	profile, err := datasource.LoadAndHydrateProfile(profileKey, session)
	if err != nil {
		return nil, errors.New("Error Loading Profile: " + profileKey + " : " + err.Error())
	}
	session.GetContextUser().Permissions = profile.FlattenPermissions()

	return session, nil
}

func GetCachedUserByID(userid string, site *meta.Site) (*meta.User, error) {

	// Get Cache site info for the host
	cachedUser, ok := getUserCache(userid, site.GetAppFullName())
	if ok {
		return cachedUser, nil
	}

	session := sess.GetAnonSession(site)

	user, err := GetUserByID(userid, session, nil)
	if err != nil {
		return nil, err
	}

	err = setUserCache(userid, site.GetAppFullName(), user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
