package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runAppBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return request.LoopInserts(func(change *wire.ChangeItem) error {
		user, err := change.GetField("uesio/studio.user")
		if err != nil {
			return err
		}

		if user == nil {
			// Use the owner if no user was provided
			user, err = change.GetField(commonfields.Owner)
			if err != nil {
				return err
			}
			err := change.SetField("uesio/studio.user", user)
			if err != nil {
				return err
			}
		}
		userKey, err := wire.GetFieldValueString(user, "uesio/core.uniquekey")
		if err != nil {
			return err
		}
		name, err := change.GetFieldAsString("uesio/studio.name")
		if err != nil {
			return err
		}
		return change.SetField("uesio/studio.fullname", userKey+"/"+name)

	})

}
