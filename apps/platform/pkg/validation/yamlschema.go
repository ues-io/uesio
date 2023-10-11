package validation

import (
	"errors"
	"github.com/xeipuuv/gojsonschema"
	"gopkg.in/yaml.v3"
)

// ValidateYaml validates YAML content against a target schema,
// returning a Result object with the validation results.
// If the YAML content is invalid syntactically, an error will be returned,
// and no schema validation will be performed.
func ValidateYaml(yamlSchema *gojsonschema.Schema, yamlText []byte) (*gojsonschema.Result, error) {
	// Load the YAML into a document that can be validated
	var document map[interface{}]interface{}
	if err := yaml.Unmarshal(yamlText, &document); err != nil {
		return nil, errors.New("invalid YAML")
	}
	documentLoader := gojsonschema.NewRawLoader(document)
	if documentLoader == nil {
		return nil, errors.New("invalid YAML")
	}
	return yamlSchema.Validate(documentLoader)
}
