import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-modern-css/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | my-widget', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<MyWidget />`);

    assert.dom(this.element).hasText('');

    // Template block usage:
    await render(hbs`
      <MyWidget>
        template block text
      </MyWidget>
    `);

    assert.dom(this.element).hasText('template block text');
  });
});
