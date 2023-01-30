package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserFileAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	// Whenever a user file is updated,
	// if the file is the User's profile, we need to invalidate the User cache in Redis

	appFullName := session.GetSite().GetAppFullName()

	userKeysToDelete := []string{}

	for _, insert := range request.Inserts {
		relatedCollection, err := insert.GetField("uesio/core.collectionid")
		if err != nil {
			continue
		}
		relatedField, err := insert.GetField("uesio/core.fieldid")
		if err != nil {
			continue
		}
		relatedRecord, err := insert.GetField("uesio/core.recordid")
		if err != nil {
			continue
		}
		if (relatedCollection == "uesio/core.user") &&
			(relatedField == "uesio/core.picture") {
			userKeysToDelete = append(userKeysToDelete, cache.GetUserKey(relatedRecord.(string), appFullName))
		}
	}

	for _, deleteItem := range request.Deletes {
		relatedCollection, err := deleteItem.OldValues.GetField("uesio/core.collectionid")
		if err != nil {
			continue
		}
		relatedField, err := deleteItem.OldValues.GetField("uesio/core.fieldid")
		if err != nil {
			continue
		}
		relatedRecord, err := deleteItem.OldValues.GetField("uesio/core.recordid")
		if err != nil {
			continue
		}
		if (relatedCollection == "uesio/core.user") &&
			(relatedField == "uesio/core.picture") {
			userKeysToDelete = append(userKeysToDelete, cache.GetUserKey(relatedRecord.(string), appFullName))
		}
	}
	return cache.DeleteKeys(userKeysToDelete)
}
