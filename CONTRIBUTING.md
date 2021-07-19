I have poured my :heart: to this project and nothing gives me more joy to see someone contribute to it with the shared goal of making Bangle.dev better.

## Code

### Dev setup

Bangle uses `yarn` v2 which provides the feature of zero-install which mean you would not have to run `yarn install` everytime you checkout the code, every thing should just run.

```sh
# start the docs website
yarn start

# to run tests
yarn test
```

## Documentation

### API

The API documentation for each package is expected in to be inside an `api.md` file at the same level as the `package.json` of that package. The repository [bangle.dev-website](https://github.com/bangle-io/bangle.dev-website) takes care of building and templating the api docs.

For templating we use [handlebars](https://handlebarsjs.com) and a configuration file [`api-docs.config.js`](https://github.com/bangle-io/bangle.dev-website/blob/main/api-docs.config.js). The config includes a bunch of shorthands & helper functions which are used by [handlebars](https://handlebarsjs.com) to generate the final product.

### Steps to do a release

- Bump up the version in the file `constraints.pro`.

- Run `yarn update-versions`.

- Due to a bug in yarn there might be redundant items added in the `package.json` `workspaces` field -- Remove them.

- Update the changelog.

- Run `yarn release-packages`.
