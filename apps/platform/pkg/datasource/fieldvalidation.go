package datasource

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/hashicorp/go-multierror"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change adapt.ChangeItem, isNew bool) error

type referenceValidationFunc func(change adapt.ChangeItem, registry *adapt.ReferenceRegistry)

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

		// Since we're autopopulating this, allow the update to go through
		if field.AutoPopulate != "" {
			return nil
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
	regex, err := regexp.Compile(field.ValidationMetadata.Regex)
	if err != nil {
		return func(change adapt.ChangeItem, isNew bool) error {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Regex for the field: "+field.Label+" is not valid")
		}
	}
	return func(change adapt.ChangeItem, isNew bool) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" don't match regex: "+field.ValidationMetadata.Regex)
		}
		return nil
	}
}

func validateMetadata(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !meta.IsValidMetadataName(fmt.Sprintf("%v", val)) {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" failed metadata validation, no capital letters or special characters allowed")
		}
		return nil
	}
}

func validateNumber(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		_, isFloat := val.(float64)
		_, isInt := val.(int64)
		if err == nil && !isFloat && !isInt {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is not a valid number")
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
		validationMetadata := field.ValidationMetadata
		if field.Required {
			validations = append(validations, validateRequired(field))
		}
		if field.Type == "EMAIL" {
			validations = append(validations, validateEmail(field))
		}
		if validationMetadata != nil && validationMetadata.Type == "REGEX" {
			validations = append(validations, validateRegex(field))
		}
		if validationMetadata != nil && validationMetadata.Type == "METADATA" {
			validations = append(validations, validateMetadata(field))
		}
		if !field.Updateable && field.GetFullName() != collectionMetadata.IDField {
			validations = append(validations, preventUpdate(field))
		}
		if field.Type == "NUMBER" {
			validations = append(validations, validateNumber(field))
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

func getReferenceValidationsFunction(collectionMetadata *adapt.CollectionMetadata) referenceValidationFunc {

	validations := []referenceValidationFunc{}
	for i := range collectionMetadata.Fields {
		field := collectionMetadata.Fields[i]
		if adapt.IsReference(field.Type) {
			validations = append(validations, func(change adapt.ChangeItem, registry *adapt.ReferenceRegistry) {
				referencedCollection := field.ReferenceMetadata.Collection
				request := registry.Get(referencedCollection)
				foreignKey, err := change.FieldChanges.GetField(field.GetFullName())
				if err != nil {
					return
				}
				foreignKeyString, err := adapt.GetReferenceKey(foreignKey)
				if err != nil {
					return
				}
				if foreignKeyString == "" {
					return
				}
				request.AddID(foreignKeyString, adapt.ReferenceLocator{})
				request.AddReference(field)
			})
		}
	}

	return func(change adapt.ChangeItem, registry *adapt.ReferenceRegistry) {
		for _, validation := range validations {
			validation(change, registry)
		}
	}
}

func Validate(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, loader adapt.Loader, session *sess.Session) error {

	fieldValidations := getFieldValidationsFunction(collectionMetadata, session)

	referenceValidations := getReferenceValidationsFunction(collectionMetadata)

	referenceRegistry := &adapt.ReferenceRegistry{}

	if op.Inserts != nil {
		for _, insert := range *op.Inserts {
			err := fieldValidations(insert, true)
			if err != nil {
				return err
			}
			referenceValidations(insert, referenceRegistry)
		}
	}

	if op.Updates != nil {
		for _, update := range *op.Updates {
			err := fieldValidations(update, false)
			if err != nil {
				return err
			}
			referenceValidations(update, referenceRegistry)
		}
	}

	for collection, request := range *referenceRegistry {
		idCount := len(request.IDs)
		if idCount == 0 {
			continue
		}
		ids := make([]string, idCount)
		fieldIDIndex := 0
		for k := range request.IDs {
			ids[fieldIDIndex] = k
			fieldIDIndex++
		}
		results := &adapt.Collection{}
		ops := []*adapt.LoadOp{{
			CollectionName: collection,
			WireName:       "referentialIntegrity",
			Collection:     results,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio.id",
					Operator: "IN",
					Value:    ids,
				},
			},
			Fields: []adapt.LoadRequestField{{ID: "uesio.id"}},
			Query:  true,
		}}
		err := loader(ops)
		if err != nil {
			return err
		}
		if idCount != results.Len() {
			badValues, err := loadable.FindMissing(results, func(item loadable.Item) string {
				value, err := item.GetField("uesio.id")
				if err != nil {
					return ""
				}
				return value.(string)
			}, ids)
			if err != nil {
				return err
			}
			fieldNames := []string{}
			for fieldKey := range request.ReferenceFields {
				fieldNames = append(fieldNames, fieldKey)
			}
			return errors.New("Invalid reference Value: " + strings.Join(badValues, " : ") + " for collection " + collectionMetadata.GetFullName() + " on field " + strings.Join(fieldNames, ","))
		}
	}

	return nil
}
