package limits

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const limitNameMaxDomainsPerUser = "uesio/studio.max_domains_per_user"

func GetLimitDomainsPerUser(ctx context.Context, user string, session *sess.Session) (int, error) {
	return GetNumericLimit(ctx, limitNameMaxDomainsPerUser, user, session)
}

func GetNumericLimit(ctx context.Context, numericLimitName, user string, session *sess.Session) (int, error) {
	flag, err := featureflagstore.GetFeatureFlag(ctx, numericLimitName, session, user)
	if err != nil {
		return 0, err
	}
	if flag.Value != nil {
		if floatVal, ok := flag.Value.(float64); ok {
			return int(floatVal), nil
		}
		if intVal, ok := flag.Value.(int); ok {
			return intVal, nil
		}
	}
	return 0, fmt.Errorf("no value found for feature flag: %s", numericLimitName)
}
