package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/metadata/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getCascadeDeletes(
	wires []adapters.SaveRequest,
	collections map[string]*adapters.CollectionMetadata,
	metadata *adapters.MetadataCache,
	adapter adapters.Adapter,
	credentials *adapters.Credentials,
) (map[string]map[string]adapters.DeleteRequest, error) {
	cascadeDeleteFKs := map[string]map[string]adapters.DeleteRequest{}

	for _, collectionMetadata := range collections {
		collectionKey := collectionMetadata.GetFullName()
		for _, field := range collectionMetadata.Fields {
			if field.Type == "REFERENCE" && field.OnDelete == "CASCADE" {
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
					if wire.Collection != collectionKey || len(wire.Deletes) == 0 {
						continue
					}

					ids := []string{}
					for _, deletion := range wire.Deletes {
						for _, primaryKeyValue := range deletion {
							ids = append(ids, primaryKeyValue.(string))
						}
					}

					if len(ids) == 0 {
						continue
					}

					collection := adapters.Collection{}
					err := adapter.Load([]adapters.LoadOp{
						{
							CollectionName: collectionKey,
							WireName:       "CascadeLoad",
							Collection:     &collection,
							Conditions: []adapters.LoadRequestCondition{
								{
									Field:    collectionMetadata.IDField,
									Operator: "IN",
									Value:    ids,
								},
							},
							Fields: []adapters.LoadRequestField{
								{
									ID: collectionMetadata.IDField,
								},
								{
									ID: field.ForeignKeyField,
								},
							},
						},
					}, metadata, credentials)
					if err != nil {
						return nil, err
					}

					err = collection.Loop(func(item loadable.Item) error {
						fkString, err := item.GetField(field.ForeignKeyField)
						if err != nil {
							return err
						}
						currentCollectionIds, ok := cascadeDeleteFKs[referencedCollection]
						if !ok {
							currentCollectionIds = map[string]adapters.DeleteRequest{}
							cascadeDeleteFKs[referencedCollection] = currentCollectionIds
						}
						currentCollectionIds[fkString.(string)] = adapters.DeleteRequest{
							referencedCollectionMetadata.IDField: fkString.(string),
						}
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

func performCascadeDeletes(deletes map[string]map[string]adapters.DeleteRequest, session *sess.Session) error {
	if len(deletes) == 0 {
		return nil
	}
	saves := []adapters.SaveRequest{}
	for collectionKey, ids := range deletes {

		saves = append(saves, adapters.SaveRequest{
			Collection: collectionKey,
			Wire:       "CascadeDelete",
			Deletes:    ids,
		})
	}

	_, err := Save(SaveRequestBatch{
		Wires: saves,
	}, session)
	if err != nil {
		return err
	}

	return nil
}
