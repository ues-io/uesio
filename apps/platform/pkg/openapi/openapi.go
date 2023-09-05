package openapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/pb33f/libopenapi"
	"github.com/pb33f/libopenapi/datamodel/high/base"
	v3 "github.com/pb33f/libopenapi/datamodel/high/v3"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"strings"
)

// Read in an OpenAPI 3 Specification, into a Document.
func LoadModelFromIntegration(integration *meta.Integration) (*v3.Document, error) {

	// Custom Metadata should contain an OpenAPI spec
	// TODO: v2 vs v3...
	customMetaString := integration.CustomMetadata
	if customMetaString == "" {
		return nil, errors.New("no web metadata found for integration: " + integration.Name)
	}

	// TODO: Have an LRU cache to cache the models in memory using the DS modstamp/hash of spec
	// so that we aren't rebuilding this thing all the time..

	// create a new document from specification bytes
	document, err := libopenapi.NewDocument([]byte(customMetaString))

	// if anything went wrong, an error is thrown
	if err != nil {
		return nil, err
	}

	// because we know this is a v3 spec, we can build a ready to go model from it.
	v3Model, modelErrs := document.BuildV3Model()

	// if anything went wrong when building the v3 model, a slice of errors will be returned
	if len(modelErrs) > 0 {
		var errorStrings []string
		for i := range modelErrs {
			errorStrings = append(errorStrings, fmt.Sprintf("error: %e\n", modelErrs[i]))
		}
		return nil, errors.New(strings.Join(errorStrings, ", "))
	}

	//v3Model.Index.

	return &v3Model.Model, nil
}

func ParseResponseBodyUsingApiMetadata(collection meta.Group, data []byte, contentType string, statusCode int, responses *v3.Responses, spec *v3.Document) error {
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
	schema := ResolveSchemaProxy(schemaProxy, spec)
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
		return AddCollectionItemFromObject(collection, responseBody, schema, spec)
	} else if schemaType == "array" && schema.Items != nil {
		// OpenAPI 3.0 schema value
		var itemSchema *base.Schema
		if schema.Items.IsA() {
			itemSchema = ResolveSchemaProxy(schema.Items.A, spec)
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
					if err := AddCollectionItemFromObject(collection, rawItem, itemSchema, spec); err != nil {
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

func AddCollectionItemFromObject(collection meta.Group, object map[string]interface{}, objectSchema *base.Schema, spec *v3.Document) error {
	item := collection.NewItem()
	// Iterate over the object and process it against the object schema
	for propName, propValue := range object {
		// See if we have a matching property in the object schema
		property := objectSchema.Properties[propName]
		var propertySchema *base.Schema
		fieldId := propName
		if property != nil {
			propertySchema = ResolveSchemaProxy(property, spec)
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

func ResolveSchemaProxy(schemaProxy *base.SchemaProxy, spec *v3.Document) *base.Schema {
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

func ParseResponseBodyUsingBestGuess(collection meta.Group, data []byte, contentType string, integration *meta.Integration) error {
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

	switch val := responseBody.(type) {
	case map[string]interface{}:
		// We only have one Item. Assume that all values correspond to the data source field metadata
		return processResponseBodyRow(collection, val)
	case []map[string]interface{}:
		// We have multiple Items. Assume that all values correspond to the data source field metadata
		for _, row := range val {
			if err := processResponseBodyRow(collection, row); err != nil {
				return err
			}
		}
		return nil
	}
	return nil
}

func processResponseBodyRow(collection meta.Group, row map[string]interface{}) error {
	// We only have one Item. Assume that all values correspond to the data source field metadata
	item := collection.NewItem()

	for fieldName, fieldValue := range row {
		if err := item.SetField(fieldName, fieldValue); err != nil {
			return errors.New("unable to set value of field " + fieldName + ": " + err.Error())
		}
	}
	if err := collection.AddItem(item); err != nil {
		return errors.New("unable to add new item to collection: " + err.Error())
	}
	return nil
}
