package datasource

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/hashicorp/go-multierror"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change adapt.ChangeItem) error

type referenceValidationFunc func(change adapt.ChangeItem, registry *adapt.ReferenceRegistry)

func preventUpdate(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
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
		return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is not updateable: "+change.IDValue)
	}
}

func validateRequired(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if (change.IsNew && err != nil) || val == "" {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" is required")
		}
		return nil
	}
}

func validateEmail(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
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
		return func(change adapt.ChangeItem) error {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Regex for the field: "+field.Label+" is not valid")
		}
	}
	return func(change adapt.ChangeItem) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" don't match regex: "+field.ValidationMetadata.Regex)
		}
		return nil
	}
}

func validateMetadata(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !meta.IsValidMetadataName(fmt.Sprintf("%v", val)) {
			return NewSaveError(change.RecordKey, field.GetFullName(), "Field: "+field.Label+" failed metadata validation, no capital letters or special characters allowed")
		}
		return nil
	}
}

func validateNumber(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
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
		if !field.Updateable && field.GetFullName() != adapt.ID_FIELD {
			validations = append(validations, preventUpdate(field))
		}
		if field.Type == "NUMBER" {
			validations = append(validations, validateNumber(field))
		}
	}

	return func(change adapt.ChangeItem) error {
		var errorList error
		for _, validation := range validations {
			err := validation(change)
			if err != nil {
				errorList = multierror.Append(errorList, err)
			}
		}
		return errorList
	}
}

func getReferenceValidationsFunction(collectionMetadata *adapt.CollectionMetadata, session *sess.Session) referenceValidationFunc {
	validations := []referenceValidationFunc{}
	for i := range collectionMetadata.Fields {
		field := collectionMetadata.Fields[i]
		if adapt.IsReference(field.Type) {
			validations = append(validations, func(change adapt.ChangeItem, registry *adapt.ReferenceRegistry) {
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

				// Special exception for the system user
				if collectionMetadata.GetFullName() == "uesio/core.user" && referencedCollection == "uesio/core.user" && foreignKeyString == "uesio" {
					return
				}
				// Special exception for the siteadmin context
				siteadmin := session.GetSiteAdmin()
				isBuiltinUserField := fieldName == "uesio/core.owner" || fieldName == "uesio/core.createdby" || fieldName == "uesio/core.updatedby"
				if siteadmin != nil && referencedCollection == "uesio/core.user" && isBuiltinUserField {
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

func Validate(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, connection adapt.Connection, session *sess.Session) error {

	fieldValidations := getFieldValidationsFunction(collectionMetadata, session)

	referenceValidations := getReferenceValidationsFunction(collectionMetadata, session)

	referenceRegistry := &adapt.ReferenceRegistry{}

	// Process Inserts
	idTemplate, err := adapt.NewFieldChanges(collectionMetadata.IDFormat, collectionMetadata)
	if err != nil {
		return err
	}

	if op.Inserts != nil {
		for i := range *op.Inserts {
			// This is kind of randomly placed, but we want to populate new field id here
			newID, err := templating.Execute(idTemplate, (*op.Inserts)[i].FieldChanges)
			if err != nil {
				return err
			}

			if newID == "" {
				newID = uuid.New().String()
			}

			err = (*op.Inserts)[i].FieldChanges.SetField(adapt.ID_FIELD, newID)
			if err != nil {
				return err
			}

			(*op.Inserts)[i].IDValue = newID

			err = fieldValidations((*op.Inserts)[i])
			if err != nil {
				return err
			}
			referenceValidations((*op.Inserts)[i], referenceRegistry)
		}
	}

	if op.Updates != nil {
		for i := range *op.Updates {
			err := fieldValidations((*op.Updates)[i])
			if err != nil {
				return err
			}
			referenceValidations((*op.Updates)[i], referenceRegistry)
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
					Field:    adapt.ID_FIELD,
					Operator: "IN",
					Value:    ids,
				},
			},
			Fields: []adapt.LoadRequestField{{ID: adapt.ID_FIELD}},
			Query:  true,
		}}
		for _, op := range ops {
			err := connection.Load(op)
			if err != nil {
				return err
			}
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
			fieldNames := []string{}
			for fieldKey := range request.ReferenceFields {
				fieldNames = append(fieldNames, fieldKey)
			}
			return errors.New("Invalid reference Value: " + strings.Join(badValues, " : ") + " for collection " + collectionMetadata.GetFullName() + " on field " + strings.Join(fieldNames, ","))
		}
	}

	return nil
}
