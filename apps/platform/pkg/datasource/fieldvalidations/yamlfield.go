package fieldvalidations

import (
	"fmt"
	"sort"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/validation"
	"github.com/xeipuuv/gojsonschema"
	"gopkg.in/yaml.v3"
)

const yamlValidationError = `
%s
Field '%s' failed YAML schema validations:
%s`

func ValidateYamlField(field *adapt.FieldMetadata) ValidationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())

		name, err := change.GetField(`uesio/studio.name`)
		metadatatype := change.Metadata.Name
		nameHelper := fmt.Sprintf("\033[1;34m%s:%v\033[0m", metadatatype, name)

		if err != nil {
			return nil
		}
		node := &yaml.Node{}
		stringVal, isString := val.(string)
		if !isString {
			return nil
		}
		yamlBytes := []byte(stringVal)
		// If we have a schema defined, then validate using the schema.
		// Otherwise, the best we can do is just make sure it's valid YAML.
		if len(field.ValidationMetadata.SchemaUri) > 0 {
			schema, err2 := validation.GetSchema(field.ValidationMetadata.SchemaUri)
			if err2 != nil {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), fmt.Sprintf(yamlValidationError, nameHelper, field.Label, err2.Error()))
			}
			validationResult, err2 := validation.ValidateYaml(schema, yamlBytes)
			if err2 != nil {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), fmt.Sprintf(yamlValidationError, nameHelper, field.Label, err2.Error()))
			}
			if validationResult.Valid() {
				return nil
			}
			var errStrings []string
			for _, resultError := range validationResult.Errors() {
				formatted := formatResultError(resultError)
				if formatted != "" {
					errStrings = append(errStrings, formatted)
				}
			}

			if errStrings == nil {
				errStrings = []string{}
			} else {
				// Sort the strings so that their order is deterministic
				sort.Strings(errStrings)
				// Now add an index to each string to make it easier to read
				for i, formatted := range errStrings {
					errStrings[i] = fmt.Sprintf("\033[1;31m[%d]\033[0m  %s", i+1, formatted)
				}
			}

			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), fmt.Sprintf(yamlValidationError, nameHelper, field.Label, strings.Join(errStrings, "\n")))
		} else {
			err = yaml.Unmarshal(yamlBytes, node)
			if err != nil {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), fmt.Sprintf(yamlValidationError, nameHelper, field.Label, err.Error()))
			}
			return nil
		}
	}
}

func formatResultError(err gojsonschema.ResultError) string {
	str :=
		strings.ReplaceAll(
			strings.ReplaceAll(err.String(), "Must validate at least one schema (anyOf)", ""),
			"Must not validate the schema (not)", "Invalid field value")

	if strings.HasSuffix(str, ": ") {
		return ""
	}

	return str
}
