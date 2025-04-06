package auth

import (
	"context"
	"errors"
	"strings"

	"github.com/icza/session"
	"golang.org/x/crypto/bcrypt"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func GetUserFromAuthToken(token string, site *meta.Site) (*meta.User, error) {
	// Split the token on the ":" character
	cutToken, ok := strings.CutPrefix(token, "ues_")
	if !ok {
		return nil, errors.New("The api key you are trying to log in with is invalid")
	}
	id := cutToken[:8]
	key := cutToken[8:]

	adminSession := sess.GetAnonSession(context.Background(), site)
	loginmethod, err := GetLoginMethod(id, "uesio/core.apikey", nil, adminSession)
	if err != nil || loginmethod == nil {
		return nil, exceptions.NewBadRequestException("The api key you are trying to log in with does not exist", nil)
	}
	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(key))
	if err != nil {
		return nil, exceptions.NewUnauthorizedException("The api key you are trying to log in with is invalid")
	}

	return GetUserByID(loginmethod.User.ID, adminSession, nil)
}

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
	cachedUser, ok := getUserCache(userid, site)
	if ok {
		return cachedUser, nil
	}

	s := sess.GetAnonSession(context.Background(), site)

	user, err := GetUserWithPictureByID(userid, s, nil)
	if err != nil {
		return nil, err
	}

	err = setUserCache(userid, site, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
