package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func LoadAndHydrateProfile(profileKey string, session *sess.Session) (*meta.Profile, error) {
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
