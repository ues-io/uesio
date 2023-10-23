package validation

import (
	"errors"
	"fmt"

	"github.com/xeipuuv/gojsonschema"
	"gopkg.in/yaml.v3"
)

const WarningColor = "\033[1;33m%s\033[0m"

type customLocale struct {
	gojsonschema.DefaultLocale
}

func (l customLocale) Const() string {
	return fmt.Sprintf(WarningColor, "value does not match: {{.allowed}}")
}
func (l customLocale) AdditionalPropertyNotAllowed() string {
	return fmt.Sprintf(WarningColor, "Additional property \033[0;36m{{.property}}\033[0m is not allowed")
}

// ValidateYaml validates YAML content against a target schema,
// returning a Result object with the validation results.
// If the YAML content is invalid syntactically, an error will be returned,
// and no schema validation will be performed.
func ValidateYaml(yamlSchema *gojsonschema.Schema, yamlText []byte) (*gojsonschema.Result, error) {
	gojsonschema.Locale = customLocale{}

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
