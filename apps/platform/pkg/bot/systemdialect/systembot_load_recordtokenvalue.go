package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRecordTokenValueLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	recordIDCondition := extractConditionByField(op.Conditions, "uesio/studio.recordid")
	if recordIDCondition == nil {
		return errors.New("must provide record id condition")
	}

	recordID := recordIDCondition.Value.(string)

	inContextSession, err := getContextSessionFromParams(op.Params, connection, session)
	if err != nil {
		return err
	}
	tokens, err := connection.GetRecordAccessTokens(recordID, inContextSession)
	if err != nil {
		return err
	}

	for _, token := range tokens {

		item := op.Collection.NewItem()
		item.SetField("uesio/studio.recordid", recordID)
		item.SetField("uesio/studio.token", token)
		op.Collection.AddItem(item)

	}

	return nil

}
