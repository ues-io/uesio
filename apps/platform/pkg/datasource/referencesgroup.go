package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func loadData(op *wire.LoadOp, connection wire.Connection, session *sess.Session, index int) error {

	if index == adapt.MAX_ITER_REF_GROUP {
		return errors.New("You have reached the maximum limit of Reference Group")
	}

	err := connection.Load(op, session)
	if err != nil {
		return err
	}

	if !op.HasMoreBatches {
		return nil
	}

	return loadData(op, connection, session, index+1)
}

func HandleReferencesGroup(
	connection wire.Connection,
	collection meta.Group,
	referencedGroupCollections wire.ReferenceGroupRegistry,
	session *sess.Session,
) error {
	ops := []*wire.LoadOp{}
	for refKey, ref := range referencedGroupCollections {
		idCount := collection.Len()
		if idCount == 0 {
			continue
		}

		ids := make([]string, idCount)
		fieldIDIndex := 0

		err := collection.Loop(func(item meta.Item, index string) error {
			idValue, err := item.GetField(commonfields.Id)
			if err != nil {
				return err
			}

			idValueAsString, ok := idValue.(string)
			if !ok {
				return err
			}

			ids[fieldIDIndex] = idValueAsString
			fieldIDIndex++
			return nil
		})

		if err != nil {
			return err
		}

		ref.AddFields([]wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
			{
				ID: ref.Field.ReferenceGroupMetadata.Field,
			},
		})

		ops = append(ops, &wire.LoadOp{
			Fields:         ref.Fields,
			WireName:       refKey,
			Collection:     &wire.Collection{},
			CollectionName: ref.Field.ReferenceGroupMetadata.Collection,
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    ref.Field.ReferenceGroupMetadata.Field,
					Operator: "IN",
					Value:    ids,
				},
			},
			Query: true,
		})
	}

	if len(ops) == 0 {
		return nil
	}

	for _, op := range ops {
		err := loadData(op, connection, session, 0)
		if err != nil {
			return err
		}
	}

	for i := range ops {
		op := ops[i]

		referencedCollection := referencedGroupCollections[op.WireName]
		collatedMap := map[string][]meta.Item{}

		err := op.Collection.Loop(func(refItem meta.Item, _ string) error {

			refRK, err := refItem.GetField(referencedCollection.Field.ReferenceGroupMetadata.Field)
			if err != nil {
				return err
			}

			refRKAsString, err := wire.GetReferenceKey(refRK)
			if err != nil {
				return err
			}

			_, ok := collatedMap[refRKAsString]
			if !ok {
				collatedMap[refRKAsString] = []meta.Item{}
			}

			collatedMap[refRKAsString] = append(collatedMap[refRKAsString], refItem)

			return nil
		})

		if err != nil {
			return err
		}

		err = collection.Loop(func(item meta.Item, index string) error {

			id, err := item.GetField(commonfields.Id)
			if err != nil {
				return err
			}

			idAsString, ok := id.(string)
			if !ok {
				return err
			}

			if idAsString == "" {
				return nil
			}

			items, ok := collatedMap[idAsString]
			if !ok {
				return nil
			}

			err = item.SetField(referencedCollection.Field.GetFullName(), items)
			if err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			return err
		}
	}

	return nil
}
