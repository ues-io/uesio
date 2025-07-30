package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func GetUserFromAuthToken(ctx context.Context, token string, site *meta.Site) (*meta.User, error) {
	// Split the token on the ":" character
	cutToken, ok := strings.CutPrefix(token, "ues_")
	if !ok {
		return nil, errors.New("the api key you are trying to log in with is invalid")
	}
	id := cutToken[:8]
	key := cutToken[8:]

	adminSession := sess.GetAnonSession(site)
	loginmethod, err := GetLoginMethod(ctx, id, "uesio/core.apikey", nil, adminSession)
	if err != nil || loginmethod == nil {
		return nil, exceptions.NewBadRequestException("the api key you are trying to log in with does not exist", nil)
	}
	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(key))
	if err != nil {
		return nil, exceptions.NewUnauthorizedException("the api key you are trying to log in with is invalid")
	}

	return GetUserByID(ctx, loginmethod.User.ID, adminSession, nil)
}

func GetSessionFromUser(ctx context.Context, user *meta.User, site *meta.Site, token string) (*sess.Session, error) {
	s := sess.NewWithAuthToken(user, site, token)
	return s, HydrateUserPermissions(ctx, user, s)
}

func HydrateUserPermissions(ctx context.Context, user *meta.User, session *sess.Session) error {
	profileKey := user.Profile
	if profileKey == "" {
		return errors.New("no profile found in session")
	}
	profile, err := datasource.LoadAndHydrateProfile(ctx, profileKey, session)
	if err != nil {
		return fmt.Errorf("error loading profile: %s : %w", profileKey, err)
	}
	user.Permissions = profile.FlattenPermissions()
	user.ProfileRef = profile
	return nil
}

func GetCachedUserByID(ctx context.Context, userid string, site *meta.Site) (*meta.User, error) {

	// Get Cache site info for the host
	cachedUser, ok := getUserCache(userid, site)
	if ok {
		return cachedUser, nil
	}

	s := sess.GetAnonSession(site)

	user, err := GetUserWithPictureByID(ctx, userid, s, nil)
	if err != nil {
		return nil, err
	}

	err = setUserCache(userid, site, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
