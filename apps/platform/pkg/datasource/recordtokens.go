package datasource

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ResetRecordTokens(ctx context.Context, collection string, session *sess.Session) error {
	return WithTransaction(ctx, session.RemoveWorkspaceContext(), nil, func(conn wire.Connection) error {
		return resetTokenBatches(ctx, &wire.LoadOp{
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

func resetTokenBatches(ctx context.Context, loadOp *wire.LoadOp, session *sess.Session) error {

	for {
		err := LoadWithError(ctx, loadOp, session, nil)
		if err != nil {
			return err
		}

		err = Save(ctx, []SaveRequest{
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
