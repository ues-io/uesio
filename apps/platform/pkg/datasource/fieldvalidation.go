package datasource

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change adapters.ChangeRequest) error

func validateRequired(field *adapters.FieldMetadata) validationFunc {
	return func(change adapters.ChangeRequest) error {
		val, ok := change.FieldChanges[field.GetFullName()]
		if (change.IsNew && !ok) || val == "" {
			return errors.New("Field: " + field.Label + " is required")
		}
		return nil
	}
}

func populateTimestamps(field *adapters.FieldMetadata, timestamp int64) validationFunc {
	return func(change adapters.ChangeRequest) error {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if (change.IsNew && field.AutoPopulate == "CREATE") || field.AutoPopulate == "UPDATE" {
			change.FieldChanges[field.GetFullName()] = timestamp
		}
		return nil
	}
}

func validateEmail(field *adapters.FieldMetadata) validationFunc {
	return func(change adapters.ChangeRequest) error {
		val, ok := change.FieldChanges[field.GetFullName()]
		if ok {
			if !isEmailValid(fmt.Sprintf("%v", val)) {
				return errors.New(field.Label + " is not a valid email address")
			}
		}
		return nil
	}
}

func validateRegex(field *adapters.FieldMetadata) validationFunc {
	regex, ok := isValidRegex(field.Validate.Regex)
	if !ok {
		return func(adapters.ChangeRequest) error {
			return errors.New("Regex for the field: " + field.Label + " is not valid")
		}
	}
	return func(change adapters.ChangeRequest) error {
		val, ok := change.FieldChanges[field.GetFullName()]
		if ok && !regex.MatchString(fmt.Sprintf("%v", val)) {
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

func getValidationFunction(collectionMetadata *adapters.CollectionMetadata) func(adapters.ChangeRequest) error {

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

	return func(change adapters.ChangeRequest) error {
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
func PopulateAndValidate(request *adapters.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {

	var listErrors []string
	validationFunc := getValidationFunction(collectionMetadata)
	idField, err := collectionMetadata.GetIDField()
	if err != nil {
		return err
	}
	for index, change := range request.Changes {
		idValue, ok := change.FieldChanges[idField.GetFullName()]
		if !ok || idValue.(string) == "" {
			change.IsNew = true
		} else {
			change.IDValue = idValue
		}
		err := validationFunc(change)
		if err != nil {
			listErrors = append(listErrors, err.Error())
		}
		// Put the changes back into the map
		request.Changes[index] = change
	}

	if len(listErrors) != 0 {
		return errors.New("Validation Errors: " + strings.Join(listErrors, ", "))
	}

	return nil
}
