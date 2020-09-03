// import './PrettyObj.css';

// import React, { useRef, useState, useEffect } from 'react';

// const COLOR_NAME = 'black';
// const COLOR_VALUE = 'black';
// const MAX_PREVIEW_STRING_LENGTH = 50;

// export function PrettyObj({ path, name, value, depth }) {
//   const [isOpen, setIsOpen] = useState(false);
//   if (!depth) {
//     depth = 1;
//   }
//   const isSimpleType =
//     value == null || ['number', 'string', 'boolean'].includes(typeof value);

//   const style = {
//     paddingLeft: `${(depth - 1) * 0.75}rem`,
//   };

//   let children = null;
//   if (isSimpleType) {
//     let displayValue = value;
//     if (typeof value === 'string') {
//       displayValue = `"${value}"`;
//     } else if (typeof value === 'boolean') {
//       displayValue = value ? 'true' : 'false';
//     } else if (value === null) {
//       displayValue = 'null';
//     } else if (value === undefined) {
//       displayValue = 'undefined';
//     }

//     children = (
//       <div key="root" className="Item" path={path} style={style}>
//         <div className="ExpandCollapseToggleSpacer" />
//         <span className="Name">{name}</span>
//         <span className="Value">{displayValue}</span>
//       </div>
//     );
//   } else {
//     if (Array.isArray(value)) {
//       const hasChildren = value.length > 0;
//       const displayName = getMetaValueLabel(value);

//       children = value.map((innerValue, index) => (
//         <KeyValue
//           key={index}
//           alphaSort={alphaSort}
//           depth={depth + 1}
//           inspectPath={inspectPath}
//           isReadOnly={isReadOnly}
//           hidden={hidden || !isOpen}
//           name={index}
//           overrideValueFn={overrideValueFn}
//           path={path.concat(index)}
//           pathRoot={pathRoot}
//           value={value[index]}
//         />
//       ));
//       children.unshift(
//         <div
//           ref={contextMenuTriggerRef}
//           key={`${depth}-root`}
//           className={styles.Item}
//           hidden={hidden}
//           style={style}
//         >
//           {hasChildren ? (
//             <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
//           ) : (
//             <div className={styles.ExpandCollapseToggleSpacer} />
//           )}
//           <span
//             className={styles.Name}
//             onClick={hasChildren ? toggleIsOpen : undefined}
//           >
//             {name}
//           </span>
//           <span
//             className={styles.Value}
//             onClick={hasChildren ? toggleIsOpen : undefined}
//           >
//             {displayName}
//           </span>
//         </div>,
//       );
//     }
//   }
//   return children;
// }

// // Attempts to mimic Chrome's inline preview for values.
// // For example, the following value...
// //   {
// //      foo: 123,
// //      bar: "abc",
// //      baz: [true, false],
// //      qux: { ab: 1, cd: 2 }
// //   };
// //
// // Would show a preview of...
// //   {foo: 123, bar: "abc", baz: Array(2), qux: {…}}
// //
// // And the following value...
// //   [
// //     123,
// //     "abc",
// //     [true, false],
// //     { foo: 123, bar: "abc" }
// //   ];
// //
// // Would show a preview of...
// //   [123, "abc", Array(2), {…}]
// export function formatDataForPreview(
//   data,
//   showFormattedValue,
// ) {
//   if (data != null && hasOwnProperty.call(data, meta.type)) {
//     return showFormattedValue
//       ? data[meta.preview_long]
//       : data[meta.preview_short];
//   }

//   const type = getDataType(data);

//   switch (type) {
//     case 'html_element':
//       return `<${truncateForDisplay(data.tagName.toLowerCase())} />`;
//     case 'function':
//       return truncateForDisplay(
//         `ƒ ${typeof data.name === 'function' ? '' : data.name}() {}`,
//       );
//     case 'string':
//       return `"${data}"`;
//     case 'bigint':
//       return truncateForDisplay(data.toString() + 'n');
//     case 'regexp':
//       return truncateForDisplay(data.toString());
//     case 'symbol':
//       return truncateForDisplay(data.toString());
//     case 'react_element':
//       return `<${truncateForDisplay(
//         getDisplayNameForReactElement(data) || 'Unknown',
//       )} />`;
//     case 'array_buffer':
//       return `ArrayBuffer(${data.byteLength})`;
//     case 'data_view':
//       return `DataView(${data.buffer.byteLength})`;
//     case 'array':
//       if (showFormattedValue) {
//         let formatted = '';
//         for (let i = 0; i < data.length; i++) {
//           if (i > 0) {
//             formatted += ', ';
//           }
//           formatted += formatDataForPreview(data[i], false);
//           if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
//             // Prevent doing a lot of unnecessary iteration...
//             break;
//           }
//         }
//         return `[${truncateForDisplay(formatted)}]`;
//       } else {
//         const length = hasOwnProperty.call(data, meta.size)
//           ? data[meta.size]
//           : data.length;
//         return `Array(${length})`;
//       }
//     case 'typed_array':
//       const shortName = `${data.constructor.name}(${data.length})`;
//       if (showFormattedValue) {
//         let formatted = '';
//         for (let i = 0; i < data.length; i++) {
//           if (i > 0) {
//             formatted += ', ';
//           }
//           formatted += data[i];
//           if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
//             // Prevent doing a lot of unnecessary iteration...
//             break;
//           }
//         }
//         return `${shortName} [${truncateForDisplay(formatted)}]`;
//       } else {
//         return shortName;
//       }
//     case 'iterator':
//       const name = data.constructor.name;
//       if (showFormattedValue) {
//         // TRICKY
//         const array = Array.from(data);

//         let formatted = '';
//         for (let i = 0; i < array.length; i++) {
//           const entryOrEntries = array[i];

//           if (i > 0) {
//             formatted += ', ';
//           }

//           // TRICKY
//           // Browsers display Maps and Sets differently.
//           // To mimic their behavior, detect if we've been given an entries tuple.
//           //   Map(2) {"abc" => 123, "def" => 123}
//           //   Set(2) {"abc", 123}
//           if (Array.isArray(entryOrEntries)) {
//             const key = formatDataForPreview(entryOrEntries[0], true);
//             const value = formatDataForPreview(entryOrEntries[1], false);
//             formatted += `${key} => ${value}`;
//           } else {
//             formatted += formatDataForPreview(entryOrEntries, false);
//           }

//           if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
//             // Prevent doing a lot of unnecessary iteration...
//             break;
//           }
//         }

//         return `${name}(${data.size}) {${truncateForDisplay(formatted)}}`;
//       } else {
//         return `${name}(${data.size})`;
//       }
//     case 'date':
//       return data.toString();
//     case 'object':
//       if (showFormattedValue) {
//         const keys = Object.keys(data).sort(alphaSortKeys);

//         let formatted = '';
//         for (let i = 0; i < keys.length; i++) {
//           const key = keys[i];
//           if (i > 0) {
//             formatted += ', ';
//           }
//           formatted += `${key}: ${formatDataForPreview(data[key], false)}`;
//           if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
//             // Prevent doing a lot of unnecessary iteration...
//             break;
//           }
//         }
//         return `{${truncateForDisplay(formatted)}}`;
//       } else {
//         return '{…}';
//       }
//     case 'boolean':
//     case 'number':
//     case 'infinity':
//     case 'nan':
//     case 'null':
//     case 'undefined':
//       return data;
//     default:
//       try {
//         return truncateForDisplay('' + data);
//       } catch (error) {
//         return 'unserializable';
//       }
//   }
// }

// function truncateForDisplay(string, length = MAX_PREVIEW_STRING_LENGTH) {
//   if (string.length > length) {
//     return string.substr(0, length) + '…';
//   } else {
//     return string;
//   }
// }

// export function alphaSortKeys(a, b) {
//   if (a > b) {
//     return 1;
//   } else if (b > a) {
//     return -1;
//   } else {
//     return 0;
//   }
// }
