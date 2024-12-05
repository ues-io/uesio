package limits

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const limitNameMaxDomainsPerUser = "uesio/studio.max_domains_per_user"

func GetLimitDomainsPerUser(user string, session *sess.Session) (int, error) {
	return GetNumericLimit(limitNameMaxDomainsPerUser, user, session)
}

func GetNumericLimit(numericLimitName, user string, session *sess.Session) (int, error) {
	flag, err := featureflagstore.GetFeatureFlag(numericLimitName, session, user)
	if err != nil {
		return 0, err
	}
	if flag.Value != nil {
		fmt.Println("Found flag")
		fmt.Println(flag.Value)
		if floatVal, ok := flag.Value.(float64); ok {
			return int(floatVal), nil
		}
	}
	return 0, errors.New("No value found for feature flag: " + numericLimitName)
}
