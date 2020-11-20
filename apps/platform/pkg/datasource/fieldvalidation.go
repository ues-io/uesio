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

func isEmailValid(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}
	return emailRegex.MatchString(e)
}

func isEmpty(request *reqs.SaveRequest, key string) bool {
	for _, change := range request.Changes {
		if val, ok := change[key]; ok {
			if val == "" {
				return true
			}
		}
	}
	return false
}

func isEmail(request *reqs.SaveRequest, key string) bool {
	for _, change := range request.Changes {
		if val, ok := change[key]; ok {
			return isEmailValid(fmt.Sprintf("%v", val))
		}
	}
	return false
}

func isValidRegex(regex string) (*regexp.Regexp, bool) {

	r, err := regexp.Compile(regex)
	if err != nil {
		return nil, false
	}

	return r, true
}

func matchRegex(request *reqs.SaveRequest, key string, regex *regexp.Regexp) bool {

	for _, change := range request.Changes {
		if val, ok := change[key]; ok {
			return regex.MatchString(fmt.Sprintf("%v", val))
		}
	}

	return false
}

//FieldValidation function
func FieldValidation(request *reqs.SaveRequest, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {

	if len(request.Changes) != 0 {

		var listErrors []string

		for key, field := range collectionMetadata.Fields {
			if field.Required {
				if isEmpty(request, key) {
					listErrors = append(listErrors, "Field: "+field.Label+" is required")
				}
			}

			if field.Validate.Type == "EMAIL" {
				if !isEmail(request, key) {
					listErrors = append(listErrors, field.Label+" is not a valid email address")
				}
			}

			if field.Validate.Type == "REGEX" {
				regex, ok := isValidRegex(field.Validate.Options)
				if ok {
					if !matchRegex(request, key, regex) {
						listErrors = append(listErrors, "Field: "+field.Label+" don't match regex: "+field.Validate.Options)
					}
				} else {
					listErrors = append(listErrors, "Regex for the field: "+field.Label+" is not valid")
				}
			}

		}

		if len(listErrors) != 0 {
			return errors.New("Validation Errors: " + strings.Join(listErrors, ", "))
		}

	}

	return nil
}
