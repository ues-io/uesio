package wire

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func GetAvailableUsernames() ([]string, error) {

	// Get users
	users, err := Load("uesio/core.user", &LoadOptions{
		Fields: []adapt.LoadRequestField{{
			ID: "uesio/core.username",
		}},
		RequireWriteAccess: true,
	})
	if err != nil {
		return nil, err
	}

	options := []string{}
	for _, user := range users {
		username, err := user.GetFieldAsString("uesio/core.username")
		if err != nil {
			return nil, err
		}
		options = append(options, username)
	}

	return options, nil

}
