package cmd

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/thecloudmasters/uesio/pkg/controller/oauth"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/worker"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"

	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
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

func getNSParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+\\/\\w+}", paramName)
}

func getFullItemParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+\\/\\w+\\.\\w+}", paramName)
}

func getMetadataItemParam(paramName string) string {
	return fmt.Sprintf("{%s:\\w+}", paramName)
}

func getFullItemOrTextParam(paramName string) string {
	return fmt.Sprintf("{%s:(?:\\w+\\/\\w+\\.)?\\w+}", paramName)
}

var appParam = getNSParam("app")
var nsParam = getNSParam("namespace")
var nameParam = getMetadataItemParam("name")
var itemParam = fmt.Sprintf("%s/%s", nsParam, nameParam)
var versionParam = "{version:(?:v[0-9]+\\.[0-9]+\\.[0-9]+)|(?:[a-z0-9]{8,})}"

// Version will either be a Uesio bundle version string, e.g. v1.2.3,
// Or an 8-character short Git sha, e.g. abcd1234
var versionedItemParam = fmt.Sprintf("%s/%s/%s", nsParam, versionParam, nameParam)

// Grouping values can either be full Uesio items (e.g. <user>/<app>.<name>) or simple values, e.g. "LISTENER",
// so the regex here needs to support both
var groupingParam = getFullItemOrTextParam("grouping")
var collectionParam = getFullItemParam("collectionname")

var (
	staticPrefix = "/static"
)

// Vendored scripts live under /static but do NOT get the GITSHA of the Uesio app,
// because they are not expected to change with the GITSHA, but are truly static, immutable
const vendorPrefix = "/static/vendor"

func serve(cmd *cobra.Command, args []string) {

	slog.Info("Starting Uesio server")
	r := mux.NewRouter()

	cwd, err := os.Getwd()
	if err != nil {
		slog.Error("Failed to obtain working directory")
		panic("Failed to obtain working directory")
	}

	// If we have gitsha, append that to the prefixes to enable us to have versioned assets
	gitsha := os.Getenv("GITSHA")
	cacheSiteBundles := os.Getenv("UESIO_CACHE_SITE_BUNDLES")
	cacheStaticAssets := false
	staticAssetsPath := ""
	if gitsha != "" {
		staticAssetsPath = "/" + gitsha
	} else if cacheSiteBundles == "true" {
		staticAssetsPath = fmt.Sprintf("/%d", time.Now().Unix())
	}
	if staticAssetsPath != "" {
		cacheStaticAssets = true
		file.SetAssetsPath(staticAssetsPath)
		staticPrefix = staticAssetsPath + staticPrefix
	}

	// Profiler Info
	// r.PathPrefix("/debug/pprof").Handler(http.DefaultServeMux)

	r.Handle(vendorPrefix+"/{filename:.*}", file.ServeVendor(vendorPrefix, cacheStaticAssets)).Methods(http.MethodGet)
	r.Handle(staticPrefix+"/{filename:.*}", file.Static(cwd, staticPrefix, cacheStaticAssets)).Methods(http.MethodGet)
	r.HandleFunc("/health", controller.Health).Methods(http.MethodGet)

	//r.HandleFunc("/api/weather", testapis.TestApi).Methods(http.MethodGet, http.MethodPost, http.MethodDelete)

	// The workspace router
	workspacePath := fmt.Sprintf("/workspace/%s/{workspace}", appParam)
	wr := r.PathPrefix(workspacePath).Subrouter()
	wr.Use(
		middleware.AttachRequestToContext,
		middleware.Authenticate,
		middleware.LogRequestHandler,
		middleware.AuthenticateWorkspace,
	)

	// The version router
	versionPath := fmt.Sprintf("/version/%s/%s", appParam, versionParam)
	vr := r.PathPrefix(versionPath).Subrouter()
	vr.Use(
		middleware.AttachRequestToContext,
		middleware.Authenticate,
		middleware.LogRequestHandler,
		middleware.AuthenticateVersion,
	)

	// The site admin router
	siteAdminPath := fmt.Sprintf("/siteadmin/%s/{site}", appParam)
	sa := r.PathPrefix(siteAdminPath).Subrouter()
	sa.Use(
		middleware.AttachRequestToContext,
		middleware.Authenticate,
		middleware.LogRequestHandler,
		middleware.AuthenticateSiteAdmin,
	)

	// The site router
	sr := r.PathPrefix("/site").Subrouter()
	sr.Use(
		middleware.AttachRequestToContext,
		middleware.Authenticate,
		middleware.LogRequestHandler,
	)

	// The local router
	lr := r.NewRoute().Subrouter()
	lr.Use(
		middleware.AttachRequestToContext,
		middleware.Authenticate,
		middleware.LogRequestHandler,
	)

	// SEO Routes
	lr.HandleFunc("/robots.txt", controller.Robots).Methods(http.MethodGet)
	lr.HandleFunc("/favicon.ico", controller.Favicon).Methods(http.MethodGet)

	// OAuth routes
	sr.HandleFunc("/oauth2/callback", oauth.Callback).Methods(http.MethodGet)
	wr.HandleFunc(fmt.Sprintf("/oauth2/authorize/%s", itemParam), oauth.GetRedirectMetadata).Methods(http.MethodGet)
	sr.HandleFunc(fmt.Sprintf("/oauth2/authorize/%s", itemParam), oauth.GetRedirectMetadata).Methods(http.MethodGet)
	sa.HandleFunc(fmt.Sprintf("/oauth2/authorize/%s", itemParam), oauth.GetRedirectMetadata).Methods(http.MethodGet)
	vr.HandleFunc(fmt.Sprintf("/oauth2/authorize/%s", itemParam), oauth.GetRedirectMetadata).Methods(http.MethodGet)
	if env.InDevMode() {
		// Add a mock oauth2 token server for testing. Someday this could be a real server
		// but for now we just need it for integration tests
		sr.HandleFunc("/oauth2/token", oauth.GetOAuthToken).Methods(http.MethodPost)
	}

	// Userfile routes for site and workspace context
	userfileUploadPath := "/userfiles/upload"
	sr.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)
	wr.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)
	sa.HandleFunc(userfileUploadPath, file.UploadUserFile).Methods(http.MethodPost)

	userfileDeletePath := "/userfiles/delete/{fileid:.*}"
	sr.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)
	wr.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)
	sa.HandleFunc(userfileDeletePath, file.DeleteUserFile).Methods(http.MethodPost)

	userfileDownloadPath := "/userfiles/download"
	sr.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)
	wr.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)
	sa.HandleFunc(userfileDownloadPath, file.DownloadUserFile).Methods(http.MethodGet)

	attachmentDownloadPath := "/attachment/{recordid}/{version}/{path:.*}"
	sr.HandleFunc(attachmentDownloadPath, file.DownloadAttachment).Methods(http.MethodGet)
	wr.HandleFunc(attachmentDownloadPath, file.DownloadAttachment).Methods(http.MethodGet)
	sa.HandleFunc(attachmentDownloadPath, file.DownloadAttachment).Methods(http.MethodGet)

	// Wire load and save routes for site and workspace context
	wireLoadPath := "/wires/load"
	sr.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)
	wr.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)
	sa.HandleFunc(wireLoadPath, controller.Load).Methods(http.MethodPost)

	wireSavePath := "/wires/save"
	sr.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)
	wr.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)
	sa.HandleFunc(wireSavePath, controller.Save).Methods(http.MethodPost)

	// Bot routes for site and workspace context
	callBotPath := fmt.Sprintf("/bots/call/%s", itemParam)
	sr.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)
	wr.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)
	sa.HandleFunc(callBotPath, controller.CallListenerBot).Methods(http.MethodPost)

	botParamPath := fmt.Sprintf("/bots/params/{type}/%s", itemParam)
	sr.HandleFunc(botParamPath, controller.GetBotParams).Methods(http.MethodGet)
	wr.HandleFunc(botParamPath, controller.GetBotParams).Methods(http.MethodGet)

	// Get app-specific type definition files
	wr.HandleFunc("/retrieve/types", controller.RetrieveAppTypes).Methods(http.MethodGet)

	// Run Integration Action routes for site and workspace context
	runIntegrationActionPath := fmt.Sprintf("/integrationactions/run/%s", itemParam)
	describeActionsPath := fmt.Sprintf("/integrationactions/describe/%s", itemParam)
	sr.HandleFunc(runIntegrationActionPath, controller.RunIntegrationAction).Methods(http.MethodPost)
	wr.HandleFunc(runIntegrationActionPath, controller.RunIntegrationAction).Methods(http.MethodPost)
	wr.HandleFunc(describeActionsPath, controller.DescribeIntegrationAction).Methods(http.MethodGet)

	viewParamPath := fmt.Sprintf("/views/params/%s", itemParam)
	wr.HandleFunc(viewParamPath, controller.GetViewParams).Methods(http.MethodGet)
	routeParamPath := fmt.Sprintf("/routes/params/%s", itemParam)
	wr.HandleFunc(routeParamPath, controller.GetRouteParams).Methods(http.MethodGet)

	//
	// File (actual metadata, not userfiles) routes for site and workspace context

	// Versioned file serving routes
	versionedFilesPath := fmt.Sprintf("/files/%s", versionedItemParam)
	sr.HandleFunc(versionedFilesPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedFilesPath, file.ServeFile).Methods(http.MethodGet)

	// Un-versioned file serving routes - for backwards compatibility, and for local development
	filesPath := fmt.Sprintf("/files/%s", itemParam)
	sr.HandleFunc(filesPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(filesPath, file.ServeFile).Methods(http.MethodGet)

	versionedFilesPathWithPath := fmt.Sprintf("/files/%s/{path:.*}", versionedItemParam)
	sr.HandleFunc(versionedFilesPathWithPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedFilesPathWithPath, file.ServeFile).Methods(http.MethodGet)

	filesPathWithPath := fmt.Sprintf("/files/%s/{path:.*}", itemParam)
	sr.HandleFunc(filesPathWithPath, file.ServeFile).Methods(http.MethodGet)
	wr.HandleFunc(filesPathWithPath, file.ServeFile).Methods(http.MethodGet)

	// Explicit namespaced route page load access for site and workspace context
	serveRoutePath := fmt.Sprintf("/app/%s/{route:.*}", nsParam)
	sr.HandleFunc(serveRoutePath, controller.ServeRoute)
	wr.HandleFunc(serveRoutePath, controller.ServeRoute)
	serveRouteByKey := fmt.Sprintf("/r/%s", itemParam)
	sr.HandleFunc(serveRouteByKey, controller.ServeRouteByKey)
	wr.HandleFunc(serveRouteByKey, controller.ServeRouteByKey)

	// Route navigation apis for site and workspace context
	collectionRoutePath := fmt.Sprintf("/routes/collection/%s/{viewtype}", itemParam)
	sr.HandleFunc(collectionRoutePath, controller.RouteAssignment).Methods(http.MethodGet)
	wr.HandleFunc(collectionRoutePath, controller.RouteAssignment).Methods(http.MethodGet)
	sr.HandleFunc(collectionRoutePath+"/{id}", controller.RouteAssignment).Methods(http.MethodGet)
	wr.HandleFunc(collectionRoutePath+"/{id}", controller.RouteAssignment).Methods(http.MethodGet)

	pathRoutePath := fmt.Sprintf("/routes/path/%s/{route:.*}", nsParam)
	sr.HandleFunc(pathRoutePath, controller.RouteByPath).Methods(http.MethodGet)
	wr.HandleFunc(pathRoutePath, controller.RouteByPath).Methods(http.MethodGet)

	routeByKey := fmt.Sprintf("/routes/key/%s", itemParam)
	sr.HandleFunc(routeByKey, controller.RouteByKey).Methods(http.MethodGet)
	wr.HandleFunc(routeByKey, controller.RouteByKey).Methods(http.MethodGet)

	// NOTE: Gorilla Mux requires use of non-capturing groups, hence the use of ?: here
	componentPackFileSuffix := "/{filename:[a-zA-Z0-9\\-_]+\\.(?:json|js|xml|txt|css){1}(?:\\.map)?}"

	// Un-versioned Component pack routes - for backwards compatibility, and for local development
	componentPackPath := fmt.Sprintf("/componentpacks/%s", itemParam)
	sr.HandleFunc(componentPackPath+componentPackFileSuffix, file.ServeComponentPackFile).Methods(http.MethodGet)
	wr.HandleFunc(componentPackPath+componentPackFileSuffix, file.ServeComponentPackFile).Methods(http.MethodGet)

	// Versioned component pack file routes
	versionedComponentPackPath := fmt.Sprintf("/componentpacks/%s", versionedItemParam)

	versionedComponentPackFinal := versionedComponentPackPath + componentPackFileSuffix

	sr.HandleFunc(versionedComponentPackFinal, file.ServeComponentPackFile).Methods(http.MethodGet)
	wr.HandleFunc(versionedComponentPackFinal, file.ServeComponentPackFile).Methods(http.MethodGet)

	fontFileSuffix := "/{filename:.*}"

	fontPath := fmt.Sprintf("/fonts/%s", versionedItemParam)

	fontFinal := fontPath + fontFileSuffix

	sr.HandleFunc(fontFinal, file.ServeFontFile).Methods(http.MethodGet)
	wr.HandleFunc(fontFinal, file.ServeFontFile).Methods(http.MethodGet)

	// Workspace context specific routes
	wr.HandleFunc("/metadata/deploy", controller.Deploy).Methods(http.MethodPost)
	wr.HandleFunc("/metadata/generate/"+itemParam, controller.GenerateToWorkspace).Methods(http.MethodPost)
	wr.HandleFunc("/metadata/builder/"+itemParam, controller.BuilderMetadata).Methods(http.MethodGet)
	wr.HandleFunc("/data/truncate", controller.Truncate).Methods(http.MethodPost)

	// List All Available Namespaces
	metadataRetrievePath := "/metadata/retrieve"
	wr.HandleFunc(metadataRetrievePath, controller.Retrieve).Methods(http.MethodGet, http.MethodPost)
	vr.HandleFunc(metadataRetrievePath, controller.Retrieve).Methods(http.MethodGet, http.MethodPost)

	// Get Collection Metadata (We may be able to get rid of this someday...)
	collectionMetadataPath := fmt.Sprintf("/collections/meta/%s", collectionParam)
	wr.HandleFunc(collectionMetadataPath, controller.GetCollectionMetadata).Methods(http.MethodGet)
	sa.HandleFunc(collectionMetadataPath, controller.GetCollectionMetadata).Methods(http.MethodGet)

	// List All Available Namespaces
	namespaceListPath := "/metadata/namespaces"
	wr.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	sa.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	vr.HandleFunc(namespaceListPath, controller.NamespaceList).Methods(http.MethodGet)
	wr.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)
	sa.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)
	vr.HandleFunc(namespaceListPath+"/{type}", controller.NamespaceList).Methods(http.MethodGet)

	// List All Namespace Items
	itemListPath := "/metadata/types/{type}/list"
	sr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	wr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(itemListPath, controller.MetadataList).Methods(http.MethodGet)

	itemListPathWithGrouping := fmt.Sprintf("/metadata/types/{type}/list/%s", groupingParam)
	sr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	wr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(itemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)

	nsItemListPath := fmt.Sprintf("/metadata/types/{type}/namespace/%s/list", nsParam)
	sr.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)
	wr.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(nsItemListPath, controller.MetadataList).Methods(http.MethodGet)

	nsItemListPathWithGrouping := fmt.Sprintf("/metadata/types/{type}/namespace/%s/list/%s", nsParam, groupingParam)
	wr.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	sa.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)
	vr.HandleFunc(nsItemListPathWithGrouping, controller.MetadataList).Methods(http.MethodGet)

	// Bulk Job Routes
	bulkJobPath := "/bulk/job"
	wr.HandleFunc(bulkJobPath, controller.BulkJob).Methods(http.MethodPost)
	sa.HandleFunc(bulkJobPath, controller.BulkJob).Methods(http.MethodPost)

	bulkBatchPath := "/bulk/job/{job}/batch"
	wr.HandleFunc(bulkBatchPath, controller.BulkBatch).Methods(http.MethodPost)
	sa.HandleFunc(bulkBatchPath, controller.BulkBatch).Methods(http.MethodPost)

	// View Preview Routes
	viewPath := fmt.Sprintf("/views/%s", itemParam)
	wr.HandleFunc(viewPath+"/preview", controller.ViewPreview(false)).Methods(http.MethodGet)
	wr.HandleFunc(viewPath+"/edit", controller.ViewPreview(true)).Methods(http.MethodGet)

	// Version context specific routes
	vr.HandleFunc("/metadata/generate/"+itemParam, controller.Generate).Methods("POST")
	vr.HandleFunc("/bots/params/{type}/"+itemParam, controller.GetBotParams).Methods("GET")

	// Auth Routes
	sr.HandleFunc("/auth/"+itemParam+"/createlogin", controller.CreateLogin).Methods("POST")
	sa.HandleFunc("/auth/"+itemParam+"/createlogin", controller.CreateLogin).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/login", controller.Login).Methods("POST")
	wr.HandleFunc("/auth/"+itemParam+"/login", controller.Login).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/signup", controller.Signup).Methods("POST")
	sa.HandleFunc("/auth/"+itemParam+"/resetpassword", controller.ResetPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/resetpassword", controller.ResetPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/resetpassword/confirm", controller.ConfirmResetPassword).Methods("POST")
	sr.HandleFunc("/auth/"+itemParam+"/signup/confirm", controller.ConfirmSignUp).Methods("GET")
	wr.HandleFunc("/auth/credentials/"+itemParam, controller.DeleteAuthCredentials).Methods("DELETE")
	sr.HandleFunc("/auth/credentials/"+itemParam, controller.DeleteAuthCredentials).Methods("DELETE")
	sa.HandleFunc("/auth/credentials/"+itemParam, controller.DeleteAuthCredentials).Methods("DELETE")
	sr.HandleFunc("/auth/logout", controller.Logout).Methods("POST")
	sr.HandleFunc("/auth/check", controller.AuthCheck).Methods("GET")

	sr.HandleFunc("/auth/"+itemParam+"/requestlogin", controller.RequestLogin).Methods("GET")
	wr.HandleFunc("/auth/"+itemParam+"/requestlogin", controller.RequestLogin).Methods("GET")

	// Experimental REST api route
	sr.HandleFunc("/rest/"+itemParam, controller.Rest).Methods("GET")

	// Bundles
	bundleVersionsListPath := fmt.Sprintf("/bundles/v1/versions/%s/list", appParam)
	sr.HandleFunc(bundleVersionsListPath, controller.BundleVersionsList).Methods("GET")
	sr.HandleFunc("/bundles/v1/list", controller.BundlesList).Methods("GET")
	bundleRetrievePath := fmt.Sprintf("/bundles/v1/retrieve/%s/%s", appParam, versionParam)
	sr.HandleFunc(bundleRetrievePath, controller.BundlesRetrieve).Methods("GET")

	// Dev Only Routes
	if env.InDevMode() {
		// Allow for running the usage worker immediately
		sr.HandleFunc("/worker/usage", controller.RunUsageWorker).Methods("POST")
		// Display some stats about the app's performance
		sr.HandleFunc("/perf/stats", controller.GetPerfStats).Methods("GET")
		sr.HandleFunc("/perf/stats/reset", controller.ResetPerfStats).Methods("POST")
	}

	// REST API routes
	sr.HandleFunc("/api/v1/collection/"+itemParam, controller.DeleteRecordApi).Methods("DELETE")
	sa.HandleFunc("/api/v1/collection/"+itemParam, controller.DeleteRecordApi).Methods("DELETE")

	// Add Invalid Routes to all subrouters to give 404s
	invalidPath := "/{invalidroute:.*}"
	sr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	wr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	sa.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)
	vr.HandleFunc(invalidPath, http.NotFound).Methods(http.MethodGet, http.MethodPost)

	// Special handling for local routes
	lr.HandleFunc("/{route:.*}", controller.ServeLocalRoute)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	// Host can be blank by default, but in local development it should be set to "localhost"
	// to prevent the annoying "Allow incoming connections" firewall warning on Mac OS
	host := os.Getenv("HOST")
	serveAddr := host + ":" + port

	// Universal middlewares
	r.Use(middleware.GZip())

	server := controller.NewServer(serveAddr, r)
	var serveErr error

	done := make(chan bool)
	go func() {
		if tls.ServeAppWithTLS() {
			slog.Info("Service started over TLS on port: " + port)
			serveErr = server.ListenAndServeTLS(tls.GetSelfSignedCertFilePath(), tls.GetSelfSignedPrivateKeyFile())
		} else {
			slog.Info("Service started on port: " + port)
			serveErr = server.ListenAndServe()
		}
		// CORS Stuff we don't need right now
		/*
			err := http.ListenAndServe(":"+port, handlers.CORS(
				handlers.AllowedOrigins([]string{"*"}),
				handlers.AllowedMethods([]string{"*"}),
				handlers.AllowedHeaders([]string{"*"}),
			)(r))
		*/
		if serveErr != nil && serveErr.Error() != "http: Server closed" {
			slog.Error("Failed to start server: " + serveErr.Error())
			// this will terminate the server without waiting for graceful shutdown
			server.StartupError()
		}
		done <- true
	}()

	if os.Getenv("UESIO_WORKER_MODE") == "combined" {
		slog.Info("Running worker combined with web server")
		go func() {
			worker.ScheduleJobs()
		}()
	}

	// wait for graceful shutdown to complete
	server.WaitShutdown()

	<-done

}
