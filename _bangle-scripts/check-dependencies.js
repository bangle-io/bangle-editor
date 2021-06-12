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

checkMultipleInstances();
