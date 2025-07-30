package systemdialect

import (
	"context"
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runRecordTokenValueLoadBot(ctx context.Context, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	recordIDCondition := extractConditionByField(op.Conditions, "uesio/studio.recordid")
	if recordIDCondition == nil {
		return errors.New("must provide record id condition")
	}

	recordID := recordIDCondition.Value.(string)

	inContextSession, err := datasource.GetContextSessionFromParams(ctx, op.Params, connection, session)
	if err != nil {
		return err
	}
	// intentionally using session context and not inContextSession since session is what owns the processing
	// context. The context in both session and inContextSession should be the same but session owns it
	tokens, err := connection.GetRecordAccessTokens(ctx, recordID, inContextSession)
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
