package datasource

import (
	"fmt"
	"maps"
	"slices"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getCascadeDeletes(
	op *wire.SaveOp,
	connection wire.Connection,
	session *sess.Session,
) (map[string]wire.Collection, error) {

	cascadeDeleteFKs := map[string]wire.Collection{}

	if len(op.Deletes) == 0 {
		return cascadeDeleteFKs, nil
	}

	deleteIds := op.Deletes.GetIDs()

	metadata, err := op.GetMetadata()
	if err != nil {
		return nil, err
	}
	cascadeDeleteIdsByCollection := map[string]map[string]*wire.Item{}

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return nil, err
	}

	for _, field := range collectionMetadata.Fields {
		if field.Type != "REFERENCEGROUP" {
			continue
		}

		referenceGroupMetadata := field.ReferenceGroupMetadata
		if referenceGroupMetadata.OnDelete != "CASCADE" {
			continue
		}

		referencedCollection := referenceGroupMetadata.Collection

		idLoadCollection := wire.Collection{}

		idLoadOp := &wire.LoadOp{
			CollectionName: referencedCollection,
			WireName:       "CascadeDeleteIdLoad_" + referencedCollection,
			Fields:         []wire.LoadRequestField{{ID: commonfields.Id}},
			Collection:     &idLoadCollection,
			Conditions: []wire.LoadRequestCondition{
				{
					Field:    referenceGroupMetadata.Field,
					Value:    deleteIds,
					Operator: "IN",
				},
			},
			Query:  true,
			Params: op.Params,
		}

		versionSession, err := EnterVersionContext(field.Namespace, session, nil)
		if err != nil {
			return nil, err
		}

		// Check for metadata, if it does not exist, go get it.
		_, err = metadata.GetCollection(referencedCollection)
		if err != nil {
			err := GetMetadataForLoad(idLoadOp, metadata, nil, versionSession, connection)
			if err != nil {
				return nil, err
			}
		}

		idLoadOp.AttachMetadataCache(metadata)

		err = connection.Load(idLoadOp, versionSession)
		if err != nil {
			return nil, fmt.Errorf("cascade delete error: %w", err)
		}

		if len(idLoadCollection) == 0 {
			continue
		}

		currentCollectionIds, ok := cascadeDeleteIdsByCollection[referencedCollection]
		if !ok {
			currentCollectionIds = map[string]*wire.Item{}
			cascadeDeleteIdsByCollection[referencedCollection] = currentCollectionIds
		}

		for _, refItem := range idLoadCollection {
			refID, err := refItem.GetFieldAsString(commonfields.Id)
			if err != nil {
				return nil, err
			}
			currentCollectionIds[refID] = refItem
		}

	}

	// Now that we've built a unique set of reference ids to cascade delete by Collection,
	// convert this to a map of collection names to wire.Collection
	// so that we can more easily perform the deletes (elsewhere)
	for collectionName, items := range cascadeDeleteIdsByCollection {
		cascadeDeleteFKs[collectionName] = slices.Collect(maps.Values(items))
	}

	return cascadeDeleteFKs, nil
}

func performCascadeDeletes(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// Perform cascade deletes as an Admin to make sure we find all the records we need to
	// and to avoid unnecessary security logic
	adminSession := GetSiteAdminSession(session)

	deletes, err := getCascadeDeletes(op, connection, adminSession)
	if err != nil {
		return err
	}

	if len(deletes) == 0 {
		return nil
	}
	var saves []SaveRequest
	for collectionKey := range deletes {
		ids := deletes[collectionKey]
		if ids.Len() > 0 {
			saves = append(saves, SaveRequest{
				Collection: collectionKey,
				Wire:       "CascadeDelete",
				Deletes:    &ids,
				Options: &wire.SaveOptions{
					IgnoreMissingRecords: true,
				},
				Params: op.Params,
			})
		}
	}
	return SaveWithOptions(saves, adminSession, NewSaveOptions(connection, nil))
}
