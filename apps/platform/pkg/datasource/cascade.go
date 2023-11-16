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

	deleteIds := wire.Deletes.GetIDs()
	ufmcToDelete := &adapt.Collection{}
	op := &adapt.LoadOp{
		CollectionName: meta.USERFILEMETADATA_COLLECTION_NAME,
		Collection:     ufmcToDelete,
		WireName:       "deleteUserFiles",
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/core.recordid",
				Value:    deleteIds,
				Operator: "IN",
			},
		},
		Query:   true,
		LoadAll: true,
	}

	_, err := Load([]*adapt.LoadOp{op}, session, &LoadOptions{
		Connection: connection,
		Metadata:   GetConnectionMetadata(connection),
	})
	if err != nil {
		return nil, err
	}

	if ufmcToDelete.Len() > 0 {
		cascadeDeleteFKs[meta.USERFILEMETADATA_COLLECTION_NAME] = *ufmcToDelete
	}

	metadata := connection.GetMetadata()
	cascadeDeleteIdsByCollection := map[string]map[string]bool{}
	for _, collectionMetadata := range metadata.Collections {
		collectionKey := collectionMetadata.GetFullName()
		for _, field := range collectionMetadata.Fields {
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
					Query:  true,
					Params: wire.Params,
				}

				err := connection.Load(op, session)
				if err != nil {
					return nil, errors.New("Cascade delete error")
				}

				currentCollectionIds, ok := cascadeDeleteIdsByCollection[referencedCollection]
				if !ok {
					currentCollectionIds = map[string]bool{}
					cascadeDeleteIdsByCollection[referencedCollection] = currentCollectionIds
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

					currentCollectionIds[refRKAsString] = true

					return nil
				})

				if err != nil {
					return nil, err
				}

			}

		}
	}

	// Now that we've built a unique set of reference ids to cascade delete by Collection,
	// convert this to a map of collection names to adapt.Collection
	// so that we can more easily perform the deletes (elsewhere)
	if len(cascadeDeleteIdsByCollection) > 0 {
		for collectionName, idsMap := range cascadeDeleteIdsByCollection {
			numIds := len(idsMap)
			if numIds == 0 {
				continue
			}
			collectionItems := make(adapt.Collection, numIds)
			i := 0
			for id := range idsMap {
				collectionItems[i] = &adapt.Item{
					adapt.ID_FIELD: id,
				}
				i++
			}
			cascadeDeleteFKs[collectionName] = collectionItems
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
