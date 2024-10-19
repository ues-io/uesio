package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ResetRecordTokens(collection string, session *sess.Session) error {
	return WithTransaction(session.RemoveWorkspaceContext(), nil, func(conn wire.Connection) error {
		return resetTokenBatches(&wire.LoadOp{
			CollectionName: collection,
			Collection:     &wire.Collection{},
			Query:          true,
			BatchSize:      adapt.MAX_SAVE_BATCH_SIZE,
			Fields: []wire.LoadRequestField{
				{
					ID: commonfields.Id,
				},
			},
		}, GetSiteAdminSession(session))
	})
}

func resetTokenBatches(loadOp *wire.LoadOp, session *sess.Session) error {

	for {
		_, err := Load([]*wire.LoadOp{loadOp}, session, nil)
		if err != nil {
			return err
		}

		err = Save([]SaveRequest{
			{
				Collection: loadOp.CollectionName,
				Changes:    loadOp.Collection,
			},
		}, session)
		if err != nil {
			return err
		}

		if !loadOp.HasMoreBatches {
			break
		}
	}
	return nil
}
