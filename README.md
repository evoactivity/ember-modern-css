# Ember + Modern CSS

Forget everything you know about CSS + Ember. If you use any of the following `ember-postcss`, `ember-css-modules`, `ember-component-css` then this guide is for you.

Together we are going to take an embroider enabled Ember app and configure a webpack pipeline for our application's CSS using PostCSS and tailwind.

This guide will not go over enabling embroider in your application, I will be using a fresh ember app with full embroider compatibility (route splitting included).

An example app is available at https://github.com/evoactivity/ember-modern-css

## Goal

An ember app using tailwind with livereload and full tailwind JIT compatibility. This will be achieved with webpack's `postcss-loader` addon, opening up the rest of the postcss ecosystem.

## Benefits

Using webpack to bundle our CSS opens up our Ember app to the rest of the CSS ecosystem. We no longer need to reach for the addons mentioned above or write our own addons for dealing with the ember-cli CSS pipeline. We just ignore the legacy CSS pipeline and by doing so we get some easy wins.

1. Route split, lazy loading CSS
2. CSS Modules out of the box
3. If a webpack addon exists you can use it (more on this in future articles)

## Dependencies

We are aiming to use tailwind and PostCSS so we must install them both along with some other dependencies.

```bash
npm add postcss postcss-loader tailwindcss autoprefixer cssnano --save-dev
```

Create our config files in the project root

```js
// ./postcss.config.js

const env = process.env.EMBER_ENV || 'development';

const plugins = [
  require('tailwindcss/nesting'),
  require('tailwindcss')({ config: './tailwind.config.js' }),
  require('autoprefixer'),
];

if (env === 'production') {
  plugins.push(
    require('cssnano')({
      preset: 'default',
    })
  );
}

module.exports = {
  plugins,
};
```

```js
// ./tailwind.config.js

const path = require('node:path');
const defaultTheme = require('tailwindcss/defaultTheme');
const appEntry = path.join(__dirname, 'app');
const relevantFilesGlob = '**/*.{html,js,ts,hbs,gjs,gts}';

module.exports = {
  content: [path.join(appEntry, relevantFilesGlob)],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
```

We need to tell eslint these are node files, open `.eslintrc.js`

```js
// .eslintrc.js
  // ...
  overrides: [
  // node files
  {
    files: [
      './.eslintrc.js',
      './.prettierrc.js',
      './.template-lintrc.js',
      './ember-cli-build.js',
      './testem.js',
      './blueprints/*/index.js',
      './config/**/*.js',
      './lib/*/index.js',
      './server/**/*.js',
      // add new config files
      './postcss.config.js',
      './tailwind.config.js',
    ],
  // ...
```

## Webpack Configuration

Assuming you already have embroider installed and fully compatible we need to update the webpack config. Open `ember-cli-build.js`

Near the bottom your should have your embroider config

```js
return require('@embroider/compat').compatBuild(app, Webpack, {
  staticAddonTestSupportTrees: true,
  staticAddonTrees: true,
  staticHelpers: true,
  staticModifiers: true,
  staticComponents: true,
  splitAtRoutes: ['route1', 'route2'],
  packagerOptions: {
    webpackConfig: {},
  },
  extraPublicTrees: [],
});
```

Let's add our new config, I have added comments to each line

```js
function isProduction() {
  return EmberApp.env() === 'production';
}

return require('@embroider/compat').compatBuild(app, Webpack, {
  staticAddonTestSupportTrees: true,
  staticAddonTrees: true,
  staticHelpers: true,
  staticModifiers: true,
  staticComponents: true,
  splitAtRoutes: ['route1', 'route2'],
  packagerOptions: {
    // publicAssetURL is used similarly to Ember CLI's asset fingerprint prepend option.
    publicAssetURL: '/',
    // Embroider lets us send our own options to the style-loader
    cssLoaderOptions: {
      // don't create source maps in production
      sourceMap: isProduction() === false,
      // enable CSS modules
      modules: {
        // global mode, can be either global or local
        // we set to global mode to avoid hashing tailwind classes
        mode: 'global',
        // class naming template
        localIdentName: isProduction()
          ? '[sha512:hash:base64:5]'
          : '[path][name]__[local]',
      },
    },
    webpackConfig: {
      module: {
        rules: [
          {
            // When webpack sees an import for a CSS files
            test: /\.css$/i,
            exclude: /node_modules/,
            use: [
              {
                // use the PostCSS loader addon
                loader: 'postcss-loader',
                options: {
                  sourceMap: isProduction() === false,
                  postcssOptions: {
                    config: './postcss.config.js',
                  },
                },
              },
            ],
          },
        ],
      },
    },
  },
  extraPublicTrees: [],
});
```

## Let's talk directory structure

### Legacy `./styles` and `./styles/app.css`

`ember-cli` expects `styles/app.css` to exist, but we do not want any css inside of this file. Just an empty app.css is required.

We cannot delete this directory or file and we cannot import from this directory so for all intents and purposes this directory does not exist.

Hopefully we can delete one day.

### New `./assets` directory

Since we have limitations on our `./styles` directory this will be where our entrypoint CSS is going to be created.

```bash
mkdir -p app/assets && touch app/assets/styles.css
```

Let's add our tailwind styles

```css
/* ./app/assets/styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Importing CSS

We now need to import our CSS into our application. We are going to import our CSS into our `./app.js`. The reason for this is to ensure load order when we build for production. Webpack injects `<link>` tags in the order they are imported and we want our entrypoint to always be first.

```js
import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'ember-modern-css/config/environment';
// import our applications style entrypoint
import './assets/styles.css';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
```

At this point your should have tailwind installed and your CSS will rebuild on changes to your templates and js files.

## CSS Modules

Now that we can import our CSS files we can make use CSS modules with our components.

Say we have

```
./app/components/my-widget/
  - index.js
  - index.hbs
```

We can co-locate our styles along side our components.

```
./app/components/my-widget/
  - index.js
  - index.hbs
  - styles.css
```

```css
/* We mark the classes we want hashed with :local() */
:local(.root) {
  background: red;
}

:local(.anotherHashedClass) {
  background: green;
}

.normalClass {
  background: blue;
}
```

Open your component's index.js

```js
import Component from '@glimmer/component';
// import our styles, this time named
import styles from './styles.css';

export default class MyWidget extends Component {
  // we need our styles to be accessible from our template
  // so add a property in your class.
  styles = styles;
}
```

When built our `.root` class will become something like `.h4e` so we need to lookup the correct class string. `styles` is created as a property of the component, giving us access to `{{this.styles.myClassName}}` in our template.

```hbs
<h1 class={{this.styles.root}}>Widget</h1>
```

This can become tedious when using longer or multiple classes, or mixing hashed classes with non-hashed classes

Wouldn't it be nice if instead of this

```hbs
<h1
  class={{concat
    this.styles.root
    ' '
    this.styles.anotherHashedClass
    ' bg-red-100 mb-10'
  }}
>Widget</h1>
```

We could write

```hbs
<h1
  class='{{styles this "root anotherHashedClass"}} bg-red-100 mb-10'
>Widget</h1>
```

So let's create a helper

```bash
ember g helper styles
```

```js
import Helper from '@ember/component/helper';

export default class Styles extends Helper {
  compute(params) {
    const [context, classNames] = params;

    if (typeof context?.styles === 'undefined') {
      console.error(
        'Import and assign your styles to your component class or controller class'
      );
      return '';
    }

    const classString = classNames
      .split(' ')
      .map((name) => {
        if (context?.styles && context?.styles[name]) {
          return context.styles[name];
        }

        console.error(`The class or id named '${name}' does not exist`);

        return '';
      })
      .join(' ');

    return classString;
  }
}
```

We can now update our template

```hbs
<h1 class={{styles this 'root'}}>Widget</h1>
```

## Typescript

If you are using typescript in your project it will complain about not being able to import .css files. To remedy this we need to tell typescript what to expect when importing a css file.

Open your `global.d.ts` and add

```typescript
declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}
```

## Next Steps

You can now customise your PostCSS and Tailwind configs, add your own PostCSS addons and make it work for you and your team.

Once you have your CSS modernized I would suggest managing your images and fonts in a similar way. That will be my next article, using webpack's `asset/loader` for fonts and `responsive-image-loader` to generate responsive images from a single image import.
