const { walkWorkspace } = require('./workspace-tools');

checkMultipleInstances();
checkPeerDeps();

function checkMultipleInstances() {
  const output = require('child_process')
    .execSync(`yarn info --virtuals --all --json `)
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((r) => JSON.parse(r))
    .filter(
      (r) =>
        r.value.startsWith('@bangle.dev/') ||
        r.value.startsWith('prosemirror-'),
    );
  const faultyDeps = output.filter((r) => r.children.Instances > 1);
  if (faultyDeps.length > 0) {
    console.log('\nPackages with more than one instances');
    console.log(
      faultyDeps
        .map((r) => `  name=${r.value} count=${r.children.Instances}`)
        .join('\n'),
    );
    console.log('\n');
    throw new Error(
      'One or more packages have multiple instances. Please read CONTRIBUTING.md for more info',
    );
  }
}

async function checkPeerDeps() {
  const workspaces = (await walkWorkspace({})).filter((r) => !r.isWorktree);

  for (const workspace of workspaces) {
    for (const peerDep of workspace.peerDeps) {
      if (workspace.deps.includes(peerDep)) {
        throw new Error(
          `In pkg "${workspace.name}" peerDependency "${peerDep}" cannot also be a dependency`,
        );
      }
      if (!workspace.devDeps.includes(peerDep)) {
        throw new Error(
          `In pkg "${workspace.name}" peerDependency "${peerDep}" must also be a devDependency`,
        );
      }
      if (peerDep === '@bangle.dev/utils') {
        throw new Error(
          `In pkg "${workspace.name}" @bangle.dev/utils cannot be a peerDependency`,
        );
      }
    }
  }
}
