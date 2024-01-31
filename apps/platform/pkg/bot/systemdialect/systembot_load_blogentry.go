package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runBlogEntryLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	site, err := auth.GetSiteFromHost(env.GetPrimaryDomain())
	if err != nil {
		//Ignore the errors if the site is not found
		return nil
	}
	return getArticleLoad(op, connection, sess.GetAnonSession(session.Context(), site), "uesio/studio.blogentry")
}
