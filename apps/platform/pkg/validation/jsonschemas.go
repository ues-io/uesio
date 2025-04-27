package validation

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/xeipuuv/gojsonschema"
)

var schemasCache = map[string]*gojsonschema.Schema{}

func AddSchema(uri string, schema *gojsonschema.Schema) {
	schemasCache[uri] = schema
}

func GetSchema(uri string) (*gojsonschema.Schema, error) {
	// First, check the cache
	if schema, inCache := schemasCache[uri]; inCache {
		return schema, nil
	}
	if isStaticFileUri(uri) {
		return loadSchemaFromStaticFile(uri)
	}
	return nil, fmt.Errorf("unable to load schema with uri: %s", uri)
}

func isStaticFileUri(uri string) bool {
	return strings.HasPrefix(uri, "$StaticFile{") && strings.HasSuffix(uri, "}")
}

// $StaticFile URIs allow us to load files from the /dist directory
func loadSchemaFromStaticFile(uri string) (*gojsonschema.Schema, error) {
	// e.g. /ui/types/metadata/view/view.schema.json
	requestPath := strings.TrimSuffix(strings.TrimPrefix(uri, "$StaticFile{"), "}")
	// If we are running tests, the working directory will not be the same as the main app being run,
	// so we have to adjust the base directory
	wd, _ := os.Getwd()
	baseDir := wd
	if strings.Contains(wd, "/pkg/") {
		baseDir = strings.Split(wd, "/pkg/")[0]
	}
	resolvedPath := filepath.Join(baseDir, "../../dist", requestPath)
	fileBody, err := os.ReadFile(resolvedPath)
	if err != nil {
		return nil, fmt.Errorf("unable to load schema file from uri: %s", uri)
	}
	jsonLoader := gojsonschema.NewBytesLoader(fileBody)
	if jsonLoader == nil {
		return nil, fmt.Errorf("unable to parse schema file from uri: %s", uri)
	}
	schema, err := gojsonschema.NewSchema(jsonLoader)
	if err != nil {
		return nil, fmt.Errorf("unable to parse schema file from uri: %s", uri)
	}
	AddSchema(uri, schema)
	return schema, nil
}
