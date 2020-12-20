// rollup.config.js
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

const config = {
  input: 'core/index.js',
  output: [
    // {
    //   // file: 'dist/index.js',
    //   format: 'es',
    //   sourcemap: true,
    //   plugins: [
    //     getBabelOutputPlugin({
    //       plugins: [
    //         ['@babel/plugin-proposal-class-properties', { loose: true }],
    //       ],
    //       presets: [
    //         [
    //           '@babel/preset-env',
    //           {
    //             targets: { esmodules: true },
    //             bugfixes: true,
    //             loose: true,
    //           },
    //         ],
    //       ],
    //     }),
    //   ],
    // },
    {
      // file: 'dist/index.cjs.js',
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      plugins: [
        getBabelOutputPlugin({
          plugins: [
            ['@babel/plugin-proposal-class-properties', { loose: true }],
          ],
          presets: [
            [
              '@babel/preset-env',
              {
                targets: { esmodules: true },
                bugfixes: true,
                loose: true,
              },
            ],
          ],
        }),
      ],
    },
  ],
};

export default config;
