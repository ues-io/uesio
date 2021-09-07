package datasource

import (
	"fmt"
	"regexp"

	"github.com/hashicorp/go-multierror"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change adapt.ChangeItem, isNew bool) error

func preventUpdate(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		if isNew {
			return nil
		}

		currentValue, err := change.FieldChanges.GetField(field.GetFullName())
		if err != nil {
			// Couldn't get a value from the updates, we're ok
			return nil
		}

		oldValue, err := change.FieldChanges.GetField(field.GetFullName())
		if err != nil {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" has no old value")
		}

		if currentValue.(string) == oldValue.(string) {
			// No change, we're ok
			return nil
		}

		// Fail we have an attempted change on an unupdateable field
		return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is not updateable: "+change.IDValue.(string))
	}
}

func validateRequired(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if (isNew && err != nil) || val == "" {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
		}
		return nil
	}
}

func validateEmail(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil {
			if !isEmailValid(fmt.Sprintf("%v", val)) {
				return NewSaveError(change.RecordKey, field.GetFullName(), field.Label+" is not a valid email address")
			}
		}
		return nil
	}
}

func validateRegex(field *adapt.FieldMetadata) validationFunc {
	regex, ok := isValidRegex(field.Validate.Regex)
	if !ok {
		return func(change adapt.ChangeItem, isNew bool) error {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Regex for the field: "+field.Label+" is not valid")
		}
	}
	return func(change adapt.ChangeItem, isNew bool) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" don't match regex: "+field.Validate.Regex)
		}
		return nil
	}
}

func validateMetadata(field *adapt.FieldMetadata) validationFunc {
	regex, ok := isValidRegex("^[a-z0-9_]+$")
	if !ok {
		return func(change adapt.ChangeItem, isNew bool) error {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Regex for the field: "+field.Label+" is not valid")
		}
	}
	return func(change adapt.ChangeItem, isNew bool) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" failed metadata validation, no capital letters or special characters allowed")
		}
		return nil
	}
}

func isEmailValid(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}
	return emailRegex.MatchString(e)
}

func isValidRegex(regex string) (*regexp.Regexp, bool) {

	r, err := regexp.Compile(regex)
	if err != nil {
		return nil, false
	}

	return r, true
}

func getFieldValidationsFunction(collectionMetadata *adapt.CollectionMetadata, session *sess.Session) validationFunc {

	validations := []validationFunc{}
	for _, field := range collectionMetadata.Fields {
		if field.Required {
			validations = append(validations, validateRequired(field))
		}
		if field.Validate != nil && field.Validate.Type == "EMAIL" {
			validations = append(validations, validateEmail(field))
		}
		if field.Validate != nil && field.Validate.Type == "REGEX" {
			validations = append(validations, validateRegex(field))
		}
		if field.Validate != nil && field.Validate.Type == "METADATA" {
			validations = append(validations, validateMetadata(field))
		}
		if !field.Updateable && field.GetFullName() != collectionMetadata.IDField {
			validations = append(validations, preventUpdate(field))
		}
	}

	return func(change adapt.ChangeItem, isNew bool) error {
		var errorList error
		for _, validation := range validations {
			err := validation(change, isNew)
			if err != nil {
				errorList = multierror.Append(errorList, err)
			}
		}
		return errorList
	}
}

func Validate(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {

	fieldValidations := getFieldValidationsFunction(collectionMetadata, session)

	if op.Inserts != nil {
		for _, insert := range *op.Inserts {
			err := fieldValidations(insert, true)
			if err != nil {
				return err
			}
		}
	}

	if op.Updates != nil {
		for _, update := range *op.Updates {
			err := fieldValidations(update, false)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
