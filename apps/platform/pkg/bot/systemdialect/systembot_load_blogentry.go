package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runBlogEntryLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {
	site, err := auth.GetSiteFromHost(session.GetSite().Domain)
	if err != nil {
		//Ignore the errors if the site is not found
		return nil
	}
	return getArticleLoad(op, connection, sess.GetAnonSession(site), "uesio/studio.blogentry")
}
