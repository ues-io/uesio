package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getMetadataList(metadatatype, namespace, grouping string, session *sess.Session) (map[string]routing.MetadataResponse, error) {
	collectionKeyMap := map[string]routing.MetadataResponse{}

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
		for _, ns := range namespaces {
			appNames = append(appNames, ns)
		}
	}

	appData, err := routing.GetAppData(appNames, session)
	if err != nil {
		return nil, err
	}

	if (namespace == "uesio/core" || namespace == "") && metadatatype == "fields" {
		appInfo, ok := appData["uesio/core"]
		if !ok {
			return nil, errors.New("Could not find app info")
		}
		for _, field := range datasource.BUILTIN_FIELDS {
			collectionKeyMap[field.GetFullName()] = appInfo
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
		collectionKeyMap[key] = appInfo
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
