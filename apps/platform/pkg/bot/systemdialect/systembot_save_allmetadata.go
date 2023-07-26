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

	collectionKey := group.GetName()

	err = datasource.GetFullMetadataForCollection(connection.GetMetadata(), collectionKey, session)
	if err != nil {
		return err
	}

	collectionMetadata, err := connection.GetMetadata().GetCollection(collectionKey)
	if err != nil {
		return err
	}

	op.Metadata = collectionMetadata

	err = op.LoopChanges(func(change *adapt.ChangeItem) error {
		change.Metadata = collectionMetadata
		return nil
	})
	if err != nil {
		return err
	}

	err = op.LoopDeletes(func(change *adapt.ChangeItem) error {
		change.Metadata = collectionMetadata
		return nil
	})
	if err != nil {
		return err
	}

	return datasource.SaveOp([]*adapt.SaveOp{
		op,
	}, connection, session)

}
