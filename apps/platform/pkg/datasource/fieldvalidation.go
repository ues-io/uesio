package datasource

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change *adapt.ChangeItem) *adapt.SaveError

type referenceValidationFunc func(change *adapt.ChangeItem, registry *adapt.ReferenceRegistry)

func preventUpdate(field *adapt.FieldMetadata) validationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		if change.IsNew {
			return nil
		}

		currentValue, err := change.FieldChanges.GetField(field.GetFullName())
		if err != nil {
			// Couldn't get a value from the updates, we're ok
			return nil
		}

		oldValue, err := change.FieldChanges.GetField(field.GetFullName())
		if err != nil {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" has no old value")
		}

		// Since we're autopopulating this, allow the update to go through
		if field.AutoPopulate != "" {
			return nil
		}

		if currentValue == oldValue {
			// No change, we're ok
			return nil
		}

		// Fail we have an attempted change on an unupdateable field
		return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is not updateable: "+change.IDValue)
	}
}

func validateRequired(field *adapt.FieldMetadata) validationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if (change.IsNew && err != nil) || val == "" {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
		}
		return nil
	}
}

func validateEmail(field *adapt.FieldMetadata) validationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && val != "" {
			if !isEmailValid(fmt.Sprintf("%v", val)) {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), field.Label+" is not a valid email address")
			}
		}
		return nil
	}
}

func validateRegex(field *adapt.FieldMetadata) validationFunc {
	regex, err := regexp.Compile(field.ValidationMetadata.Regex)
	if err != nil {
		return func(change *adapt.ChangeItem) *adapt.SaveError {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Regex for the field: "+field.Label+" is not valid")
		}
	}
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" don't match regex: "+field.ValidationMetadata.Regex)
		}
		return nil
	}
}

func validateMetadata(field *adapt.FieldMetadata) validationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !meta.IsValidMetadataName(fmt.Sprintf("%v", val)) {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" failed metadata validation, no capital letters or special characters allowed")
		}
		return nil
	}
}

func validateNumber(field *adapt.FieldMetadata) validationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		_, isFloat := val.(float64)
		_, isInt64 := val.(int64)
		_, isUint64 := val.(uint64)
		_, isInt := val.(int)
		if err == nil && !isFloat && !isInt64 && !isInt && !isUint64 {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is not a valid number")
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

func getReferenceValidationsFunction(collectionMetadata *adapt.CollectionMetadata, session *sess.Session) referenceValidationFunc {
	validations := []referenceValidationFunc{}
	for i := range collectionMetadata.Fields {
		field := collectionMetadata.Fields[i]
		if adapt.IsReference(field.Type) {
			validations = append(validations, func(change *adapt.ChangeItem, registry *adapt.ReferenceRegistry) {
				referencedCollection := field.ReferenceMetadata.Collection
				request := registry.Get(referencedCollection)
				fieldName := field.GetFullName()
				foreignKey, err := change.FieldChanges.GetField(fieldName)
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

				// Special exception for the siteadmin context
				siteadmin := session.GetSiteAdmin()
				isBuiltinUserField := fieldName == "uesio/core.owner" || fieldName == "uesio/core.createdby" || fieldName == "uesio/core.updatedby"
				if siteadmin != nil && referencedCollection == "uesio/core.user" && isBuiltinUserField {
					return
				}
				request.AddID(foreignKeyString, adapt.ReferenceLocator{})
			})
		}
	}

	return func(change *adapt.ChangeItem, registry *adapt.ReferenceRegistry) {
		for _, validation := range validations {
			validation(change, registry)
		}
	}
}

func Validate(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {

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
		if !field.Updateable && field.GetFullName() != adapt.ID_FIELD {
			validations = append(validations, preventUpdate(field))
		}
		if field.Type == "NUMBER" {
			validations = append(validations, validateNumber(field))
		}
	}

	referenceValidations := getReferenceValidationsFunction(collectionMetadata, session)

	referenceRegistry := &adapt.ReferenceRegistry{}

	err := op.LoopChanges(func(change *adapt.ChangeItem) error {

		for _, validation := range validations {
			err := validation(change)
			if err != nil {
				op.AddError(err)
			}
		}

		referenceValidations(change, referenceRegistry)
		return nil
	})
	if err != nil {
		return err
	}

	for collection, request := range *referenceRegistry {
		ids := request.GetIDs()
		idCount := len(ids)
		if idCount == 0 {
			continue
		}
		results := &adapt.Collection{}
		op := &adapt.LoadOp{
			CollectionName: collection,
			WireName:       "referentialIntegrity",
			Collection:     results,
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    adapt.ID_FIELD,
					Operator: "IN",
					Value:    ids,
				},
			},
			Fields:             []adapt.LoadRequestField{{ID: adapt.ID_FIELD}},
			Query:              true,
			SkipRecordSecurity: true,
		}

		err := connection.Load(op)
		if err != nil {
			return err
		}

		if idCount != results.Len() {
			badValues, err := loadable.FindMissing(results, func(item loadable.Item) string {
				value, err := item.GetField(adapt.ID_FIELD)
				if err != nil {
					return ""
				}
				return value.(string)
			}, ids)
			if err != nil {
				return err
			}

			return errors.New("Invalid reference Value: " + strings.Join(badValues, " : ") + " for collection " + collectionMetadata.GetFullName())
		}
	}

	return nil
}
