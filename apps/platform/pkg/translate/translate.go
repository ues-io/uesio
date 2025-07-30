package translate

import (
	"context"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetTranslatedLabels(ctx context.Context, session *sess.Session) (map[string]string, error) {

	if session.HasLabels() {
		return session.GetLabels(), nil
	}
	userLanguage := session.GetContextUser().Language

	var labels meta.LabelCollection
	err := bundle.LoadAllFromAny(ctx, &labels, nil, session, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to load labels: %w", err)
	}

	var translations meta.TranslationCollection
	if userLanguage != "" {
		err = bundle.LoadAllFromAny(ctx, &translations, &bundlestore.GetAllItemsOptions{
			Conditions: meta.BundleConditions{
				"uesio/studio.language": userLanguage,
			},
		}, session, nil)

		if err != nil {
			return nil, fmt.Errorf("failed to load translations: %w", err)
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
