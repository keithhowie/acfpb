# Angular & Cloud Firestore Playbook

### Resources

- Angular Quickstart: https://angular.io/guide/quickstart
- Firebase Console: https://console.firebase.google.com/

## Tactics

### Generate a skeleton app
Use `ng new` to create your app.

### Add necessary dependencies
- Angular Firestore: https://github.com/angular/angularfire2/blob/master/README.md
- Angular Material: https://material.angular.io/guide/getting-started

### Configuration targets
When using `ng serve` or `ng build`, the `configuration` option allows you to specify which environment to use, i.e. `--configuration=production`

### Generating Components etc
`ng new component <name>` will create a new component. You may want to consider arranging these within `Modules`.

### Modules & Routing
Modules allow organisation of components in whatever structure seems necessary. It's handy to combine this with `Routing`, especially child routes.

### App / Library Projects
You can create further apps or library projects (with shared code) within the same workspace if you need to. See the Angular docs on [file structure](https://angular.io/guide/file-structure) and [workspace configuration](https://angular.io/guide/workspace-config).

### Keeping up-to-date
Angular uses a feature called Schematics to allow structural project upgrades, making it easy to keep referencesup to date. Use `ng upgrade` to check for and update features.

## Firebase Authentication
Firebase allows you to use a good ol' email/password combo or various external identity providers including Google, Facebook, Twitter & Github. Whichever you choose, you get an authenticated user which works seamlessly with the rest of the framework. View the [docs](https://firebase.google.com/docs/auth/) for more info.

Bear in mind, there is a user enumeration vulnerability with Firebase Auth (the API methods will return meaningful results when asked to create a user which already exists, or email a password reset to an user which doesn't exist, for example).

### Email address verification
You can build in an email verification step if you wish, with Firebase sending out a templated verification email on behalf of the app.

### Forgotten Passwords
Password reset is handled by a simple Firebase API call.



## Data Structure
There's no right or wrong way to structure your data, although if you have years of experience normalising data to store in SQL databases, I'd strongly advise forgetting all of it.

Each document has an ID, and it is helpful to store these IDs in other documents as references, however there is no referential integrity (and you probably don't need it).

### Maps
Simple: property - value. Can be queried with equality/range operators.

### Arrays
Simple: An array of values (of any type). Can be queried with `array-contains` operator.

### Sub-Collections
Any document can have 'sub collections'; each being another set of documents which is accessible hierarchically. A query can only work on one collection, so you cannot query a parent & child collection in one call, or multiple sub-collections in one go for instance. This is the single most important thing to consider when structuring your data.

### Replicated Data
Get over it! You will end up with duplication. It's best not to wrestle with your data too much. Try to capture everything you need from a user in a sensible form structure, store it like that and move on.

### Querying
Multiple equality queries can be combined, along with one `orderby` or one range filter. Everything is ANDed togther. If you find yourself needing an OR query, consider a different data structure or adding derived properties to documents, i.e. given a status property which can have the values (a,b,c,z) and a requirement `status == 'a' OR status == 'Z'`, add another property, 'statusIsAorZ' and query for `statusIsAorZ == true`. Alternatively, combine two result sets using rxjs.

### Indexing
Indexing is mostly free, save for the compound requirements mentioned above. The database will combine existing indices to satisfy queries - this can be utilised to minimise the number of indices required while maximising the supported query combinations.

## Rules
Cloud Firestore rules allow complete control over who does what with your data. Remember that your *public* client app code contains a identifier which points it to the correct database. This could be used to access the database in an unintended or malicious fashion. User auth and Rules are all that you have to keep things straight.

### Validate User ID
In a security rule, specifying `request.auth.uid == request.resource.data.uid` (for a write) or `request.auth.uid == resource.data.uid` (for reads) is a basic start for documents owned by a single user. Other scenarios may involve storing an array of legitimate user IDs in the document. If this would be unmanagable, then you could store a document per user, containing the IDs of accessible documents.

### Public Create & Get Access, No List Access
In order to store a document which an unauthenticated user can read, but others can't, don't allow list access on documents in that collection. In this way, in order to access any document, someone would need to know the exact document ID (which is hard to guess and time consuming to brute-force).

### Write-Only
If allowing a user to update a particular document is necessary but would be overwhelmingly difficult to manage with rules, consider allowing the user to add a document to a sub-collection with write-only prviliges. In this way, a cloud function can be used to perform whatever action is necessary, plus you get a nice audit log.

## Search
Cloud Firestore is ace at storing and querying data but it's designed for scale, not whacky queries which might take ages to run.

### Enter Algolia
Algolia is ace at free text search! In order to use it, you must push a bit of your data on to an Algolia `index` from a Cloud Firestore function, which you can then query form the app client code. Look at [this article](https://firebase.google.com/docs/firestore/solutions/search#adding_security) for more information. Rather than using an HTTP Cloud Function to generate a secured API key though, I'd recommend generating the key as your users sign up or are updated (using a Cloud Firestore function).

## Storage
Cloud Firestore Storage allows simple hierarchical data storage with no ability to query. Upload a Storgae doc and store its location in Firestore document.

### Security Rules
More rules! Defined in a similar way to Cloud Firestore, except user access must be controlled differently, as these rules cannot access the Firestore database.

### User Claim Tokens
Instead, you can access user 'tokens', which can take any value. For instance, you may add tokens to a user for 'userid' and/or 'groupid'. When uploading a Storage doc, include the 'userid' or 'groupid' in the doc's `metadata`. You can then write a rule which allows access only if `request.auth.token.userid == request.resource.metadata.userid` for instance.

## Cloud Functions
### Unhindered Access

## Cron Jobs
[Google App Engine Cron Jobs](https://cloud.google.com/appengine/docs/standard/nodejs/scheduling-jobs-with-cron-yaml) allow scheduled invocation of App Engine http functions. You'll want to use Node.js in the Standard environment.

### App Engine Function
Create a function which will be invoked according to the cron schedule. Ensure that the caller is indeed the cron schedulr by checking the `X-Appengine-Cron` header is set to true (this header is stripped from external requests therefore can't be spoofed). This function will simply poke a message at a Pub/Sub topic of your choice.

### Pub/Sub to Cloud Function
Create a Cloud Firestore Function which is triggered from a Pub/Sub message from the above topic. See [this example](https://github.com/FirebaseExtended/functions-cron).

## Concurrency
### Transactions
### Conditional Updates

## Hosting

## Integration
### Stripe
### Email
### PDF Generation

## rxjs
### Examples