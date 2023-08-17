package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getProfilePermSet(session *sess.Session) (*meta.PermissionSet, error) {
	profileKey := session.GetProfile()
	if profileKey == "" {
		return nil, errors.New("No profile found in session")
	}
	profile, err := datasource.LoadAndHydrateProfile(profileKey, session)
	if err != nil {
		return nil, errors.New("Error Loading Profile: " + profileKey + " : " + err.Error())
	}

	return profile.FlattenPermissions(), nil
}
