package file

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func respondFile(w http.ResponseWriter, r *http.Request, path string, modified time.Time, stream io.ReadSeeker) {
	if stream == nil {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "application/json")
		resp := make(map[string]string)
		resp["message"] = "Resource Not Found"
		jsonResp, err := json.Marshal(resp)
		if err != nil {
			slog.Error(err.Error())
		}
		w.Write(jsonResp)
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("; filename=\"%s\"", path))

	http.ServeContent(w, r, path, modified, stream)
}

func ServeFileContent(file *meta.File, path string, w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	if err := bundle.Load(file, nil, session, connection); err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	if path == "" {
		path = file.Path
	}

	rs, fileMetadata, err := bundle.GetItemAttachment(file, path, session, connection)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	defer rs.Close()

	usage.RegisterEvent("DOWNLOAD", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, 0, session)
	usage.RegisterEvent("DOWNLOAD_BYTES", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, fileMetadata.ContentLength(), session)

	middleware.Set1YearCache(w)

	respondFile(w, r, path, fileMetadata.LastModified(), rs)
}

func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	file := meta.NewBaseFile(vars["namespace"], vars["name"])
	path := vars["path"]
	ServeFileContent(file, path, w, r)
}
