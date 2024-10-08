package fieldvalidations

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Validate(op *wire.SaveOp) error {

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	var validations []ValidationFunc
	for _, field := range collectionMetadata.Fields {
		validationMetadata := field.ValidationMetadata
		if field.Required {
			validations = append(validations, ValidateRequiredField(field))
		}
		var typeValidator ValidationFunc
		switch field.Type {
		case "EMAIL":
			typeValidator = ValidateEmailField(field)
		case "NUMBER":
			typeValidator = ValidateNumberField(field)
		}
		if typeValidator != nil {
			validations = append(validations, typeValidator)
		}
		if validationMetadata != nil {
			var extraValidator ValidationFunc
			switch validationMetadata.Type {
			case "REGEX":
				extraValidator = ValidateRegex(field)
			case "METADATA":
				extraValidator = validateMetadataName(field)
			case "YAML":
				extraValidator = ValidateYamlField(field)
			}
			if extraValidator != nil {
				validations = append(validations, extraValidator)
			}
		}
	}

	return op.LoopChanges(func(change *wire.ChangeItem) error {
		for _, validation := range validations {
			err := validation(change)
			if err != nil {
				op.AddError(err)
			}
		}
		return nil
	})

}
