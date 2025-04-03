package fieldvalidations

import (
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/xeipuuv/gojsonschema"
	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/validation"
)

const YAML_VALIDATION_ERROR_FORMAT = "Field '%s' failed YAML schema validation: %w"

func ValidateYamlField(field *wire.FieldMetadata) ValidationFunc {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		val, err := change.FieldChanges.GetField(field.GetFullName())
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
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Errorf(YAML_VALIDATION_ERROR_FORMAT, field.Label, err2))
			}
			validationResult, err2 := validation.ValidateYaml(schema, yamlBytes)
			if err2 != nil {
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Errorf(YAML_VALIDATION_ERROR_FORMAT, field.Label, err2))
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
					errStrings[i] = fmt.Sprintf("[%d] %s", i+1, formatted)
				}
			}
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Errorf(YAML_VALIDATION_ERROR_FORMAT, field.Label, errors.New(strings.Join(errStrings, " "))))
		} else {
			err = yaml.Unmarshal(yamlBytes, node)
			if err != nil {
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), fmt.Errorf(YAML_VALIDATION_ERROR_FORMAT, field.Label, err))
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
