package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func loadAndHydrateProfile(profileKey string, session *sess.Session) (*meta.Profile, error) {
	profile, err := meta.NewProfile(profileKey)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(profile, session, nil)
	if err != nil {
		logger.Log("Failed Permission Request: "+profileKey+" : "+err.Error(), logger.INFO)
		return nil, err
	}
	// LoadFromSite in the permission sets for this profile
	for _, permissionSetRef := range profile.PermissionSetRefs {

		permissionSet, err := meta.NewPermissionSet(permissionSetRef)
		if err != nil {
			return nil, err
		}

		err = bundle.Load(permissionSet, session, nil)
		if err != nil {
			logger.Log("Failed Permission Request: "+permissionSetRef+" : "+err.Error(), logger.INFO)
			return nil, err
		}
		profile.PermissionSets = append(profile.PermissionSets, *permissionSet)
	}
	return profile, nil
}

func getProfilePermSet(session *sess.Session) (*meta.PermissionSet, error) {
	profileKey := session.GetProfile()
	if profileKey == "" {
		return nil, errors.New("No profile found in session")
	}
	profile, err := loadAndHydrateProfile(profileKey, session)
	if err != nil {
		return nil, errors.New("Error Loading Profile: " + profileKey + " : " + err.Error())
	}

	return profile.FlattenPermissions(), nil
}
