import { module, test } from 'qunit';
import { setupTest } from 'ember-modern-css/tests/helpers';

module('Unit | Route | route1', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:route1');
    assert.ok(route);
  });
});
