package systemdialect

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runUserAfterSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
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
		keys = append(keys, auth.GetUserCacheKey(id, session.GetContextSite()))
	}
	return auth.DeleteUserCacheEntries(keys...)
}

func preventSystemGuestUserDeletion(request *wire.SaveOp) error {
	for _, uniquekey := range getUniqueKeysFromDeletes(request) {
		if uniquekey == meta.SystemUsername || uniquekey == meta.PublicUsername {
			return fmt.Errorf("user %s can't be deleted", uniquekey)
		}
	}
	return nil
}
