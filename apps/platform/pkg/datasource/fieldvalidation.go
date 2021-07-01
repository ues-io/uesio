package datasource

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change adapt.ChangeItem) error

func preventUpdate(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
		if !change.IsNew {
			_, err := change.FieldChanges.GetField(field.GetFullName())
			if change.IsNew && err != nil {
				return errors.New("Field: " + field.Label + " is not updateable: " + change.IDValue.(string))
			}
		}
		return nil
	}
}

func validateRequired(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if (change.IsNew && err != nil) || val == "" {
			return errors.New("Field: " + field.Label + " is required")
		}
		return nil
	}
}

func populateTimestamps(field *adapt.FieldMetadata, timestamp int64) validationFunc {
	return func(change adapt.ChangeItem) error {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if (change.IsNew && field.AutoPopulate == "CREATE") || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), timestamp)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

func populateUser(field *adapt.FieldMetadata, user *meta.User) validationFunc {
	return func(change adapt.ChangeItem) error {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if (change.IsNew && field.AutoPopulate == "CREATE") || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), map[string]interface{}{
				"uesio.id":        user.ID,
				"uesio.firstname": user.FirstName,
				"uesio.lastname":  user.LastName,
				"uesio.picture": map[string]interface{}{
					"uesio.id": user.GetPictureID(),
				},
			})
			if err != nil {
				return err
			}
		}
		return nil
	}
}

func validateEmail(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil {
			if !isEmailValid(fmt.Sprintf("%v", val)) {
				return errors.New(field.Label + " is not a valid email address")
			}
		}
		return nil
	}
}

func validateRegex(field *adapt.FieldMetadata) validationFunc {
	regex, ok := isValidRegex(field.Validate.Regex)
	if !ok {
		return func(adapt.ChangeItem) error {
			return errors.New("Regex for the field: " + field.Label + " is not valid")
		}
	}
	return func(change adapt.ChangeItem) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return errors.New("Field: " + field.Label + " don't match regex: " + field.Validate.Regex)
		}
		return nil
	}
}

func validateMetadata(field *adapt.FieldMetadata) validationFunc {
	regex, ok := isValidRegex("^[a-zA-Z0-9]*$")
	if !ok {
		return func(adapt.ChangeItem) error {
			return errors.New("Regex for the field: " + field.Label + " is not valid")
		}
	}
	return func(change adapt.ChangeItem) error {
		val, err := change.FieldChanges.GetField(field.GetFullName())
		if err == nil && !regex.MatchString(fmt.Sprintf("%v", val)) {
			return errors.New("Field: " + field.Label + " failed metadata validation, no special characters allowed")
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

func getFieldValidationsFunction(collectionMetadata *adapt.CollectionMetadata, session *sess.Session) func(adapt.ChangeItem) error {

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
		if field.AutoPopulate == "UPDATE" || field.AutoPopulate == "CREATE" {
			if field.Type == "TIMESTAMP" {
				timestamp := time.Now().UnixNano() / 1e6
				validations = append(validations, populateTimestamps(field, timestamp))
			}
			if field.Type == "USER" {
				user := session.GetUserInfo()
				validations = append(validations, populateUser(field, user))
			}
		}
		if !field.Updateable && field.GetFullName() != collectionMetadata.IDField {
			validations = append(validations, preventUpdate(field))
		}
	}

	return func(change adapt.ChangeItem) error {
		for _, validation := range validations {
			err := validation(change)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

//PopulateAndValidate function
func PopulateAndValidate(request *SaveRequest, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) (*adapt.SaveOp, error) {

	var listErrors []string
	fieldValidations := getFieldValidationsFunction(collectionMetadata, session)

	changes := adapt.ChangeItems{}
	deletes := adapt.ChangeItems{}
	fieldsInvolvedInAccess := getFieldsNeededFromRecordToDetermineWriteAccess(collectionMetadata)
	userResponseTokens, err := GenerateResponseTokens(collectionMetadata, session)
	if err != nil {
		return nil, err
	}
	if request.Changes != nil {
		err := request.Changes.Loop(func(item loadable.Item) error {
			changeItem := adapt.ChangeItem{
				FieldChanges: item,
			}
			idValue, err := item.GetField(collectionMetadata.IDField)
			if err != nil || idValue == nil || idValue.(string) == "" {
				changeItem.IsNew = true
			} else {
				changeItem.IDValue = idValue
			}
			err = fieldValidations(changeItem)
			if err != nil {
				listErrors = append(listErrors, err.Error())
			}
			appendChange := true
			if !changeItem.IsNew {
				hasAccess := hasWriteAccess(collectionMetadata, changeItem.IDValue, fieldsInvolvedInAccess, userResponseTokens, session)
				if !hasAccess {
					appendChange = false
					listErrors = append(listErrors, "No write access to record: "+changeItem.IDValue.(string))
				}
			}
			if appendChange {
				changes = append(changes, changeItem)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	if request.Deletes != nil {
		err := request.Deletes.Loop(func(item loadable.Item) error {
			idField, err := item.GetField(collectionMetadata.IDField)
			if err != nil {
				return err
			}
			hasAccess := hasWriteAccess(collectionMetadata, idField, fieldsInvolvedInAccess, userResponseTokens, session)
			if hasAccess {
				deletes = append(deletes, adapt.ChangeItem{
					FieldChanges: item,
				})

			} else {
				listErrors = append(listErrors, "No write access to record: "+idField.(string))
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	if len(listErrors) != 0 {
		return nil, errors.New("Validation Errors: " + strings.Join(listErrors, ", "))
	}

	return &adapt.SaveOp{
		CollectionName: request.Collection,
		WireName:       request.Wire,
		Changes:        changes,
		Deletes:        deletes,
		Options:        request.Options,
	}, nil
}
