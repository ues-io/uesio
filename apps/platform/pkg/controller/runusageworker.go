package controller

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/usage/usage_worker"
)

func RunUsageWorker(w http.ResponseWriter, r *http.Request) {
	if err := usage_worker.UsageWorker(); err != nil {
		ctlutil.HandleError(w, errors.New("Usage Worker Failed: "+err.Error()))
		return
	}
	fmt.Fprintf(w, "Usage Worker Success")
}
