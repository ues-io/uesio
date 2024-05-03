package translate

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetTranslatedLabels(session *sess.Session) (map[string]string, error) {

	if session.HasLabels() {
		return session.GetLabels(), nil
	}
	userLanguage := session.GetContextUser().Language

	var labels meta.LabelCollection
	err := bundle.LoadAllFromAny(&labels, nil, session, nil)
	if err != nil {
		return nil, errors.New("Failed to load labels: " + err.Error())
	}

	var translations meta.TranslationCollection
	if userLanguage != "" {
		err = bundle.LoadAllFromAny(&translations, &bundlestore.GetAllItemsOptions{
			Conditions: meta.BundleConditions{
				"uesio/studio.language": userLanguage,
			},
		}, session, nil)

		if err != nil {
			return nil, errors.New("Failed to load translations: " + err.Error())
		}
	}

	originalNamespace := session.GetContextAppName()
	// Loop over the translations once, and create a map of translations
	translatedLabels := map[string]string{}
	for i := range translations {
		isOriginalNamespace := translations[i].Namespace == originalNamespace
		for labelKey, translatedValue := range translations[i].Labels {
			_, hasTranslation := translatedLabels[labelKey]
			if !hasTranslation || isOriginalNamespace {
				translatedLabels[labelKey] = translatedValue
			}
		}
	}

	for i := range labels {
		labelKey := labels[i].GetKey()
		_, hasTranslation := translatedLabels[labelKey]
		if !hasTranslation {
			translatedLabels[labelKey] = labels[i].Value
		}
	}

	session.SetLabels(translatedLabels)

	return translatedLabels, nil

}
