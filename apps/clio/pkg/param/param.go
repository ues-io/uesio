package param

import (
	"errors"
	"fmt"
	"strings"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getMetadataList(metadataType, app, version, sessid, grouping string) ([]string, error) {

	if metadataType == "" {
		return nil, errors.New("No Metadata Type Provided for Prompt")
	}

	metadataType, ok := meta.METADATA_NAME_MAP[metadataType]
	if !ok {
		return nil, errors.New("Invalid Metadata Type Provided for Prompt")
	}

	// First get the local items
	group, err := meta.GetBundleableGroupFromType(metadataType)
	if err != nil {
		return nil, err
	}

	conditions := meta.GetGroupingConditions(metadataType, grouping)

	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef(app, version, nil, nil)
	if err != nil {
		return nil, err
	}

	err = sbs.GetAllItems(group, app, version, conditions, nil)
	if err != nil {
		return nil, err
	}

	results := []string{}

	err = group.Loop(func(item meta.Item, index string) error {
		bundleableItem := item.(meta.BundleableItem)
		// Strip off the grouping part of the key
		key := bundleableItem.GetKey()
		if grouping != "" {
			key = strings.TrimPrefix(key, grouping+":")
		}
		results = append(results, key)
		return nil
	})
	if err != nil {
		return nil, err
	}

	for depNamespace, dep := range def.Dependencies {
		groupingURL := ""
		if grouping != "" {
			groupingURL = "/" + grouping
		}
		url := fmt.Sprintf("version/%s/%s/%s/metadata/types/%s/list%s", app, depNamespace, dep.Version, metadataType, groupingURL)

		metadataList := map[string]datasource.MetadataResponse{}
		err = call.GetJSON(url, sessid, &metadataList)
		if err != nil {
			return nil, err
		}

		for key := range metadataList {
			results = append(results, key)
		}
	}

	return results, nil
}

func metadataValidator(val interface{}) error {
	str := val.(string)
	if meta.IsValidMetadataName(str) {
		return nil
	}
	return errors.New("Invalid Metadata")
}

func mergeParam(templateString string, answers map[string]interface{}) (string, error) {
	answerFunc := func(m map[string]interface{}, key string) (interface{}, error) {
		val, ok := answers[key]
		if !ok {
			return nil, errors.New("missing answer " + key)
		}
		return val, nil
	}
	template, err := templating.NewWithFuncs(templateString, answerFunc, map[string]interface{}{
		"Answer": answerFunc,
	})
	if err != nil {
		return "", err
	}

	mergedValue, err := templating.Execute(template, nil)
	if err != nil {
		return "", err
	}
	return mergedValue, nil
}

func AskMany(params *meta.BotParams, app, version, sessid string) (map[string]interface{}, error) {
	answers := map[string]interface{}{}
	for _, parameter := range *params {
		err := Ask(parameter, app, version, sessid, answers)
		if err != nil {
			return nil, err
		}
	}
	return answers, nil
}

func Ask(param meta.BotParam, app, version, sessid string, answers map[string]interface{}) error {

	if param.Conditions != nil {
		for _, condition := range param.Conditions {
			value := answers[condition.Param]
			if value != condition.Value {
				return nil
			}
		}
	}
	switch param.Type {
	case "TEXT", "":
		var answer string
		defaultValue, err := mergeParam(param.Default, answers)
		if err != nil {
			return err
		}
		err = survey.AskOne(&survey.Input{
			Message: param.Prompt,
			Default: defaultValue,
		}, &answer)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	case "BOOL":
		var answer bool
		err := survey.AskOne(&survey.Confirm{
			Message: param.Prompt,
		}, &answer)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	case "METADATANAME":
		var answer string
		err := survey.AskOne(&survey.Input{
			Message: param.Prompt,
		}, &answer, survey.WithValidator(metadataValidator))
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	case "METADATA":
		var answer string
		grouping, err := mergeParam(param.Grouping, answers)
		if err != nil {
			return err
		}
		items, err := getMetadataList(param.MetadataType, app, version, sessid, grouping)
		if err != nil {
			return err
		}
		err = survey.AskOne(&survey.Select{
			Message: param.Prompt,
			Options: items,
		}, &answer)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	case "METADATAMULTI":
		var answer []string
		grouping, err := mergeParam(param.Grouping, answers)
		if err != nil {
			return err
		}
		items, err := getMetadataList(param.MetadataType, app, version, sessid, grouping)
		if err != nil {
			return err
		}
		err = survey.AskOne(&survey.MultiSelect{
			Message: param.Prompt,
			Options: items,
		}, &answer)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	case "FIELDTYPE":
		var answer string
		options := []string{}
		for fieldType := range meta.GetFieldTypes() {
			options = append(options, fieldType)
		}

		err := survey.AskOne(&survey.Select{
			Message: param.Prompt,
			Options: options,
		}, &answer)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	case "LIST":
		var answer string
		err := survey.AskOne(&survey.Select{
			Message: param.Prompt,
			Options: param.Choices,
		}, &answer)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	default:
		return errors.New("Invalid Param Type: " + param.Type)
	}

	return nil

}
