package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type ReferenceGroupRequest struct {
	Fields    []LoadRequestField
	FieldsMap map[string]bool
	Metadata  *CollectionMetadata
	Field     *FieldMetadata
}

type ReferenceGroupRegistry map[string]*ReferenceGroupRequest

func (rr *ReferenceGroupRequest) AddFields(fields []LoadRequestField) {
	for _, field := range fields {
		_, ok := rr.FieldsMap[field.ID]
		if !ok {
			rr.Fields = append(rr.Fields, field)
			rr.FieldsMap[field.ID] = true
		}
	}
}

func (rr *ReferenceGroupRegistry) Add(collectionKey string, fieldMetadata *FieldMetadata, collectionMetadata *CollectionMetadata) *ReferenceGroupRequest {

	rgr := &ReferenceGroupRequest{
		Field:     fieldMetadata,
		Fields:    []LoadRequestField{},
		FieldsMap: map[string]bool{},
		Metadata:  collectionMetadata,
	}

	(*rr)[collectionKey+":"+fieldMetadata.GetFullName()] = rgr

	return rgr
}

func loadData(op *LoadOp, connection Connection, session *sess.Session, index int) error {

	if index == MAX_ITER_REF_GROUP {
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
	connection Connection,
	collection loadable.Group,
	referencedGroupCollections ReferenceGroupRegistry,
	session *sess.Session,
) error {
	ops := []*LoadOp{}
	for refKey, ref := range referencedGroupCollections {
		idCount := collection.Len()
		if idCount == 0 {
			continue
		}

		ids := make([]string, idCount)
		fieldIDIndex := 0

		err := collection.Loop(func(item loadable.Item, index string) error {
			idValue, err := item.GetField(ID_FIELD)
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

		ref.AddFields([]LoadRequestField{
			{
				ID: ID_FIELD,
			},
			{
				ID: ref.Field.ReferenceGroupMetadata.Field,
			},
		})

		ops = append(ops, &LoadOp{
			Fields:         ref.Fields,
			WireName:       refKey,
			Collection:     &Collection{},
			CollectionName: ref.Field.ReferenceGroupMetadata.Collection,
			Conditions: []LoadRequestCondition{
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
		collatedMap := map[string][]loadable.Item{}

		err := op.Collection.Loop(func(refItem loadable.Item, _ string) error {

			refRK, err := refItem.GetField(referencedCollection.Field.ReferenceGroupMetadata.Field)
			if err != nil {
				return err
			}

			refRKAsString, err := GetReferenceKey(refRK)
			if err != nil {
				return err
			}

			_, ok := collatedMap[refRKAsString]
			if !ok {
				collatedMap[refRKAsString] = []loadable.Item{}
			}

			collatedMap[refRKAsString] = append(collatedMap[refRKAsString], refItem)

			return nil
		})

		if err != nil {
			return err
		}

		err = collection.Loop(func(item loadable.Item, index string) error {

			id, err := item.GetField(ID_FIELD)
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
