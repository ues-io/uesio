package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runRecordTokenValueLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	recordIDCondition := extractConditionByField(op.Conditions, "uesio/studio.recordid")
	if recordIDCondition == nil {
		return errors.New("must provide record id condition")
	}

	recordID := recordIDCondition.Value.(string)

	inContextSession, err := datasource.GetContextSessionFromParams(op.Params, connection, session)
	if err != nil {
		return err
	}
	tokens, err := connection.GetRecordAccessTokens(recordID, inContextSession)
	if err != nil {
		return err
	}

	for _, token := range tokens {

		tokenParts := strings.Split(token, ":")

		item := op.Collection.NewItem()
		item.SetField("uesio/studio.recordid", recordID)
		item.SetField("uesio/studio.token", token)
		item.SetField("uesio/studio.tokentype", tokenParts[0])
		item.SetField("uesio/studio.relatedrecordid", tokenParts[1])
		op.Collection.AddItem(item)

	}

	return nil

}
