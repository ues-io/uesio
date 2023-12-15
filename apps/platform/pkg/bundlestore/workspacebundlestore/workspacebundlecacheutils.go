package workspacebundlestore

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const WorkspaceMetadataChangesChannel = "workspacemetadatachanges"

type WorkspaceMetadataChange struct {
	AppName        string
	WorkspaceID    string
	CollectionName string
	ChangedItems   []string
}

var doCache bool
var bundleStoreCache *bundle.BundleStoreCache

func init() {
	// Default to using workspace bundle caching
	doCache = os.Getenv("UESIO_CACHE_WORKSPACE_BUNDLES") != "false"
	if doCache {
		// For the workspace bundle store, cache entries should be short-lived
		bundleStoreCache = bundle.NewBundleStoreCache(10*time.Minute, 10*time.Minute)
		// Listen for changes to workspace metadata, and invalidate items in the cache as needed
		go setupPlatformSubscription()
	}
}

func setupPlatformSubscription() {
	i := 0
	for i < 500 {
		if adapter, err := adapt.GetAdapter(meta.PLATFORM_DATA_SOURCE); err != nil || adapter == nil {
			i++
			time.Sleep(time.Millisecond * 2)
		} else {
			break
		}
	}
	s := getMinimumViableSession()
	conn, err := datasource.GetPlatformConnection(nil, s, nil)
	if err != nil {
		slog.Error("unable to establish platform connection! " + err.Error())
		panic("unable to establish platform connection!")
	}

	if err = conn.Subscribe(WorkspaceMetadataChangesChannel, handleWorkspaceMetadataChange); err != nil {
		slog.Error("unable to subscribe on channel! " + err.Error())
		panic("unable to subscribe on channel!")
	}
}

func getMinimumViableSession() *sess.Session {
	coreApp := &meta.App{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "uesio/core",
		},
		FullName: "uesio/core",
		Name:     "core",
	}
	s := sess.New("wsbundlecache", &meta.User{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "system",
		},
	}, &meta.Site{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "studio",
		},
		Name: "prod",
		Bundle: &meta.Bundle{
			BuiltIn: meta.BuiltIn{
				UniqueKey: "uesio/core:0:0:1",
			},
			Major: 0,
			Minor: 0,
			Patch: 1,
			App:   coreApp,
		},
		App: coreApp,
	})
	s.SetGoContext(context.Background())
	return s
}

func handleWorkspaceMetadataChange(payload string) {
	var wmc WorkspaceMetadataChange
	unmarshalErr := json.Unmarshal([]byte(payload), &wmc)
	if unmarshalErr != nil {
		slog.Error("unable to unmarshal workspace metadata change payload: " + unmarshalErr.Error())
	} else {
		for _, itemKey := range wmc.ChangedItems {
			if err := bundleStoreCache.InvalidateCacheItem(wmc.AppName, wmc.WorkspaceID, wmc.CollectionName, itemKey); err != nil {
				slog.Error("Unable to purge workspace metadata cache key: " + err.Error())
			}
		}
	}
}
