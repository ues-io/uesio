package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runAppBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return request.LoopInserts(func(change *adapt.ChangeItem) error {
		user, err := change.GetField("uesio/studio.user")
		if err != nil {
			return err
		}

		if user == nil {
			// Use the owner if no user was provided
			user, err = change.GetField("uesio/core.owner")
			if err != nil {
				return err
			}
			err := change.SetField("uesio/studio.user", user)
			if err != nil {
				return err
			}
		}
		userKey, err := adapt.GetFieldValue(user, "uesio/core.uniquekey")
		if err != nil {
			return err
		}
		userKeyString, ok := userKey.(string)
		if !ok {
			return errors.New("Invalid user Key string")
		}
		name, err := change.GetFieldAsString("uesio/studio.name")
		if err != nil {
			return err
		}
		return change.SetField("uesio/studio.fullname", userKeyString+"/"+name)

	})

}
