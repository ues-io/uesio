package file

import (
	"bytes"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ServeComponentPackFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	resourceVersion := vars["version"]
	path := vars["filename"]

	session := middleware.GetSession(r)

	componentPack := meta.NewBaseComponentPack(namespace, name)
	connection, err := datasource.GetPlatformConnection(&wire.MetadataCache{}, session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	if err = bundle.Load(componentPack, nil, session, nil); err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	buf := &bytes.Buffer{}
	fileMeta, err := bundle.GetItemAttachment(buf, componentPack, "dist/"+path, session, connection)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	lastModified := *fileMeta.LastModified()

	// Get the greater of the two modification times
	if lastModified.Unix() < componentPack.UpdatedAt {
		lastModified = time.Unix(componentPack.UpdatedAt, 0)
	}

	usePath := "pack.js"
	if path != "runtime.js" && strings.HasSuffix(path, ".json") {
		usePath = path
	}
	if path == "runtime.css" {
		usePath = path
	}

	respondFile(w, r, &FileRequest{
		Path:         usePath,
		LastModified: lastModified,
		Namespace:    namespace,
		Version:      resourceVersion,
	}, bytes.NewReader(buf.Bytes()))
}
