import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { config, Change, EventContext } from 'firebase-functions';
import { firestore } from 'firebase-admin';
import * as algoliasearch from 'algoliasearch';
const client = algoliasearch(config().algolia.id, config().algolia.admin.key);

export class ThingHelper {
  static updateThing(fs: firestore.Firestore) {
    return async (change: Change<DocumentSnapshot>, context: EventContext) => {

      // search index
      const index = client.initIndex('things');
      if (change.after.exists) {
        return index.addObject({
          objectID: change.after.id,
          property1: change.after.get('property1'),
          property2: change.after.get('property2'),
          etc: change.after.get('etc')
        }); //updates if it exists
      } else {
        return index.deleteObject(change.after.id);
      }
    }
  }
}