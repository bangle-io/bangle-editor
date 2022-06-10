const fs = require('fs').promises;
const path = require('path');
const { rootDir, walkWorkspace } = require('./workspace-tools.cjs');
const JSON5 = require('json5');
const mkdirp = require('mkdirp');
updateRootTsConfig();
// updateWorkspaceTsReference();

async function updateWorkspaceTsReference() {
  const workspaces = (await walkWorkspace()).filter((r) => !r.isWorktree);
  const workspacePathMap = Object.fromEntries(
    workspaces.flatMap((workspace) =>
      workspace.topFiles
        .filter((r) => r.includes('tsconfig.json'))
        .flatMap((r) => path.join(workspace.path, r))
        .map((r) => [workspace.name, workspace.path]),
    ),
  );

  for (const workspace of workspaces) {
    if (
      workspace.topFiles.filter((r) => r.includes('tsconfig.json')).length === 0
    ) {
      continue;
    }
    const tsconfigRefs = [];

    const deps = Array.from(
      new Set([...workspace.workspaceDeps, ...workspace.workspaceDevDeps]),
    )
      .map((r) => [r, workspacePathMap[r]])
      .filter((r) => r[1]);

    for (const [depName, depPath] of deps) {
      tsconfigRefs.push(path.join(depPath, 'tsconfig.json'));
    }

    let tsconfigRaw = await fs.readFile(
      path.join(workspace.path, 'tsconfig.json'),
    );

    const tsconfig = JSON5.parse(tsconfigRaw);

    // tsconfig = JSON.parse(tsconfig);
    tsconfig.references = tsconfigRefs
      .sort((a, b) => a.localeCompare(b))
      .map((r) => {
        return { path: path.relative(workspace.path, r) };
      });

    await fs.writeFile(
      path.join(workspace.path, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2),
    );

    const testTsConfig = {
      extends: tsconfig.extends,
      compilerOptions: {
        noEmit: true,
        baseUrl: '.',
        rootDir: '.',
      },
      include: [
        './**/*',
        path.relative(
          workspace.path,
          path.join(rootDir, 'missing-test-types.d.ts'),
        ),
      ],
      references: [
        {
          path: './tsconfig.json',
        },
      ],
    };

    await fs.writeFile(
      path.join(workspace.path, 'tsconfig.test.json'),
      `// DO NOT MODIFY 
// This is an auto-generated by script "yarn update-ts-references"
${JSON.stringify(testTsConfig, null, 2)}`,
    );

    await mkdirp(path.join(workspace.path, '__tests__'));
    await fs.writeFile(
      path.join(workspace.path, '__tests__', 'tsconfig.json'),
      `// DO NOT MODIFY 
// This is an auto-generated by script "yarn update-ts-references"
{
  "extends": "../tsconfig.test.json"
}
`,
    );
  }
}

async function updateRootTsConfig() {
  const workspaces = (await walkWorkspace()).filter((r) => !r.isWorktree);

  console.log(workspaces);

  let paths = Object.fromEntries(
    workspaces.map((w) => [w.name, ['./' + w.location + '/src/index.ts']]),
  );

  console.log(paths);
  // const tsconfigs = workspaces.flatMap((workspace) =>
  //   workspace.topFiles
  //     .filter(
  //       (r) => r.includes('tsconfig.json') || r.includes('tsconfig.test.json'),
  //     )
  //     .flatMap((r) => path.join(workspace.path, r)),
  // );

  const tsconfig = JSON.parse(
    await fs.readFile(path.relative(rootDir, 'tsconfig.json'), 'utf-8'),
  );

  tsconfig.compilerOptions.paths = paths;

  console.log({ tsconfig });
  //   const tsconfigJSON = {
  //     files: [],
  //     references,
  //   };
  await fs.writeFile(
    path.join(rootDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2),
  );
}
