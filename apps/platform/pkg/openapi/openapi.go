package openapi

import (
	"errors"
	"fmt"
	"github.com/pb33f/libopenapi"
	v3 "github.com/pb33f/libopenapi/datamodel/high/v3"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"strings"
)

// Read in an OpenAPI 3 Specification, into a Document.
func LoadModelFromDataSource(ds *meta.DataSource) (*v3.Document, error) {

	// Custom Metadata should contain an OpenAPI spec
	// TODO: v2 vs v3...
	customMetaString := ds.CustomMetadata
	if customMetaString == "" {
		return nil, errors.New("no web metadata found for data source: " + ds.Name)
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
