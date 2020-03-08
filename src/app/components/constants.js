export const defaultContent = `
<h2>
  Hi there,
</h2>
<p>
  this is a very <em>basic</em> example of bangle. 
  <span data-type="emoji" data-emojikind=":handball_tone4:‍♀️"></span>
  <span data-type="emoji" data-emojikind=":bug:"></span>
</p>
<ul data-type="todo_list">
  <li data-type="todo_item" data-done="false">
    <span class="todo-checkbox" contenteditable="false"></span>
    <div class="todo-content">
      <p>This is a checkbox
      <span data-type="emoji" data-emojikind=":mrs_claus_tone2:"></span>
      </p>
    </div>
  </li>
</ul>
<pre><code>body { display: none; }</code></pre>
<ul>
  <li>
    A regular list
  </li>
  <li>
    With regular items
  </li>
</ul>
<blockquote>
  It's amazing 👏
  <br />
  – mom
</blockquote>
${Array.from(
  { length: 40 },
  (_, k) => `
<p>
this is a very <em>basic</em> example of bangle. 
<span data-type="emoji" data-emojikind=":handball_tone4:‍♀️"></span>
<span data-type="emoji" data-emojikind=":bug:"></span>
</p>
`,
).join('\n')}
`;
