package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runAllMetadataSaveBot(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	typeCondition, _, _, _, err := extractConditions(op.Conditions)
	if err != nil {
		return err
	}

	metadataType := typeCondition.Value.(string)

	group, err := meta.GetBundleableGroupFromType(metadataType)
	if err != nil {
		return errors.New("invalid metadata type provided for type condition")
	}

	changes := &adapt.Collection{}
	deletes := &adapt.Collection{}

	err = op.LoopChanges(func(change *adapt.ChangeItem) error {
		return changes.AddItem(change.FieldChanges)
	})
	if err != nil {
		return err
	}

	err = op.LoopInserts(func(change *adapt.ChangeItem) error {
		return changes.AddItem(change.FieldChanges)
	})
	if err != nil {
		return err
	}

	err = op.LoopDeletes(func(change *adapt.ChangeItem) error {
		return deletes.AddItem(change.FieldChanges)
	})
	if err != nil {
		return err
	}

	return datasource.SaveWithOptions([]datasource.SaveRequest{{
		Collection: group.GetName(),
		Wire:       op.WireName,
		Changes:    changes,
		Deletes:    deletes,
	}}, session, &datasource.SaveOptions{
		Metadata:   connection.GetMetadata(),
		Connection: connection,
	})

}
