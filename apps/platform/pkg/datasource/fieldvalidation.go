package datasource

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change adapt.ChangeItem) error

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

func getValidationFunction(collectionMetadata *adapt.CollectionMetadata) func(adapt.ChangeItem) error {

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
		if field.AutoPopulate == "UPDATE" || field.AutoPopulate == "CREATE" {
			timestamp := time.Now().Unix()
			validations = append(validations, populateTimestamps(field, timestamp))
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
	validationFunc := getValidationFunction(collectionMetadata)

	changes := adapt.ChangeItems{}
	deletes := adapt.ChangeItems{}

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
			err = validationFunc(changeItem)
			if err != nil {
				listErrors = append(listErrors, err.Error())
			}

			changes = append(changes, changeItem)
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	if request.Deletes != nil {
		err := request.Deletes.Loop(func(item loadable.Item) error {
			deletes = append(deletes, adapt.ChangeItem{
				FieldChanges: item,
			})
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
