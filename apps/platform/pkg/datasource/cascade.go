package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getCascadeDeletes(
	wire *adapt.SaveOp,
	connection adapt.Connection,
	session *sess.Session,
) (map[string]adapt.Collection, error) {
	cascadeDeleteFKs := map[string]adapt.Collection{}

	if len(wire.Deletes) == 0 {
		return cascadeDeleteFKs, nil
	}

	metadata := connection.GetMetadata()

	for _, collectionMetadata := range metadata.GetCollectionsMap() {
		collectionKey := collectionMetadata.GetFullName()
		for _, field := range collectionMetadata.Fields {
			if field.Type == "FILE" {
				referenceMetadata := field.ReferenceMetadata

				// This is kind of a weird cascaded delete where we delete the parent
				// if the child is deleted. This is not typical. Usually it's the
				// other way around, but we're offering this feature because we
				// need it ourselves for userfile.
				referencedCollection := referenceMetadata.Collection

				// Get the ids that we need to delete

				if wire.Metadata.GetFullName() != collectionKey || len(wire.Deletes) == 0 {
					continue
				}
				for _, deletion := range wire.Deletes {
					item := deletion.OldValues
					if item == nil {
						continue
					}
					refInterface, err := item.GetField(field.GetFullName())
					if err != nil {
						continue
					}

					if refInterface == nil {
						continue
					}

					refItem, ok := refInterface.(adapt.Item)
					if !ok {
						continue
					}

					refKey, err := refItem.GetField(adapt.ID_FIELD)
					if err != nil {
						continue
					}

					fkString, ok := refKey.(string)
					if !ok {
						return nil, errors.New("Delete id must be a string")
					}
					currentCollectionIds, ok := cascadeDeleteFKs[referencedCollection]
					if !ok {
						currentCollectionIds = adapt.Collection{}
					}

					currentCollectionIds = append(currentCollectionIds, &adapt.Item{
						adapt.ID_FIELD: fkString,
					})
					cascadeDeleteFKs[referencedCollection] = currentCollectionIds
				}
			}

			if field.Type == "REFERENCEGROUP" {
				referenceGroupMetadata := field.ReferenceGroupMetadata
				if referenceGroupMetadata.OnDelete != "CASCADE" {
					continue
				}

				referencedCollection := referenceGroupMetadata.Collection

				if wire.Metadata.GetFullName() != collectionKey || len(wire.Deletes) == 0 {
					continue
				}

				ids := []string{}
				for _, deletion := range wire.Deletes {
					ids = append(ids, deletion.IDValue)
				}

				fields := []adapt.LoadRequestField{{ID: adapt.ID_FIELD}}
				op := &adapt.LoadOp{
					CollectionName: referenceGroupMetadata.Collection,
					WireName:       "CascadeDelete",
					Fields:         fields,
					Collection:     &adapt.Collection{},
					Conditions: []adapt.LoadRequestCondition{
						{
							Field:    referenceGroupMetadata.Field,
							Value:    ids,
							Operator: "IN",
						},
					},
					Query:           true,
					Params:          wire.Params,
					ServerInitiated: true,
				}

				err := connection.Load(op, session)
				if err != nil {
					return nil, errors.New("Cascade delete error")
				}

				currentCollectionIds, ok := cascadeDeleteFKs[referencedCollection]
				if !ok {
					currentCollectionIds = adapt.Collection{}
				}

				err = op.Collection.Loop(func(refItem meta.Item, _ string) error {

					refRK, err := refItem.GetField(adapt.ID_FIELD)
					if err != nil {
						return err
					}

					refRKAsString, ok := refRK.(string)
					if !ok {
						return errors.New("Delete id must be a string")
					}

					currentCollectionIds = append(currentCollectionIds, &adapt.Item{
						adapt.ID_FIELD: refRKAsString,
					})

					return nil
				})

				if err != nil {
					return nil, err
				}

				cascadeDeleteFKs[referencedCollection] = currentCollectionIds

			}

		}
	}
	return cascadeDeleteFKs, nil
}

func performCascadeDeletes(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	deletes, err := getCascadeDeletes(op, connection, session)
	if err != nil {
		return err
	}

	if len(deletes) == 0 {
		return nil
	}
	saves := []SaveRequest{}
	for collectionKey := range deletes {
		ids := deletes[collectionKey]
		if ids.Len() > 0 {
			saves = append(saves, SaveRequest{
				Collection: collectionKey,
				Wire:       "CascadeDelete",
				Deletes:    &ids,
				Options: &adapt.SaveOptions{
					IgnoreMissingRecords: true,
				},
				Params: op.Params,
			})
		}
	}
	return SaveWithOptions(saves, session, GetConnectionSaveOptions(connection))
}
