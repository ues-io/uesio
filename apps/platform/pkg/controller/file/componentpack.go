package file

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func ServeComponentPackFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	resourceVersion := vars["version"]
	path := vars["filename"]

	session := middleware.GetSession(r)

	componentPack := meta.NewBaseComponentPack(namespace, name)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	if err = bundle.Load(componentPack, nil, session, nil); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	rs, fileMeta, err := bundle.GetItemAttachment(componentPack, "dist/"+path, session, connection)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	defer rs.Close()

	lastModified := fileMeta.LastModified()

	// Get the greater of the two modification times
	if lastModified.Unix() < componentPack.UpdatedAt {
		lastModified = time.Unix(componentPack.UpdatedAt, 0)
	}

	respondFile(w, r, &FileRequest{
		Path:         path,
		LastModified: lastModified,
		Namespace:    namespace,
		Version:      resourceVersion,
	}, rs)
}
