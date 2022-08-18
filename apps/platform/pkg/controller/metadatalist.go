package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type MetadataResponse struct {
	Color string `json:"color"`
}

func getAppData(namespaces []string, session *sess.Session) (map[string]*meta.App, error) {
	apps := meta.AppCollection{}

	// Load in App Settings
	err := datasource.PlatformLoad(&apps, &datasource.PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    adapt.UNIQUE_KEY_FIELD,
				Operator: "IN",
				Value:    namespaces,
			},
		},
		Fields: []adapt.LoadRequestField{
			{
				ID: "uesio/studio.color",
			},
			{
				ID: "uesio/studio.icon",
			},
		},
		SkipRecordSecurity: true,
	}, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	appData := map[string]*meta.App{}

	for index := range apps {
		app := apps[index]
		appData[app.UniqueKey] = app
	}

	return appData, nil
}

func getMetadataList(metadatatype, namespace, grouping string, session *sess.Session) (map[string]MetadataResponse, error) {
	collectionKeyMap := map[string]MetadataResponse{}

	conditions := meta.BundleConditions{}
	// Special handling for fields for now
	if metadatatype == "fields" {
		conditions["uesio/studio.collection"] = grouping
	} else if metadatatype == "bots" {
		conditions["uesio/studio.type"] = grouping
	} else if metadatatype == "componentvariants" {
		conditions["uesio/studio.component"] = grouping
	}

	collection, err := meta.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		return nil, err
	}

	var appNames []string

	if namespace != "" {
		err = bundle.LoadAll(collection, namespace, conditions, session)
		if err != nil {
			return nil, err
		}
		appNames = []string{namespace}
	} else {
		err := bundle.LoadAllFromAny(collection, conditions, session)
		if err != nil {
			return nil, err
		}
		namespaces := session.GetContextNamespaces()
		appNames = []string{}
		for ns := range namespaces {
			appNames = append(appNames, ns)
		}
	}

	// Create an appMap

	appData, err := getAppData(appNames, session)
	if err != nil {
		return nil, err
	}

	if (namespace == "uesio/core" || namespace == "") && metadatatype == "fields" {
		appInfo, ok := appData["uesio/core"]
		if !ok {
			return nil, errors.New("Could not find app info")
		}
		for _, field := range datasource.BUILTIN_FIELDS {
			collectionKeyMap[field.GetFullName()] = MetadataResponse{
				Color: appInfo.Color,
			}
		}
	}

	err = collection.Loop(func(item loadable.Item, _ string) error {
		bundleable := item.(meta.BundleableItem)
		key := bundleable.GetKey()
		ns := bundleable.GetNamespace()
		// Strip off the grouping part of the key
		if grouping != "" {
			key = strings.TrimPrefix(key, grouping+":")
		}

		appInfo, ok := appData[ns]
		if !ok {
			return errors.New("Could not find app info")
		}
		collectionKeyMap[key] = MetadataResponse{
			Color: appInfo.Color,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return collectionKeyMap, nil

}

func MetadataList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	metadatatype := vars["type"]
	namespace := vars["namespace"]
	grouping := vars["grouping"]

	collectionKeyMap, err := getMetadataList(metadatatype, namespace, grouping, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &collectionKeyMap)

}
