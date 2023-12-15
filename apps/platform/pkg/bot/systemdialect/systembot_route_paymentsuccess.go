package systemdialect

import (
	"time"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runPaymentSuccessRouteBot(route *meta.Route, uesioSession *sess.Session) (*meta.Route, error) {

	paymentRoute := &meta.Route{
		BundleableBase: meta.BundleableBase{
			Namespace: "uesio/studio",
			Name:      "userpayments",
		},
		ViewRef: "uesio/studio.userpayments",

		Path:     "mypayments",
		ThemeRef: "uesio/studio.default",
		Params:   nil,
	}
	anonSession := sess.GetStudioAnonSession(uesioSession.Context())
	stripeKey, err := datasource.GetSecretFromKey("uesio/studio.stripe_key", anonSession)
	if err != nil {
		return paymentRoute, nil
	}
	stripe.Key = stripeKey
	checkoutSessionID := route.Params["session_id"]

	checkoutSession, err := session.Get(checkoutSessionID, nil)
	if err != nil {
		return paymentRoute, nil
	}

	if checkoutSession.PaymentStatus != "paid" {
		return paymentRoute, nil
	}

	payment := &meta.Payment{
		User: &meta.User{
			BuiltIn: meta.BuiltIn{
				ID: checkoutSession.ClientReferenceID,
			},
		},
		Date:    time.Now().Format("2006-01-02"),
		Total:   float64(checkoutSession.AmountTotal) / 100,
		Payment: checkoutSession.PaymentIntent.ID,
	}

	err = datasource.PlatformSaveOne(payment, nil, nil, uesioSession)
	if err != nil {
		return paymentRoute, nil
	}

	return route, nil
}
