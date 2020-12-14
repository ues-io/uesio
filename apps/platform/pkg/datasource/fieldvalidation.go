package datasource

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

type validationFunc func(change reqs.ChangeRequest) error

func validateRequired(field *adapters.FieldMetadata) validationFunc {
	return func(change reqs.ChangeRequest) error {
		key := field.GetFullName()
		val := change[key]
		if val == nil || val == "" {
			return errors.New("Field: " + field.Label + " is required")
		}
		return nil
	}
}

func validateEmail(field *adapters.FieldMetadata) validationFunc {
	return func(change reqs.ChangeRequest) error {
		key := field.GetFullName()
		if val, ok := change[key]; ok {
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
		return func(reqs.ChangeRequest) error {
			return errors.New("Regex for the field: " + field.Label + " is not valid")
		}
	}
	return func(change reqs.ChangeRequest) error {
		key := field.GetFullName()
		if !matchRegex(change, key, regex) {
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

func matchRegex(change reqs.ChangeRequest, key string, regex *regexp.Regexp) bool {

	if val, ok := change[key]; ok {
		return regex.MatchString(fmt.Sprintf("%v", val))
	}

	return false
}

func getValidationFunction(collectionMetadata *adapters.CollectionMetadata) func(reqs.ChangeRequest) error {

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
	}

	return func(change reqs.ChangeRequest) error {
		for _, validation := range validations {
			err := validation(change)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

//FieldValidation function
func FieldValidation(request *reqs.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {

	var listErrors []string
	validationFunc := getValidationFunction(collectionMetadata)
	for _, change := range request.Changes {
		err := validationFunc(change)
		if err != nil {
			listErrors = append(listErrors, err.Error())
		}
	}

	if len(listErrors) != 0 {
		return errors.New("Validation Errors: " + strings.Join(listErrors, ", "))
	}

	return nil
}
