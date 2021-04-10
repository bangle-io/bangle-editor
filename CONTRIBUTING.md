I have poured my :heart: to this project and nothing gives me more joy to see someone contribute to it with the shared goal of making Bangle.dev better.

## Code

### Dev setup

Bangle uses `yarn` v2 which provides the feature of zero-install which mean you would not have to run `yarn install` everytime you checkout the code, every thing should just run.

```sh
# start the playground
yarn start

# start the docs website
yarn website:start

# to run tests
yarn test
```

## Documentation

### API

The API documentation for each package is expected in to be inside an `api.md` file at the same level as the `package.json` of that package.

The script `yarn run scripts:build-docs` takes care of finding all the `api.md` file, running them through our templating engine and then putting the generated `.md` files in the `_bangle-website/docs` directory.

For templating we use [handlebars](https://handlebarsjs.com) and a configuration file `api-docs.config.js`. The config includes a bunch of shorthands & helper functions which are used by [handlebars](https://handlebarsjs.com) to generate the final product.

### Steps to do a release

- Bump up the version in the file `constraints.pro`.

- Run `yarn update-versions`.

- Due to a bug in yarn there might be redundant items added in the `package.json` `workspaces` field -- Remove them.

- Update the changelog.

- Run `yarn release-packages`.
