import './MenuRow.scss';
import PropTypes from 'prop-types';
import React from 'react';

export function MenuRow({
  onClick,
  rightText,
  iconType,
  iconLabel,
  title,
  subtitle,
}) {
  return (
    <div className="dropdown-item is-active bangle-menu-row " onClick={onClick}>
      <div className="media">
        {iconType && (
          <div className="media-left">
            <span className={`icon has-text-grey-dark`}>
              <i className={`fas fa-${iconType}`} title={iconLabel} />
            </span>
          </div>
        )}
        <div className="media-content">
          <p className="title is-6">{title}</p>
          <p className="subtitle is-7 ">{subtitle}</p>
        </div>
        {rightText && (
          <div className="media-right is-6 has-text-grey-dark">
            <p>{rightText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

MenuRow.propTypes = {
  onClick: PropTypes.func.isRequired,
  rightText: PropTypes.string,
  iconType: PropTypes.string,
  iconLabel: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};
