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
	idField, _ := collectionMetadata.GetIDField()

	for _, change := range request.Changes {

		_, ok := change[idField.GetFullName()]

		for _, field := range timestampfields {

			if !ok && field.AutoPopulate == "CREATE" {
				//insert
				change[field.GetFullName()] = timestamp
			}
			if ok && field.AutoPopulate == "UPDATE" {
				//update
				change[field.GetFullName()] = timestamp
			}

		}
	}

	return nil
}
