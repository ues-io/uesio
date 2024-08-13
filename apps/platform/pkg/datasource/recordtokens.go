package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ResetRecordTokens(collection string, session *sess.Session) error {

	loadOp := &wire.LoadOp{
		CollectionName: collection,
		Collection:     &wire.Collection{},
		Query:          true,
		BatchSize:      adapt.MAX_SAVE_BATCH_SIZE,
		Fields: []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
		},
	}

	connection, err := GetPlatformConnection(nil, session.RemoveWorkspaceContext(), nil)
	if err != nil {
		return err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return err
	}

	err = resetTokenBatches(loadOp, GetSiteAdminSession(session))
	if err != nil {
		rollbackError := connection.RollbackTransaction()
		if rollbackError != nil {
			return rollbackError
		}
		return err
	}

	err = connection.CommitTransaction()
	if err != nil {
		return err
	}

	return nil
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
