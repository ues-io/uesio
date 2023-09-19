package param

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/wire"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"regexp"
	"strings"

	"github.com/thecloudmasters/cli/pkg/goutils"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/localbundlestore"
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

	conditions, err := meta.GetGroupingConditions(metadataType, grouping)
	if err != nil {
		return nil, err
	}

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
		url := fmt.Sprintf("version/%s/%s/metadata/types/%s/namespace/%s/list%s", app, dep.Version, metadataType, depNamespace, groupingURL)

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

func AskMany(params *meta.BotParamsResponse, app, version, sessid string) (map[string]interface{}, error) {
	answers := map[string]interface{}{}
	for _, parameter := range *params {
		err := Ask(parameter, app, version, sessid, answers)
		if err != nil {
			return nil, err
		}
	}
	return answers, nil
}

func Ask(param meta.BotParamResponse, app, version, sessid string, answers map[string]interface{}) error {

	// Ignore params which are not relevant due to conditions
	if !meta.IsParamRelevant(param, answers) {
		return nil
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
		if answer == "" && defaultValue != "" {
			answer = defaultValue
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
		defaultValue, err := mergeParam(param.Default, answers)
		// strip out any namespaces from the default value
		isNamespacedValue, err := regexp.MatchString("\\w+\\/\\w+\\.\\w+", defaultValue)
		if err == nil && isNamespacedValue {
			defaultValue = strings.Split(defaultValue, ".")[1]
		}
		if err != nil {
			return err
		}
		err = survey.AskOne(&survey.Input{
			Message: param.Prompt,
			Default: defaultValue,
		}, &answer, survey.WithValidator(metadataValidator))
		if err != nil {
			return err
		}
		if answer == "" && defaultValue != "" {
			answer = defaultValue
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
		options := goutils.MapKeys(meta.GetFieldTypes())
		err := survey.AskOne(&survey.Select{
			Message: param.Prompt,
			Options: options,
		}, &answer)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	case "SELECT":
		var answer string
		selectListMetadata, err := getSelectListMetadata(param.SelectList)
		optionsMap := map[string]string{}
		var optionLabels []string
		var defaultValueLabel string
		for _, opt := range selectListMetadata.Options {
			label := opt.Label
			if label == "" {
				label = opt.Value
			}
			optionsMap[label] = opt.Value
			optionLabels = append(optionLabels, label)
			// Check for this being the default value, and if so,
			// save the LABEL
			if param.Default == opt.Value {
				defaultValueLabel = label
			}
		}
		if err != nil {
			return err
		}
		surveySpec := &survey.Select{
			Message: param.Prompt,
			Options: optionLabels,
		}
		if defaultValueLabel != "" {
			surveySpec.Default = defaultValueLabel
		}
		err = survey.AskOne(surveySpec, &answer)
		if err != nil {
			return err
		}
		// Lookup the corresponding value from the label
		answers[param.Name] = optionsMap[answer]
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

func getSelectListMetadata(selectList string) (*adapt.SelectListMetadata, error) {
	workspaceName, err := ws.GetWorkspace()
	if err != nil {
		return nil, errors.New("no workspace has been set. Use `uesio work -n <workspace>` to set a workspace")
	}
	appName, err := config.GetApp()
	if err != nil {
		return nil, errors.New("no Uesio app name could be determined. Are you in a Uesio app directory?")
	}
	result, err := wire.LoadOne(
		"uesio/studio.selectlist",
		&wire.LoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.name",
				},
				{
					ID: "uesio/studio.options",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.allmetadata",
					RawValue: true,
				},
				{
					Field:    "uesio/studio.item",
					RawValue: selectList,
				},
			},
			Params: map[string]string{
				"workspacename": workspaceName,
				"app":           appName,
			},
		},
	)
	if err != nil {
		return nil, err
	}

	options, err := result.GetField("uesio/studio.options")
	if err != nil {
		return nil, err
	}

	selectListOptions := &[]meta.SelectListOption{}
	rawOpts, err := json.Marshal(options)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(rawOpts, selectListOptions)
	if err != nil {
		return nil, err
	}
	return &adapt.SelectListMetadata{
		Name:    selectList,
		Options: *selectListOptions,
	}, nil
}
