package limits

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const limitNameMaxDomainsPerUser = "uesio/studio.max_domains_per_user"

func GetLimitDomainsPerUser(user string, session *sess.Session) (int, error) {
	return GetNumericLimit(limitNameMaxDomainsPerUser, user, session)
}

func GetNumericLimit(numericLimitName, user string, session *sess.Session) (int, error) {
	assignments := &meta.FeatureFlagAssignmentCollection{}
	err := featureflagstore.GetValues(user, assignments, session)
	if err != nil {
		return 0, err
	}
	for _, assignment := range *assignments {
		if assignment.Flag == numericLimitName {
			if assignment.Value != nil {
				if floatVal, ok := assignment.Value.(float64); ok {
					return int(floatVal), nil
				}
			}
		}
	}
	// If we didn't find an assignment, then we need to use the default value
	featureFlag, err := meta.NewFeatureFlag(numericLimitName)
	if err != nil {
		return 0, err
	}
	err = bundle.Load(featureFlag, nil, session, nil)
	if err != nil {
		return 0, err
	}
	if featureFlag == nil || featureFlag.DefaultValue == nil {
		return 0, nil
	}

	return featureFlag.DefaultValue.(int), nil
}
