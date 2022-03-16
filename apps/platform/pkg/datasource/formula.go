package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func EvalFormulaFields(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {

	formulaPopulations := adapt.GetFormulaFunction(collectionMetadata.Fields)

	if op.Inserts != nil {
		for i := range *op.Inserts {
			err := formulaPopulations(&(*op.Inserts)[i])
			if err != nil {
				return err
			}
		}
	}

	if op.Updates != nil {
		for i := range *op.Updates {
			err := formulaPopulations(&(*op.Updates)[i])
			if err != nil {
				return err
			}
		}
	}

	return nil
}
