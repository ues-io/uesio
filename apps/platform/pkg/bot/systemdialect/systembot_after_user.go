package systemdialect

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runUserAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	if len(request.Deletes) > 0 {
		if err := preventSystemGuestUserDeletion(request); err != nil {
			return err
		}
	}
	return clearUserCache(request, connection, session)
}

func clearUserCache(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	keys := []string{}
	for _, id := range getIDsFromUpdatesAndDeletes(request) {
		keys = append(keys, auth.GetUserCacheKey(id, session.GetContextSite().GetAppFullName()))
	}
	return auth.DeleteUserCacheEntries(keys...)
}

func preventSystemGuestUserDeletion(request *wire.SaveOp) error {
	for _, uniquekey := range getUniqueKeysFromDeletes(request) {
		if uniquekey == "system" || uniquekey == "guest" {
			return errors.New(fmt.Sprintf("user %s can't be deleted", uniquekey))
		}
	}
	return nil
}
