package systemdialect

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	if len(request.Deletes) > 0 {
		if err := preventSystemGuestUserDeletion(request); err != nil {
			return err
		}
	}
	return clearUserCache(request, connection, session)
}

func clearUserCache(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	keys := []string{}
	for _, id := range getIDsFromUpdatesAndDeletes(request) {
		keys = append(keys, cache.GetUserKey(id, session.GetContextSite().GetAppFullName()))
	}
	return cache.DeleteKeys(keys)
}

func preventSystemGuestUserDeletion(request *adapt.SaveOp) error {
	for _, uniquekey := range getUniqueKeysFromDeletes(request) {
		if uniquekey == "system" || uniquekey == "guest" {
			return errors.New(fmt.Sprintf("user %s can't be deleted", uniquekey))
		}
	}
	return nil
}
