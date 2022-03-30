package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return fieldCheck(request, connection, session)
}

func isValidField(change adapt.ChangeItem) error {
	ftype, err := change.GetField("uesio/studio.type")
	if err != nil {
		return errors.New("Field: Type is required")
	}
	if ftype == "REFERENCE" {
		referencedCollection, _ := change.GetField("uesio/studio.reference")
		if referencedCollection == nil {
			return errors.New("Field: Referenced Collection is required")
		}
	}
	return nil
}

func fieldCheck(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	for i := range *request.Inserts {
		err := isValidField((*request.Inserts)[i])
		if err != nil {
			return err
		}
	}
	for i := range *request.Updates {
		err := isValidField((*request.Updates)[i])
		if err != nil {
			return err
		}
	}
	return nil
}
