# Pizza42



● The security team would like to offload credential management to the identity solution. Securing their infrastructure is complex and storing credentials raises the level of liability. 

-> Talk about Auth0 benefits, security, 99% availability etc
https://auth0.com/security
https://auth0.com/availability-trust
https://status.auth0.com/

● The product team would like the identity solution to provide a frictionless and customizable login experience. They would like turnkey password reset functionality to reduce help desk call volume. They would also like to provide customers the option to login with their social login provider.

-> Talk about universal login, automatic password reset, built in social login
https://auth0.com/learn/social-login/
https://auth0.com/docs/authenticate/login/auth0-universal-login
https://auth0.com/docs/authenticate/database-connections/password-change

● The marketing team would like the identity solution to enrich customer data as users login. Customer data will be used to drive marketing campaigns to deepen their already loyal customer base and appeal to new customers.

-> Progresive profiling use case
https://auth0.com/blog/how-profile-enrichment-and-progressive-profiling-can-boost-your-marketing/
User meta


Complete the Login portion of the quick start so our Pizza customers can sign in.

-> This is just downloading the SDK, setting the callbacks and adding an auth0.config.json file

Complete the Call an API portion of the quick start so our Pizza customers can store
orders in their profile.

```
// Initialize a management client
var ManagementClient = require('auth0').ManagementClient;
// Setup domain and point to the M2M test app
// Give proper scopes for updating metadata
var auth0 = new ManagementClient({
    domain: "pocsetup.us.auth0.com",
    clientId: "Rkr5gvfOfQI6GgA3y90U8KIjBFlcEPkJ",
    clientSecret: '8hpb1FLclLjimjt5uXA0WH4uP36NT9aSh5XPOlrWYX3BfXQuOpo-ngIUknceRGtN',
    scope: 'read:users update:users'
});

exports.updateUserMetadata = (userId, pizzaName) => {

    auth0
        .getUser(userId)
        // console.log(userId)
        .then(function (user) {
            var currentMetadata = user[0].user_metadata;
            //console.log (currentMetadata)
            if (typeof currentMetadata !== 'undefined' && currentMetadata !== null) {
               // add the pizza to the order
                currentMetadata.Orders.push(pizzaName);
            } else {
                // Otherwise metadata is set to the orders object
                currentMetadata = {
                    Orders: [pizzaName]
                }
            }

            var params = { id: userId };
            var metadata = currentMetadata;

            auth0.updateUserMetadata(params, metadata, function (err, user) {
                if (err) {
                    console.log(err);
                }

                // Verify the user was updated
                console.log(user);
            });
        })
        .catch(function (err) {
            console.log(err);
        });
}
```

Give new customers the option to sign up and existing customers to sign in with either
email/password or a social identity provider such as Google.

-> This is done in the dashboard

Require that a customer have a verified email address before placing a pizza order. This
shouldn’t prevent them from signing into the application.

-> Use the rule template for adding email to access token, then just make a namespaced claim based on the user object

```
function addEmailToAccessToken(user, context, callback) {
  // This rule adds the authenticated user's email address to the access token.

  var namespace = 'https://quickstarts/api/';
	context.accessToken[namespace + 'email'] = user.email;
	context.accessToken[namespace + 'verified'] = user.email_verified;
         
  return callback(null, user, context);
}
```
--> Then, make sure that this is required before calling the API 

The API endpoint servicing the orders request must require a valid token as well as a
specific scope for the operation to complete.


```
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

app.post("/api/external", checkJwt, (req, res) => {
  var userId = req.user['sub'];
 // Add a custom rule
 // The namespaced claim will point to the /verified endpoint
   if (!req.user['https://quickstarts/api/verified']) {
     console.log(userId)
     res.send({
         msg: "Sorry, only verified emails may place an order. Please make sure to verify your email!"         

     });
   }
  
});
```


```
const callApi = async (pizzaName) => {
  try {
    const token = await auth0.getTokenSilently();

    
    var pizzaOrder = {
      pizzaName: pizzaName
    }
  // console.log(pizzaOrder)
    const response = await fetch("/api/external", {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pizzaOrder)
    });
```
--> Scope is set in management.js
```var auth0 = new ManagementClient({
    domain: "pocsetup.us.auth0.com",
    clientId: "Rkr5gvfOfQI6GgA3y90U8KIjBFlcEPkJ",
    clientSecret: '8hpb1FLclLjimjt5uXA0WH4uP36NT9aSh5XPOlrWYX3BfXQuOpo-ngIUknceRGtN',
    scope: 'read:users update:users'
});
```

After an order is placed, save the order to the user’s Auth0 profile for future reference.
```
  // Update metadata for the user
 else{
  autho0Mgmt.updateUserMetadata(userId, req.body.pizzaName);
  res.send({
    msg: "Thank you for your order"
  });
 }
```

