package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getMetadataList(metadatatype, namespace, grouping string, session *sess.Session) (map[string]datasource.MetadataResponse, error) {
	collectionKeyMap := map[string]datasource.MetadataResponse{}

	conditions, err := meta.GetGroupingConditions(metadatatype, grouping)
	if err != nil {
		return nil, err
	}

	collection, err := meta.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		return nil, err
	}

	var appNames []string

	if namespace != "" {
		err = bundle.LoadAll(collection, namespace, conditions, session, nil)
		if err != nil {
			return nil, err
		}
		appNames = []string{namespace}
	} else {
		err := bundle.LoadAllFromAny(collection, conditions, session, nil)
		if err != nil {
			return nil, err
		}
		namespaces := session.GetContextNamespaces()
		appNames = []string{}
		for _, ns := range namespaces {
			appNames = append(appNames, ns)
		}
	}

	appData, err := datasource.GetAppData(appNames)
	if err != nil {
		return nil, err
	}

	if (namespace == "uesio/core" || namespace == "") && metadatatype == "fields" {
		appInfo, ok := appData["uesio/core"]
		if !ok {
			return nil, errors.New("Could not find app info for uesio/core")
		}
		for _, field := range datasource.BUILTIN_FIELDS {
			collectionKeyMap[field.GetFullName()] = datasource.MetadataResponse{
				NamespaceInfo: appInfo,
				Key:           field.GetFullName(),
			}
		}
	}

	err = collection.Loop(func(item meta.Item, _ string) error {
		bundleable := item.(meta.BundleableItem)
		key := bundleable.GetKey()
		ns := bundleable.GetNamespace()
		// Strip off the grouping part of the key
		if grouping != "" {
			key = strings.TrimPrefix(key, grouping+":")
		}

		appInfo, ok := appData[ns]
		if !ok {
			return errors.New("Could not find app info for " + ns)
		}
		collectionKeyMap[key] = datasource.MetadataResponse{
			NamespaceInfo: appInfo,
			Key:           key,
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

	file.RespondJSON(w, r, &collectionKeyMap)

}
