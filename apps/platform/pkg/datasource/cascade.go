package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getCascadeDeletes(
	wires []adapt.SaveOp,
	metadata *adapt.MetadataCache,
) (map[string]adapt.Collection, error) {
	cascadeDeleteFKs := map[string]adapt.Collection{}

	for _, collectionMetadata := range metadata.Collections {
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
		}
	}
	return cascadeDeleteFKs, nil
}

func performCascadeDeletes(batch []adapt.SaveOp, metadata *adapt.MetadataCache, session *sess.Session) error {
	deletes, err := getCascadeDeletes(batch, metadata)
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
