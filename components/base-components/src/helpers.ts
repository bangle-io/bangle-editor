// From Prosemirror https://github.com/prosemirror/prosemirror-markdown/blob/6107527995873d6199bc533a753b614378747056/src/to_markdown.ts#L380

// Tries to wrap the string with `"` , if not `''` else `()`
export function quote(str: string) {
  var wrap =
    str.indexOf('"') === -1 ? '""' : str.indexOf("'") === -1 ? "''" : '()';
  return wrap[0] + str + wrap[1];
}
