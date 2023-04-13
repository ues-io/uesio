package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	// Make sure that all users are their own owner.
	return request.LoopChanges(func(change *adapt.ChangeItem) error {
		usertype, err := change.GetFieldAsString("uesio/core.type")
		if err != nil {
			return err
		}
		// Don't change the owner for orgs.
		if usertype == "ORG" {
			return nil
		}
		username, err := change.GetFieldAsString("uesio/core.username")
		if err != nil {
			return err
		}
		return change.SetField(adapt.OWNER_FIELD, &meta.User{
			BuiltIn: meta.BuiltIn{
				UniqueKey: username,
			},
		})
	})

}
