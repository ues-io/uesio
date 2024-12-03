package controller

import (
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/ns"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getMetadataList(metadatatype, namespace, grouping string, session *sess.Session) (map[string]ns.MetadataResponse, error) {
	collectionKeyMap := map[string]ns.MetadataResponse{}

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
		err = bundle.LoadAll(collection, namespace, &bundlestore.GetAllItemsOptions{
			Conditions: conditions,
		}, session, nil)
		if err != nil {
			return nil, err
		}
		appNames = []string{namespace}
	} else {
		err := bundle.LoadAllFromAny(collection, &bundlestore.GetAllItemsOptions{
			Conditions: conditions,
		}, session, nil)
		if err != nil {
			return nil, err
		}
		namespaces := session.GetContextNamespaces()
		appNames = []string{}
		appNames = append(appNames, namespaces...)
	}

	appData, err := datasource.GetAppData(session.Context(), appNames, nil)
	if err != nil {
		return nil, err
	}

	if (namespace == "uesio/core" || namespace == "") && metadatatype == "fields" {
		collectionKey, ok := conditions["uesio/studio.collection"]
		if ok {
			stringVal := goutils.StringValue(collectionKey)
			if stringVal != "" {
				// Only add built-in fields if we're grouping on a collection
				datasource.AddAllBuiltinFields(collection, stringVal)
			}
		}
	}

	if err = collection.Loop(func(item meta.Item, _ string) error {
		bundleable := item.(meta.BundleableItem)
		key := bundleable.GetKey()
		bns := bundleable.GetNamespace()
		label := bundleable.GetLabel()
		// Strip off the grouping part of the key
		if grouping != "" {
			key = strings.TrimPrefix(key, strings.ToLower(grouping)+":")
		}

		appInfo, ok := appData[bns]
		if !ok {
			return exceptions.NewNotFoundException("Could not find app info for " + bns)
		}
		collectionKeyMap[key] = ns.MetadataResponse{
			NamespaceInfo: appInfo,
			Key:           key,
			Label:         label,
		}
		return nil
	}); err != nil {
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
		ctlutil.HandleError(w, err)
		return
	}

	filejson.RespondJSON(w, r, &collectionKeyMap)

}
