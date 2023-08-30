package systemdialect

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/pb33f/libopenapi/datamodel/high/base"
	v3 "github.com/pb33f/libopenapi/datamodel/high/v3"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/openapi"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"io"
	"net/http"
	"net/url"
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

	// Find the requested Operation
	var loadOperation *v3.Operation
	var loadPath, loadMethod string
	for path, pathItem := range spec.Paths.PathItems {
		// Check the GET endpoint first, it's the most likely match
		if pathItem.Get != nil && pathItem.Get.OperationId == restMetadata.LoadOperation {
			loadOperation = pathItem.Get
			loadPath = path
			loadMethod = "GET"
			break
		}
		// Check the POST endpoint next
		if pathItem.Post != nil && pathItem.Post.OperationId == restMetadata.LoadOperation {
			loadOperation = pathItem.Post
			loadPath = path
			loadMethod = "POST"
			break
		}
	}

	if loadOperation == nil {
		return errors.New("could not find the requested load operation on collection: " + collectionMetadata.Name)
	}
	// Index all load request conditions by id so that we can grab their values
	conditionsById := map[string]*adapt.LoadRequestCondition{}

	for _, condition := range op.Conditions {
		if condition.ID != "" {
			conditionsById[condition.ID] = &condition
		}
	}

	// Process parameters needed for the request
	headerParams := map[string]string{}

	// TODO: Add the base url from... the "servers" list???
	queryString := url.Values{}

	if len(loadOperation.Parameters) > 0 {
		for _, param := range loadOperation.Parameters {
			condition := conditionsById[param.Name]
			if condition == nil && param.Required {
				return errors.New("required condition " + param.Name + " not found in load request")
			} else if condition != nil && param.AllowEmptyValue == false && (condition.Value == nil || condition.Value == "") {
				return errors.New("no value provided for required condition " + param.Name + ", could not perform load")
			}
			// Otherwise, if there's no condition, we can move on
			if condition == nil {
				continue
			}
			paramVal := fmt.Sprintf("%v", condition.Value)
			if param.In == "header" {
				headerParams[param.Name] = paramVal
			} else if param.In == "path" {
				// Populate values in the path from named load request conditions
				loadPath = strings.Replace(loadPath, fmt.Sprintf("{%s}", param.Name), paramVal, 1)
			} else if param.In == "query" {
				queryString.Set(param.Name, paramVal)
			} else if param.In == "cookie" {
				// TODO: Build up a cookie header
			}
		}
	}

	// Okay, we should be ready to go!
	httpReq, err := http.NewRequest(loadMethod, loadPath+"?"+queryString.Encode(), nil)
	if err != nil {
		return errors.New("unable to load construct HTTP request for load: " + err.Error())
	}

	// TODO: Add in common request headers!
	if len(headerParams) > 0 {
		for headerName, headerValue := range headerParams {
			httpReq.Header.Set(headerName, headerValue)
		}
	}
	// TODO: Handle Security Schemes...

	httpResp, err := httpClient.Get().Do(httpReq)
	if err != nil {
		return errors.New("unable to load data from HTTP API: " + err.Error())
	}

	var responseData []byte
	var responseError error

	if httpResp.Body != nil {
		defer httpResp.Body.Close()
		// Read the full body into a byte array, so we can cache / parse
		responseData, responseError = io.ReadAll(httpResp.Body)
		if responseError != nil {
			return errors.New("unable to read HTTP response body: " + responseError.Error())
		}
	}

	contentType := httpResp.Header.Get("Content-Type")

	// Inspect the response schema for the operation and translate the response accordingly
	// into a structured representation so that we can build up collection items

	if responseData != nil {
		// First try to parse response data using the OpenAPI metadata
		err = parseResponseBodyUsingApiMetadata(op.Collection, responseData, contentType, httpResp.StatusCode, loadOperation.Responses, spec)

		// Fallback to manually trying to parse the response body using JSON introspection
		if err != nil {
			err = parseResponseBodyUsingBestGuess(op.Collection, responseData, contentType, dataSource)
		}
		if err != nil {
			return errors.New("unable to parse response body: " + err.Error())
		}
		// Otherwise --- we should have some data now
		return nil
	}

	return nil
}

func parseResponseBodyUsingApiMetadata(collection meta.Group, data []byte, contentType string, statusCode int, responses *v3.Responses, spec *v3.Document) error {
	if responses == nil {
		return errors.New("no response schemas defined in API metadata")
	}

	// If the type is NOT JSON --- we don't support it right now
	if !strings.Contains(contentType, "/json") {
		return errors.New("unsupported response content type: " + contentType)
	}

	// First look for a code-specific response
	response := responses.FindResponseByCode(statusCode)
	if response == nil {
		// Fallback to default response if no code-specific response is provided
		response = responses.Default
	}
	if response == nil {
		return errors.New("no response schemas defined in API metadata")
	}
	// If we have a valid response schema, and it is a reference, resolve the reference
	if response.Content == nil {
		// We have no schema to use. Dang
		return errors.New("no content types defined for API response metadata")
	}
	mediaType := response.Content[contentType]
	if mediaType == nil {
		return errors.New("no content type match found for API response metadata")
	}
	schemaProxy := mediaType.Schema
	if schemaProxy == nil {
		return errors.New("no schema defined for API response metadata")
	}
	schema := resolveSchemaProxy(schemaProxy, spec)
	if schema == nil {
		return errors.New("could not find schema for API response metadata")
	}
	// For now --- only handle one schema type, although in OpenAPI 3.1 Type is an array...
	// so we'd need to introspect response / use a discriminator to figure it out anyway
	schemaType := schema.Type[0]

	//
	// Cases:
	// - Primitive (e.g. String)
	// - Struct: there will be a well-defined schema in "properties",
	//		with "required" array indicating which properties are required.
	// - Map: keys are strings, and "additionalProperties.type" defines the value type:
	//		- Value: Primitive
	//		- Value: other Schema ($ref)
	// - Polymorphic Structs
	//		- "allOf", "oneOf", "anyOf" arrays should be provided to define the composite types
	//		- discriminator used to distinguish which Model we are looking at
	// - Array
	//		- items object will define the Schema of the items
	// parse the response as the object schema...

	if schemaType == "object" {
		// Deserialize into a map[string]interface{}
		responseBody := map[string]interface{}{}
		if err := json.NewDecoder(bytes.NewReader(data)).Decode(&responseBody); err != nil {
			return errors.New("unable to deserialize response body into a map")
		}
		return addCollectionItemFromObject(collection, responseBody, schema, spec)
	} else if schemaType == "array" && schema.Items != nil {
		// OpenAPI 3.0 schema value
		var itemSchema *base.Schema
		if schema.Items.IsA() {
			itemSchema = resolveSchemaProxy(schema.Items.A, spec)
			if itemSchema == nil {
				return errors.New("unable to resolve array items schema")
			}
			// If the item schema type is an object...
			if itemSchema.Type[0] == "object" {
				// Deserialize into a []map[string]object{}
				var responseBody []map[string]interface{}
				if err := json.NewDecoder(bytes.NewReader(data)).Decode(&responseBody); err != nil {
					return errors.New("unable to deserialize response body into a an array of maps")
				}
				for _, rawItem := range responseBody {
					if err := addCollectionItemFromObject(collection, rawItem, itemSchema, spec); err != nil {
						return err
					}
				}
				return nil
			} else {
				return errors.New("unsupported response body schema type: " + itemSchema.Type[0])
			}
		} else {
			// items is a boolean, there's nothing we can do with it
			return errors.New("unable to deserialize array response due to unparseable items schema")
		}
	}
	return nil
}

func addCollectionItemFromObject(collection meta.Group, object map[string]interface{}, objectSchema *base.Schema, spec *v3.Document) error {
	item := collection.NewItem()
	// Iterate over the object and process it against the object schema
	for propName, propValue := range object {
		// See if we have a matching property in the object schema
		property := objectSchema.Properties[propName]
		var propertySchema *base.Schema
		fieldId := propName
		if property != nil {
			propertySchema = resolveSchemaProxy(property, spec)
		}
		if propertySchema != nil {
			// Get the Uesio field id from extensions
			uesioFieldId := propertySchema.Extensions["x-uesio-field-id"]
			if uesioFieldId != nil && uesioFieldId != "" {
				if stringValue, isString := uesioFieldId.(string); isString {
					fieldId = stringValue
				}
			}
		}
		// Dump the value over. TODO: maybe do a better job of creating sub items?
		if err := item.SetField(fieldId, propValue); err != nil {
			return fmt.Errorf("could not set value of field %s to %v", fieldId, propValue)
		}
	}
	if err := collection.AddItem(item); err != nil {
		return errors.New("unable to add item to collection: " + err.Error())
	}
	return nil
}

func resolveSchemaProxy(schemaProxy *base.SchemaProxy, spec *v3.Document) *base.Schema {
	// If this is an inline schema, fetch it directly
	if !schemaProxy.IsReference() {
		return schemaProxy.Schema()
	}
	// Fetch the schema from elsewhere in the spec
	if spec.Components == nil || spec.Components.Schemas == nil {
		return nil
	}
	match := spec.Components.Schemas[schemaProxy.GetReference()]
	if match == nil {
		return nil
	}
	return match.Schema()
}

func parseResponseBodyUsingBestGuess(collection meta.Group, data []byte, contentType string, ds *meta.DataSource) error {
	var responseBody interface{}
	if strings.Contains(contentType, "/json") {
		// If it starts with a curly brace, treat it as JSON object
		first := string(data[0])
		if first == "{" {
			responseBody = &map[string]interface{}{}
		} else if first == "[" {
			// Otherwise, assume it's a JSON array
			second := string(data[1])
			if second == "{" {
				responseBody = &[]map[string]interface{}{}
			} else {
				responseBody = &[]interface{}{}
			}
		}
		err := json.NewDecoder(bytes.NewReader(data)).Decode(responseBody)
		if err != nil {
			return err
		}
	}

	switch _ := responseBody.(type) {
	case map[string]interface{}:
		// We only have one Item. Assume that all values correspond to the data source field metadata
		//for fieldName, fieldValue := range val {
		//
		//}
		return nil
	case []map[string]interface{}:
		// We have multiple Items. Assume that all values correspond to the data source field metadata
		//for _, rawItem := range val {
		//	for fieldName, fieldValue := range rawItem {
		//
		//	}
		//}
		return nil
	}
	return nil
}
