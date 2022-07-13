import EmberRouter from '@embroider/router';
import config from 'ember-modern-css/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('route1');
  this.route('route2');
});
