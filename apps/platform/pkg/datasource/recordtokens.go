package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func ResetRecordTokens(collection string, session *sess.Session) error {

	loadOp := &adapt.LoadOp{
		CollectionName: collection,
		Collection:     &adapt.Collection{},
		Query:          true,
		BatchSize:      adapt.MAX_SAVE_BATCH_SIZE,
		Fields: []adapt.LoadRequestField{
			{
				ID: adapt.ID_FIELD,
			},
		},
		ServerInitiated: true,
	}

	connection, err := GetPlatformConnection(nil, session.RemoveWorkspaceContext(), nil)
	if err != nil {
		return err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return err
	}

	err = resetTokenBatches(loadOp, connection, GetSiteAdminSession(session))
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

func resetTokenBatches(loadOp *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	for {
		_, err := Load([]*adapt.LoadOp{loadOp}, session, nil)
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
