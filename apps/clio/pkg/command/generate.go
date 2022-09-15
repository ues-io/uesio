package command

import (
	"errors"
	"fmt"

	"github.com/AlecAivazis/survey/v2"
	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getMetadataList(metadataType, app, version, grouping string) ([]string, error) {

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

	err = sbs.GetAllItems(group, app, version, conditions, nil)
	if err != nil {
		return nil, err
	}

	results := []string{}

	err = group.Loop(func(item loadable.Item, index string) error {
		bundleableItem := item.(meta.BundleableItem)
		results = append(results, bundleableItem.GetKey())
		return nil
	})
	if err != nil {
		return nil, err
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

func ask(param meta.BotParam, app, version string, answers map[string]interface{}) error {

	switch param.Type {
	case "TEXT":
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
		items, err := getMetadataList(param.MetadataType, app, version, grouping)
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
		items, err := getMetadataList(param.MetadataType, app, version, grouping)
		if err != nil {
			return err
		}
		err = survey.AskOne(&survey.MultiSelect{
			Message: param.Prompt,
			Options: items,
		}, &answers)
		if err != nil {
			return err
		}
		answers[param.Name] = answer
	default:
		return errors.New("Invalid Param Type: " + param.Type)
	}

	return nil

}

func Generate(key string) error {

	fmt.Println("Running Generator Command")

	namespace, name, err := meta.ParseKeyWithDefault(key, "uesio/core")
	if err != nil {
		return err
	}

	_, err = auth.Login()
	if err != nil {
		return err
	}

	app, err := config.GetApp()
	if err != nil {
		return err
	}

	version, err := config.GetVersion(namespace)
	if err != nil {
		return err
	}

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	url := fmt.Sprintf("version/%s/%s/%s/bots/params/generator/%s", app, namespace, version, name)

	botParams := &meta.BotParams{}
	err = call.GetJSON(url, sessid, botParams)
	if err != nil {
		return err
	}

	answers := map[string]interface{}{}

	for _, param := range *botParams {
		err := ask(param, app, version, answers)
		if err != nil {
			return err
		}
	}

	fmt.Println("Answers")
	fmt.Println(answers)

	return nil
}
