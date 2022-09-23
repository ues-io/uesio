package cmd

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	//_ "net/http/pprof"
)

func init() {

	rootCmd.AddCommand(&cobra.Command{
		Use:   "serve",
		Short: "Start Webserver",
		Run:   serve,
	})

}

func siteAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middleware.Authenticate)
	router.Use(middleware.LogRequestHandler)
	return router.Path("").HandlerFunc(f)
}

func siteAndWorkspaceAPI(wr *mux.Router, sr *mux.Router, path string, f http.HandlerFunc, method string) {
	siteAPI(sr, path, f).Methods(method)
	workspaceAPI(wr, path, f).Methods(method)
}

func workspaceAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middleware.Authenticate)
	router.Use(middleware.LogRequestHandler)
	router.Use(middleware.AuthenticateWorkspace)
	return router.Path("").HandlerFunc(f)
}

func versionAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middleware.Authenticate)
	router.Use(middleware.LogRequestHandler)
	router.Use(middleware.AuthenticateVersion)
	return router.Path("").HandlerFunc(f)
}

func siteAdminAPI(r *mux.Router, path string, f http.HandlerFunc) *mux.Route {
	router := r.PathPrefix(path).Subrouter()
	router.Use(middleware.Authenticate)
	router.Use(middleware.LogRequestHandler)
	router.Use(middleware.AuthenticateSiteAdmin)
	return router.Path("").HandlerFunc(f)
}

func getNSParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w*\\/\\w*}", paramName)
}

func getItemParam() string {
	return fmt.Sprintf("%s/{name}", getNSParam("namespace"))
}

func serve(cmd *cobra.Command, args []string) {

	logger.Log("Running serv command!", logger.INFO)
	r := mux.NewRouter()

	// Profiler Info
	// r.PathPrefix("/debug/pprof").Handler(http.DefaultServeMux)

	r.HandleFunc("/fonts/{filename}", controller.Fonts).Methods("GET")
	r.HandleFunc("/static/{filename:.*}", controller.Vendor).Methods("GET")
	r.HandleFunc("/favicon.ico", controller.ServeStatic(filepath.Join("platform", "favicon.ico"))).Methods("GET")
	r.HandleFunc("/health", controller.Health).Methods("GET")

	// The workspace router
	wr := r.PathPrefix("/workspace/" + getNSParam("app") + "/{workspace}").Subrouter()
	// The version router
	vr := r.PathPrefix("/version/" + getNSParam("app") + "/" + getNSParam("namespace") + "/{version}").Subrouter()
	// The site admin router
	sar := r.PathPrefix("/siteadmin/" + getNSParam("app") + "/{site}").Subrouter()
	// The site router
	sr := r.PathPrefix("/site").Subrouter()

	siteAndWorkspaceAPI(wr, sr, "/userfiles/upload", controller.UploadUserFile, "POST")
	siteAndWorkspaceAPI(wr, sr, "/userfiles/delete/{fileid:.*}", controller.DeleteUserFile, "POST")
	siteAndWorkspaceAPI(wr, sr, "/userfiles/download", controller.DownloadUserFile, "GET")
	siteAndWorkspaceAPI(wr, sr, "/wires/load", controller.Load, "POST")
	siteAndWorkspaceAPI(wr, sr, "/wires/save", controller.Save, "POST")
	siteAndWorkspaceAPI(wr, sr, "/bots/call/"+getItemParam(), controller.CallListenerBot, "POST")
	siteAndWorkspaceAPI(wr, sr, "/bots/params/{type}/"+getItemParam(), controller.GetBotParams, "GET")
	siteAndWorkspaceAPI(wr, sr, "/files/"+getItemParam(), controller.ServeFile, "GET")
	siteAndWorkspaceAPI(wr, sr, "/app/"+getNSParam("namespace")+"/{route:.*}", controller.ServeRoute, "GET")
	siteAndWorkspaceAPI(wr, sr, "/routes/collection/"+getItemParam()+"/{viewtype}", controller.CollectionRoute, "GET")
	siteAndWorkspaceAPI(wr, sr, "/routes/collection/"+getItemParam()+"/{viewtype}/{id}", controller.CollectionRoute, "GET")
	siteAndWorkspaceAPI(wr, sr, "/routes/path/"+getNSParam("namespace")+"/{route:.*}", controller.Route, "GET")
	siteAndWorkspaceAPI(wr, sr, "/componentpacks/"+getItemParam()+"/builder", controller.ServeComponentPack(true), "GET")
	siteAndWorkspaceAPI(wr, sr, "/componentpacks/"+getItemParam(), controller.ServeComponentPack(false), "GET")

	workspaceAPI(wr, "/metadata/deploy", controller.Deploy).Methods("POST")
	workspaceAPI(wr, "/metadata/retrieve", controller.Retrieve).Methods("POST", "GET")
	workspaceAPI(wr, "/metadata/generate/"+getItemParam(), controller.GenerateToWorkspace).Methods("POST")
	workspaceAPI(wr, "/metadata/builder/"+getItemParam(), controller.BuilderMetadata).Methods("GET")

	workspaceAPI(wr, "/collections/meta/{collectionname:\\w+\\/\\w+\\.\\w+}", controller.GetCollectionMetadata).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/namespace/"+getNSParam("namespace")+"/list", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/namespace/"+getNSParam("namespace")+"/list/{grouping:\\w+\\/\\w+\\.\\w+}", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/list", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/types/{type}/list/{grouping:\\w+\\/\\w+\\.\\w+}", controller.MetadataList).Methods("GET")
	workspaceAPI(wr, "/metadata/namespaces/{type}", controller.NamespaceList).Methods("GET")
	workspaceAPI(wr, "/metadata/namespaces", controller.NamespaceList).Methods("GET")

	workspaceAPI(wr, "/bulk/job", controller.BulkJob).Methods("POST")
	workspaceAPI(wr, "/bulk/job/{job}/batch", controller.BulkBatch).Methods("POST")

	workspaceAPI(wr, "/views/"+getItemParam()+"/preview", controller.ViewPreview(false)).Methods("GET")
	workspaceAPI(wr, "/views/"+getItemParam()+"/edit", controller.ViewPreview(true)).Methods("GET")

	workspaceAPI(wr, "/configvalues", controller.ConfigValues).Methods("GET")
	workspaceAPI(wr, "/configvalues/{key}", controller.SetConfigValue).Methods("POST")
	workspaceAPI(wr, "/secrets", controller.Secrets).Methods("GET")
	workspaceAPI(wr, "/secrets/{key}", controller.SetSecret).Methods("POST")
	workspaceAPI(wr, "/featureflags", controller.FeatureFlag).Methods("GET")
	workspaceAPI(wr, "/featureflags/{key}", controller.SetFeatureFlag).Methods("POST")
	workspaceAPI(wr, "/{invalidroute:.*}", http.NotFound).Methods("GET")

	versionAPI(vr, "/metadata/generate/{name}", controller.Generate).Methods("POST")
	versionAPI(vr, "/bots/params/{type}/{name}", controller.GetBotParams).Methods("GET")
	versionAPI(vr, "/metadata/types/{type}/list", controller.MetadataList).Methods("GET")
	versionAPI(vr, "/metadata/types/{type}/list/{grouping:\\w+\\/\\w+\\.\\w+}", controller.MetadataList).Methods("GET")
	versionAPI(vr, "/{invalidroute:.*}", http.NotFound).Methods("GET")

	siteAdminAPI(sar, "/configvalues", controller.ConfigValues).Methods("GET")
	siteAdminAPI(sar, "/configvalues/{key}", controller.SetConfigValue).Methods("POST")
	siteAdminAPI(sar, "/secrets", controller.Secrets).Methods("GET")
	siteAdminAPI(sar, "/secrets/{key}", controller.SetSecret).Methods("POST")
	siteAdminAPI(sar, "/featureflags/{user}", controller.FeatureFlag).Methods("GET")
	siteAdminAPI(sar, "/featureflags/{key:\\w+\\/\\w+\\.\\w+}", controller.SetFeatureFlag).Methods("POST")
	siteAdminAPI(sar, "/metadata/namespaces/{type}", controller.NamespaceList).Methods("GET")
	siteAdminAPI(sar, "/metadata/namespaces", controller.NamespaceList).Methods("GET")
	siteAdminAPI(sar, "/collections/meta/{collectionname:\\w+\\/\\w+\\.\\w+}", controller.GetCollectionMetadata).Methods("GET")
	siteAdminAPI(sar, "/metadata/types/{type}/namespace/"+getNSParam("namespace")+"/list", controller.MetadataList).Methods("GET")
	siteAdminAPI(sar, "/metadata/types/{type}/namespace/"+getNSParam("namespace")+"/list/{grouping:\\w+\\/\\w+\\.\\w+}", controller.MetadataList).Methods("GET")
	siteAdminAPI(sar, "/metadata/types/{type}/list", controller.MetadataList).Methods("GET")
	siteAdminAPI(sar, "/metadata/types/{type}/list/{grouping:\\w+\\/\\w+\\.\\w+}", controller.MetadataList).Methods("GET")
	siteAdminAPI(sar, "/wires/load", controller.Load).Methods("POST")
	siteAdminAPI(sar, "/wires/save", controller.Save).Methods("POST")
	siteAdminAPI(sar, "/bulk/job", controller.BulkJob).Methods("POST")
	siteAdminAPI(sar, "/bulk/job/{job}/batch", controller.BulkBatch).Methods("POST")
	siteAdminAPI(sar, "/userfiles/download", controller.DownloadUserFile).Methods("GET")
	siteAdminAPI(sar, "/userfiles/upload", controller.UploadUserFile).Methods("POST")
	siteAdminAPI(sar, "/userfiles/delete/{fileid:.*}", controller.DeleteUserFile).Methods("POST")
	siteAdminAPI(sar, "/{invalidroute:.*}", http.NotFound).Methods("GET")

	siteAPI(sr, "/configvalues/{key}", controller.ConfigValue).Methods("GET")
	siteAPI(sr, "/auth/"+getItemParam()+"/login", controller.Login).Methods("POST")
	siteAPI(sr, "/auth/"+getItemParam()+"/signup", controller.Signup).Methods("POST")
	siteAPI(sr, "/auth/"+getItemParam()+"/forgotpassword", controller.ForgotPassword).Methods("POST")
	siteAPI(sr, "/auth/"+getItemParam()+"/forgotpassword/confirm", controller.ConfirmForgotPassword).Methods("POST")
	siteAPI(sr, "/auth/"+getItemParam()+"/checkavailability/{username}", controller.CheckAvailability).Methods("POST")

	siteAPI(sr, "/auth/logout", controller.Logout).Methods("POST")
	siteAPI(sr, "/auth/check", controller.AuthCheck).Methods("GET")
	siteAPI(sr, "/rest/"+getItemParam(), controller.Rest).Methods("GET")
	siteAPI(sr, "/{invalidroute:.*}", http.NotFound).Methods("GET")
	siteAPI(r, "/{route:.*}", controller.ServeLocalRoute).Methods("GET")

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Verify that required environment variables are set.
	platformDSType := os.Getenv("UESIO_PLATFORM_DATASOURCE_TYPE")
	platformFSType := os.Getenv("UESIO_PLATFORM_FILESOURCE_TYPE")
	platformBSType := os.Getenv("UESIO_PLATFORM_BUNDLESTORE_TYPE")

	if platformDSType == "" {
		logger.Log("No Platform Data Source Type Specified", logger.ERROR)
	}

	if platformFSType == "" {
		logger.Log("No Platform File Source Type Specified", logger.ERROR)
	}

	if platformBSType == "" {
		logger.Log("No Platform Bundle Source Type Specified", logger.ERROR)
	}

	useSSL := os.Getenv("UESIO_USE_HTTPS")
	if useSSL == "true" {
		logger.Log("Service Started over SSL on Port: "+port, logger.INFO)
		err := http.ListenAndServeTLS(":"+port, "ssl/certificate.crt", "ssl/private.key", r)
		if err != nil {
			logger.LogError(err)
		}
	} else {
		logger.Log("Service Started on Port: "+port, logger.INFO)
		err := http.ListenAndServe(":"+port, r)
		if err != nil {
			logger.LogError(err)
		}
	}

	// CORS Stuff we don't need right now
	/*
		err := http.ListenAndServe(":"+port, handlers.CORS(
			handlers.AllowedOrigins([]string{"*"}),
			handlers.AllowedMethods([]string{"*"}),
			handlers.AllowedHeaders([]string{"*"}),
		)(r))
	*/

}
