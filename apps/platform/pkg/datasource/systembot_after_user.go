package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return clearUserCache(request, connection, session)
}

func clearUserCache(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	keys := []string{}
	for _, id := range getIDsFromUpdatesAndDeletes(request) {
		keys = append(keys, cache.GetUserKey(id, session.GetSite().GetAppFullName()))
	}
	return cache.DeleteKeys(keys)
}
