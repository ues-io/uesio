package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func EvalFormulaFields(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {

	formulaPopulations := adapt.GetFormulaFunction(collectionMetadata.Fields)
	return op.LoopChanges(func(change *adapt.ChangeItem) error {
		return formulaPopulations(change)
	})

}
