package systemdialect

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/integ/web"
	"github.com/thecloudmasters/uesio/pkg/openapi"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"io"
	"net/http"
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
	spec, err := openapi.LoadModelFromDataSource(dataSource)

	for _, p := range spec.Paths.PathItems {
		p.Trace.
	}

	// Find the associated Operation
	loadOperation := dsMetadata.GetOperationById(restMetadata.LoadOperation)

	if loadOperation == nil {
		return errors.New("could not find the requested load operation on collection: " + collectionMetadata.Name)
	}

	// Okay, we should be ready to go!
	httpReq, err := http.NewRequest(loadOperation.Method, loadOperation.Path, nil)
	if err != nil {
		return errors.New("unable to load construct HTTP request for load: " + err.Error())
	}
	if len(loadOperation.Headers) > 0 {
		for header, value := range loadOperation.Headers {
			httpReq.Header.Set(header, value)
		}
	}

	httpResp, err := httpClient.Get().Do(httpReq)
	if err != nil {
		return errors.New("unable to load data from HTTP API: " + err.Error())
	}
	defer httpResp.Body.Close()

	// Read the full body into a byte array, so we can cache / parse
	responseData, responseError := io.ReadAll(httpResp.Body)
	if responseError != nil {
		return errors.New("unable to read HTTP response body: " + responseError.Error())
	}

	contentType := httpResp.Header.Get("Content-Type")
	statusCode := fmt.Sprintf("%v", httpResp.StatusCode)

	// Attempt to parse the response body into a structured representation,
	// if possible. If it fails, just return the raw response as a string
	//parsedBody, err := web.ParseResponseBody(contentType, responseData, nil)
	//

	if err != nil {
		return err
	}

	// Attach the response data to the collection
	// TODO: Inspect the response schema for the operation and translate the response accordingly
	if responseData != nil {
		// Assuming this for now :)
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
