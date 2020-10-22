package firestore

import (
	"context"

	"cloud.google.com/go/firestore"
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

func followUpReferenceFieldLoad(
	ctx context.Context,
	client *firestore.Client,
	metadata *adapters.MetadataCache,
	dataPayload []map[string]interface{},
	originalCollection *adapters.CollectionMetadata,
	foreignKeyValues adapters.ReferenceIDRegistry,
	referenceFields adapters.FieldsMap,
) error {

	referencedCollectionsFields, referencedCollectionsIDs, err := adapters.GetReferenceFieldsAndIDs(referenceFields, metadata, foreignKeyValues)
	if err != nil {
		return err
	}

	for collectionName, fields := range referencedCollectionsFields {
		ids := referencedCollectionsIDs.GetKeys(collectionName)
		collectionMetadata, err := metadata.GetCollection(collectionName)
		if err != nil {
			return err
		}
		firestoreCollectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}
		fireStoreCollection := client.Collection(firestoreCollectionName)

		//Get a list of all the reference docs we will need
		docRefs := make([](*firestore.DocumentRef), len(ids))
		for i, id := range ids {
			docRefs[i] = fireStoreCollection.Doc(id)
		}
		//A mapping of id value => record content
		idToDataMapping := map[string]map[string]interface{}{}

		//Fetch all reference docs
		documentSnapshots, err := client.GetAll(ctx, docRefs)
		if err != nil {
			return err
		}
		for _, doc := range documentSnapshots {
			if !doc.Exists() {
				continue
			}

			docData := map[string]interface{}{}

			for field := range fields {

				fieldMetadata, err := collectionMetadata.GetField(field)
				if err != nil {
					return err
				}

				fieldID, err := adapters.GetUIFieldName(fieldMetadata)
				if err != nil {
					return err
				}

				firestoreFieldName, err := getDBFieldName(fieldMetadata)
				if err != nil {
					return err
				}
				fieldData, err := doc.DataAtPath([]string{firestoreFieldName})
				if err != nil {
					continue
				}
				docData[fieldID] = fieldData

			}
			idToDataMapping[doc.Ref.ID] = docData
		}

		adapters.MergeReferenceData(dataPayload, referenceFields, idToDataMapping, collectionMetadata)
	}

	return nil
}
