package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runDomainAfterSaveSiteBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return clearHostCacheForDomain(request, connection, session)
}

func clearHostCacheForDomain(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return clearHostForDomains(getUniqueKeysFromUpdatesAndDeletes(request))
}
