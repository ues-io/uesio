package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getCascadeDeletes(
	wires []adapt.SaveOp,
	collections map[string]*adapt.CollectionMetadata,
	metadata *adapt.MetadataCache,
	adapter adapt.Adapter,
	credentials *adapt.Credentials,
) (map[string]adapt.Collection, error) {
	cascadeDeleteFKs := map[string]adapt.Collection{}

	for _, collectionMetadata := range collections {
		collectionKey := collectionMetadata.GetFullName()
		for _, field := range collectionMetadata.Fields {
			if adapt.IsReference(field.Type) && field.OnDelete == "CASCADE" {
				// This is kind of a weird cascaded delete where we delete the parent
				// if the child is deleted. This is not typical. Usually it's the
				// other way around, but we're offering this feature because we
				// need it ourselves for userfiles.
				referencedCollection := field.ReferencedCollection

				referencedCollectionMetadata, err := metadata.GetCollection(referencedCollection)
				if err != nil {
					return nil, err
				}

				// Get the ids that we need to delete
				for _, wire := range wires {
					if wire.CollectionName != collectionKey || len(*wire.Deletes) == 0 {
						continue
					}

					ids := []string{}
					for _, deletion := range *wire.Deletes {

						idField, err := collectionMetadata.GetIDField()
						if err != nil {
							return nil, err
						}

						idValue, err := deletion.FieldChanges.GetField(idField.GetFullName())
						if err != nil {
							return nil, err
						}
						ids = append(ids, idValue.(string))
					}

					if len(ids) == 0 {
						continue
					}

					collection := adapt.Collection{}
					err := adapter.Load([]adapt.LoadOp{
						{
							CollectionName: collectionKey,
							WireName:       "CascadeLoad",
							Collection:     &collection,
							Conditions: []adapt.LoadRequestCondition{
								{
									Field:    collectionMetadata.IDField,
									Operator: "IN",
									Value:    ids,
								},
							},
							Fields: []adapt.LoadRequestField{
								{
									ID: collectionMetadata.IDField,
								},
								{
									ID: field.GetFullName(),
								},
							},
						},
					}, metadata, credentials)
					if err != nil {
						return nil, err
					}

					err = collection.Loop(func(item loadable.Item, _ interface{}) error {
						refInterface, err := item.GetField(field.GetFullName())
						if err != nil {
							return nil
						}

						if refInterface == nil {
							return nil
						}

						refItem, ok := refInterface.(adapt.Item)
						if !ok {
							return nil
						}

						refKey, err := refItem.GetField(referencedCollectionMetadata.IDField)
						if err != nil {
							return err
						}

						fkString, ok := refKey.(string)
						if !ok {
							return errors.New("Delete id must be a string")
						}
						currentCollectionIds, ok := cascadeDeleteFKs[referencedCollection]
						if !ok {
							currentCollectionIds = adapt.Collection{}
						}

						currentCollectionIds = append(currentCollectionIds, adapt.Item{
							referencedCollectionMetadata.IDField: fkString,
						})
						cascadeDeleteFKs[referencedCollection] = currentCollectionIds

						return nil
					})
					if err != nil {
						return nil, err
					}
				}
			}
		}
	}
	return cascadeDeleteFKs, nil
}

func performCascadeDeletes(deletes map[string]adapt.Collection, session *sess.Session) error {
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
