package datasource

import (
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getTimestampsFields(collectionMetadata *adapters.CollectionMetadata) []*adapters.FieldMetadata {

	timestampfields := []*adapters.FieldMetadata{}
	for _, field := range collectionMetadata.Fields {
		if field.Type == "TIMESTAMP" {
			timestampfields = append(timestampfields, field)
		}
	}

	return timestampfields
}

//AddTimestamps function
func AddTimestamps(request *reqs.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {

	timestampfields := getTimestampsFields(collectionMetadata)
	timestamp := time.Now().Unix()

	for _, change := range request.Changes {

		for _, field := range timestampfields {

			// Only populate fields marked with CREATE on insert
			// Always populate the fields marked with UPDATE
			if (change.IsNew && field.AutoPopulate == "CREATE") || field.AutoPopulate == "UPDATE" {
				change.FieldChanges[field.GetFullName()] = timestamp
			}

		}
	}

	return nil
}
