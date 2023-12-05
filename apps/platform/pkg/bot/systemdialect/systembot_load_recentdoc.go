package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getArticleLoad(op *wire.LoadOp, connection wire.Connection, session *sess.Session, collectionName string) error {
	metadata, err := datasource.Load([]*wire.LoadOp{{
		CollectionName: "uesio/cms.article",
		WireName:       op.WireName,
		View:           op.View,
		Collection:     op.Collection,
		Conditions:     op.Conditions,
		BatchSize:      op.BatchSize,
		Fields: []wire.LoadRequestField{
			{
				ID: "uesio/cms.name",
			},
			{
				ID: "uesio/cms.description",
			},
			{
				ID: "uesio/cms.content",
			},
			{
				ID: "uesio/cms.date",
			},
			{
				ID: "uesio/cms.slug",
			},
		},
		Query: true,
	}}, session, &datasource.LoadOptions{})
	if err != nil {
		return err
	}

	originalCollectionMetadata, err := metadata.GetCollection("uesio/cms.article")
	if err != nil {
		return err
	}

	dynamicCollectionMetadata, err := connection.GetMetadata().GetCollection(collectionName)
	if err != nil {
		return err
	}

	err = meta.Copy(dynamicCollectionMetadata, originalCollectionMetadata)
	if err != nil {
		return err
	}

	namespace, name, err := meta.ParseKey(collectionName)
	if err != nil {
		return err
	}
	dynamicCollectionMetadata.Name = name
	dynamicCollectionMetadata.Namespace = namespace

	return nil
}

func runRecentDocLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	site, err := auth.GetSiteFromHost("docs." + session.GetSite().Domain)
	if err != nil {
		//Ignore the errors if the site is not found
		return nil
	}
	return getArticleLoad(op, connection, sess.GetAnonSession(site), "uesio/studio.recentdoc")
}
