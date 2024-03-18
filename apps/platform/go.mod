module github.com/thecloudmasters/uesio

go 1.21

require (
	github.com/NYTimes/gziphandler v1.1.1
	github.com/PaesslerAG/gval v1.2.2
	github.com/aws/aws-sdk-go-v2 v1.25.3
	github.com/aws/aws-sdk-go-v2/config v1.26.6
	github.com/aws/aws-sdk-go-v2/credentials v1.16.16
	github.com/aws/aws-sdk-go-v2/feature/s3/manager v1.15.15
	github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider v1.36.1
	github.com/aws/aws-sdk-go-v2/service/s3 v1.48.1
	github.com/bigkevmcd/go-cachewrapper v0.0.0-20200727210054-e5d8068f6a7e
	github.com/dimchansky/utfbom v1.1.1
	github.com/dop251/goja v0.0.0-20230707174833-636fdf960de1
	github.com/evanw/esbuild v0.20.0
	github.com/fatih/color v1.16.0
	github.com/felixge/httpsnoop v1.0.4
	github.com/francoispqt/gojay v1.2.13
	github.com/gofrs/uuid v4.4.0+incompatible
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/golang-migrate/migrate/v4 v4.17.0
	github.com/gomodule/redigo v1.8.9
	github.com/gorilla/mux v1.8.1
	github.com/icza/session v1.2.0
	github.com/jackc/pgx/v5 v5.5.2
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/pkg/errors v0.9.1
	github.com/robfig/cron/v3 v3.0.1
	github.com/sashabaranov/go-openai v1.19.2
	github.com/sendgrid/rest v2.6.9+incompatible
	github.com/spf13/cobra v1.8.0
	github.com/stretchr/testify v1.8.4
	github.com/teris-io/shortid v0.0.0-20220617161101-71ec9f2aa569
	github.com/twmb/murmur3 v1.1.8
	github.com/xeipuuv/gojsonschema v1.2.0
	github.com/zachelrath/yaml-jsonpointer v0.2.0
	golang.org/x/exp v0.0.0-20230315142452-642cacee5cc0
	golang.org/x/oauth2 v0.16.0
	golang.org/x/text v0.14.0
	google.golang.org/api v0.161.0
	gopkg.in/yaml.v3 v3.0.1
)

require (
	cloud.google.com/go/compute v1.23.3 // indirect
	cloud.google.com/go/compute/metadata v0.2.3 // indirect
	github.com/beevik/etree v1.1.0 // indirect
	github.com/crewjam/httperr v0.2.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/go-logr/logr v1.4.1 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-openapi/jsonpointer v0.20.0 // indirect
	github.com/go-openapi/swag v0.22.4 // indirect
	github.com/golang-jwt/jwt/v4 v4.4.3 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/google/pprof v0.0.0-20230705174524-200ffdc848b8 // indirect
	github.com/google/s2a-go v0.1.7 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.3.2 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	github.com/jonboulle/clockwork v0.2.2 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/lib/pq v1.10.9 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/mattermost/xml-roundtrip-validator v0.1.0 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/russellhaering/goxmldsig v1.3.0 // indirect
	github.com/xeipuuv/gojsonpointer v0.0.0-20180127040702-4e3ac2762d5f // indirect
	github.com/xeipuuv/gojsonreference v0.0.0-20180127040603-bd5ef7bd5415 // indirect
	go.opencensus.io v0.24.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.47.0 // indirect
	go.opentelemetry.io/otel v1.22.0 // indirect
	go.opentelemetry.io/otel/metric v1.22.0 // indirect
	go.opentelemetry.io/otel/trace v1.22.0 // indirect
	go.uber.org/atomic v1.11.0 // indirect
	golang.org/x/sync v0.6.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240116215550-a9fa1716bcac // indirect
	google.golang.org/grpc v1.60.1 // indirect
)

require (
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.5.4 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.14.11 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.3.3 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.6.3 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.7.3 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.2.10 // indirect
	github.com/aws/aws-sdk-go-v2/service/bedrockruntime v1.5.6
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.10.4 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.2.10 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.10.10 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.16.10 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.18.7 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.21.7 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.26.7 // indirect
	github.com/aws/smithy-go v1.20.1
	github.com/crewjam/saml v0.4.14
	github.com/dlclark/regexp2 v1.10.0 // indirect
	github.com/go-sourcemap/sourcemap v2.1.3+incompatible // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/icza/mighty v0.0.0-20220812133946-909cba2425e9 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/qdm12/reprint v0.0.0-20200326205758-722754a53494
	github.com/sendgrid/sendgrid-go v3.14.0+incompatible
	github.com/shopspring/decimal v1.3.1 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/stripe/stripe-go v70.15.0+incompatible
	golang.org/x/crypto v0.18.0
	golang.org/x/net v0.20.0 // indirect
	golang.org/x/sys v0.16.0 // indirect
	google.golang.org/appengine v1.6.8 // indirect
	google.golang.org/protobuf v1.32.0 // indirect
)
