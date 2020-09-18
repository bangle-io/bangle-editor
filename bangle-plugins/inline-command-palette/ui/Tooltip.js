import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
// import PopperJs from 'popper.js';

export default class Tooltip extends React.PureComponent {
  constructor(props) {
    super(props);

    this.tooltip = window.document.createElement('div');
    this._setupPopper = this._setupPopper.bind(this);
    this._removePopper = this._removePopper.bind(this);
    window.document.body.appendChild(this.tooltip);
  }

  componentDidUpdate() {
    if (this.props.isActive) {
      this._setupPopper();
    } else {
      this._removePopper();
      return ReactDOM.createPortal(null, this.tooltip);
    }
  }

  _setupPopper() {
    if (!this.popperInstance) {
      // this.popperInstance = new  (
      //   this.props.nodeDOM.parentNode,
      //   this.tooltip,
      //   {
      //     placement: 'bottom',
      //   },
      // );
    } else {
      this.popperInstance.scheduleUpdate();
    }
  }

  _removePopper() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
  }

  componentDidMount() {
    document.body.appendChild(this.tooltip);
  }

  componentWillUnmount() {
    this.tooltip.remove();
    if (this.popperInstance) {
      this.popperInstance.destroy();
    }
  }

  render() {
    if (!this.props.isActive) {
      return ReactDOM.createPortal(null, this.tooltip);
    }

    return ReactDOM.createPortal(
      <div style={{ display: 'fixed' }}>
        <div className="dropdown-content">
          {this.props.items.map((item, i) => {
            const isActive = i === this.props.index;
            return (
              <MenuRow
                key={item.title}
                onClick={() => this.props.handleItemClick(i)}
                title={item.title}
                icon={item.icon}
                isActive={isActive}
              />
            );
          })}
        </div>
      </div>,
      this.tooltip,
    );
  }
}

export function MenuRow({ onClick, hint, icon, title, subtitle, isActive }) {
  // if icon is a string it assumes it is a fa-* string
  icon =
    typeof icon === 'string' || !icon ? (
      <span className="icon has-text-dark">
        <i className={`${icon}`} title={icon} />
      </span>
    ) : (
      icon
    );

  return (
    <div
      className={`dropdown-item bangle-menu-row ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
    >
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
  icon: PropTypes.element,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  isActive: PropTypes.bool,
};

Tooltip.propTypes = {
  handleItemClick: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
};
