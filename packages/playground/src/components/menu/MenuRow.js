import './MenuRow.scss';
import PropTypes from 'prop-types';
import React from 'react';

export function MenuRow({ onClick, hint, icon, title, subtitle }) {
  // if icon is a string it assumes it is a fa-* string
  icon =
    typeof icon === 'string' || !icon ? (
      <span className="icon has-text-grey-dark">
        <i className={`${icon}`} title={icon} />
      </span>
    ) : (
      icon
    );

  return (
    <div className="dropdown-item is-active bangle-menu-row" onClick={onClick}>
      <div className="media">
        <div className="media-left">{icon}</div>
        <div className="media-content">
          <p className="title is-6">{title}</p>
          <p className="subtitle is-7 ">{subtitle}</p>
        </div>
        {hint && (
          <div className="media-right is-6 has-text-grey-dark">
            <p>{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

MenuRow.propTypes = {
  onClick: PropTypes.func.isRequired,
  hint: PropTypes.string,
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};
