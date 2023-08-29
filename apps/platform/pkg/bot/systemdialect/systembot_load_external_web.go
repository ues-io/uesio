package systemdialect

import (
	"encoding/json"
	"errors"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/integ/web"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"strings"
)

type RestCollectionMetadata struct {
	LoadOperation   string `json:"loadOperationId"`
	InsertOperation string `json:"insertOperationId"`
	CreateOperation string `json:"createOperationId"`
	DeleteOperation string `json:"deleteOperationId"`
}

func loadExternalWebDataSource(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	// The op should have data source metadata attached already
	dataSource, err := op.GetDataSource()
	if err != nil {
		return err
	}

	wic, err := web.GetConnection(dataSource, session)
	if err != nil {
		return err
	}

	// The op should have data source collection metadata attached already
	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	// Deserialize custom metadata off of the collection
	collectionCustomMeta := collectionMetadata.CustomMetadata
	if collectionCustomMeta == "" {
		return errors.New("no web metadata found for collection: " + collectionMetadata.Name)
	}
	restMetadata := &RestCollectionMetadata{}
	err = json.Unmarshal([]byte(collectionCustomMeta), restMetadata)
	if err != nil {
		return errors.New("invalid format for custom metadata for collection: " + collectionMetadata.Name + ": " + err.Error())
	}
	if restMetadata.LoadOperation == "" {
		return errors.New("no load operation defined for collection: " + collectionMetadata.Name)
	}

	// Deserialize custom metadata off of the Data Source
	dsCustomMeta := dataSource.CustomMetadata
	if dsCustomMeta == "" {
		return errors.New("no web metadata found for data source: " + dataSource.Name)
	}
	dsMetadata := &web.WebDataSourceCustomMetadata{}
	err = json.Unmarshal([]byte(dsCustomMeta), dsMetadata)
	if err != nil {
		return errors.New("invalid format for custom metadata for data source: " + dataSource.Name + ": " + err.Error())
	}

	// Find the associated Operation
	loadOperation := dsMetadata.GetOperationById(restMetadata.LoadOperation)

	if loadOperation == nil {
		return errors.New("could not find the requested load operation on collection: " + collectionMetadata.Name)
	}

	// Okay, we should be ready to go!
	// Well, we need to call the raw Bot HTTP API because we can't get StatusCode / ContentType header here
	response, err := wic.RunAction(strings.ToLower(loadOperation.Method), &web.RequestOptions{
		URL:     loadOperation.Path,
		Cache:   false,
		Headers: loadOperation.Headers,
	})
	if err != nil {
		return err
	}

	// Attach the response data to the collection
	// TODO: Inspect the response schema for the operation and translate the response accordingly
	if response != nil {
		// Assuming this for now :)
		statusCode := "200"
		contentType := "application/json"
		var responseSchema *web.WebApiSchema
		if loadOperation.ResponseTypes != nil {
			responseTypeDef := loadOperation.ResponseTypes[statusCode]
			if responseTypeDef != nil {
				responseSchema = responseTypeDef.ContentTypes[contentType]
			}
		}
		// If we have a valid response schema, and it is a reference, resolve the reference
		if responseSchema != nil && responseSchema.Reference != "" {
			responseSchema = dsMetadata.GetSchemaById(responseSchema.Reference)
		}
		if responseSchema != nil {
			// Handle OBJECT response types
			if responseSchema.Type == "object" {
				// parse the response as the object schema...
			} else if responseSchema.Type == "array" && responseSchema.Items != nil {
				// parse response as an array
				var itemSchema *web.WebApiSchema
				if responseSchema.Items.Reference != "" {
					itemSchema = dsMetadata.GetSchemaById(responseSchema.Items.Reference)
				}
				// TODO: Handle strings...
				if itemSchema != nil {
					// Okay we can parse the response as an array of structured objects

				}
			}
		}

		// Okay, we have no ResponseSchema, in that case, we could do some generic parsing?
		// Assume an Array or Object, and try to parse it manually??

	}

	return nil
}
