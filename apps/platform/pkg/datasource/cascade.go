package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getCascadeDeletes(
	wires []*adapt.SaveOp,
	metadata *adapt.MetadataCache,
	loader adapt.Loader,
) (map[string]adapt.Collection, error) {
	cascadeDeleteFKs := map[string]adapt.Collection{}

	for _, collectionMetadata := range metadata.Collections {
		collectionKey := collectionMetadata.GetFullName()
		for _, field := range collectionMetadata.Fields {
			if field.Type == "FILE" {
				referenceMetadata := field.ReferenceMetadata

				// This is kind of a weird cascaded delete where we delete the parent
				// if the child is deleted. This is not typical. Usually it's the
				// other way around, but we're offering this feature because we
				// need it ourselves for userfiles.
				referencedCollection := referenceMetadata.Collection

				referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
				if err != nil {
					return nil, err
				}

				// Get the ids that we need to delete
				for _, wire := range wires {
					if wire.CollectionName != collectionKey || len(*wire.Deletes) == 0 {
						continue
					}
					for _, deletion := range *wire.Deletes {
						item := deletion.OldValues
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

						refKey, err := refItem.GetField(referencedCollectionMetadata.IDField)
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

						currentCollectionIds = append(currentCollectionIds, adapt.Item{
							referencedCollectionMetadata.IDField: fkString,
						})
						cascadeDeleteFKs[referencedCollection] = currentCollectionIds
					}
				}
			}

			//GET all the contact id's related with my Account and do a new save

			if field.Type == "REFERENCEGROUP" {
				referenceGroupMetadata := field.ReferenceGroupMetadata
				if referenceGroupMetadata.OnDelete != "CASCADE" {
					continue
				}

				referencedCollection := referenceGroupMetadata.Collection
				referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
				if err != nil {
					return nil, err
				}

				// Get the ids that we need to delete
				for _, wire := range wires {
					if wire.CollectionName != collectionKey || len(*wire.Deletes) == 0 {
						continue
					}
					for _, deletion := range *wire.Deletes {

						item := deletion.OldValues
						refInterface, err := item.GetField(collectionMetadata.IDField)
						if err != nil {
							continue
						}

						if refInterface == nil {
							continue
						}

						fkString, ok := refInterface.(string)
						if !ok {
							return nil, errors.New("Delete id must be a string")
						}

						fields := []adapt.LoadRequestField{{ID: referencedCollectionMetadata.IDField}}

						op := &adapt.LoadOp{
							CollectionName: referenceGroupMetadata.Collection,
							WireName:       "CascadeDelete",
							Fields:         fields,
							Collection:     &adapt.Collection{},
							Conditions: []adapt.LoadRequestCondition{
								{
									Field:    referenceGroupMetadata.Field,
									Value:    fkString,
									Operator: "=",
								},
							},
							Query: true,
						}

						err = loader([]*adapt.LoadOp{op})
						if err != nil {
							return nil, errors.New("Cascade delete error")
						}

						currentCollectionIds, ok := cascadeDeleteFKs[referencedCollection]
						if !ok {
							currentCollectionIds = adapt.Collection{}
						}

						err = op.Collection.Loop(func(refItem loadable.Item, _ interface{}) error {

							refRK, err := refItem.GetField(referencedCollectionMetadata.IDField)
							if err != nil {
								return err
							}

							refRKAsString, ok := refRK.(string)
							if !ok {
								return errors.New("Delete id must be a string")
							}

							currentCollectionIds = append(currentCollectionIds, adapt.Item{
								referencedCollectionMetadata.IDField: refRKAsString,
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

		}
	}
	return cascadeDeleteFKs, nil
}

func performCascadeDeletes(batch []*adapt.SaveOp, metadata *adapt.MetadataCache, loader adapt.Loader, session *sess.Session) error {
	deletes, err := getCascadeDeletes(batch, metadata, loader)
	if err != nil {
		return err
	}

	if len(deletes) == 0 {
		return nil
	}
	saves := []SaveRequest{}
	for collectionKey, ids := range deletes {
		saves = append(saves, SaveRequest{
			Collection: collectionKey,
			Wire:       "CascadeDelete",
			Deletes:    &ids,
		})
	}

	return Save(saves, session)
}
