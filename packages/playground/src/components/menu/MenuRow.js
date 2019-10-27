import './MenuRow.scss';

import React from 'react';

export function MenuRow({ onClick }) {
  return (
    <div className="dropdown-item is-active bangle-menu-row" onClick={onClick}>
      <div className="media">
        <div className="media-left">
          <figure className="image is-32x32">
            <img
              src="https://bulma.io/images/placeholders/96x96.png"
              alt="Placeholder"
            />
          </figure>
        </div>
        <div className="media-content">
          <p className="title is-7">John Smith</p>
          <p className="subtitle is-7">@johnsmith</p>
        </div>
        <div className="media-right">hi</div>
      </div>
    </div>
  );
}
