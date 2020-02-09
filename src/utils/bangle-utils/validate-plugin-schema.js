import v from '@mapbox/fusspot';

export function validatePluginSchema(schema) {
  v.assert(
    v.strictShape({
      menu: v.strictShape({
        rows: v.arrayOf(
          v.shape({
            icon: v.required(v.any()),
            title: v.required(v.string),
            subtitle: v.required(v.string),
            hint: v.string,
            getCommand: v.required(v.func),
            isEnabled: v.func,
          }),
        ),
      }),
    }),
  )(schema);
}
