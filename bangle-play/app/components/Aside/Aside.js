import './aside.css';
import React from 'react';
import PropTypes from 'prop-types';
import { ActivityBar } from './ActivityBar';
import { SideBar } from './SideBar';
import { CollapsibleSideBarRow, SideBarRow } from './SideBarRow';
import { BaseButton } from '../Button';
import 'css.gg/icons/css/chevron-down.css';
import { ChevronDown, ChevronRight } from '../Icons/index';

export class Aside extends React.PureComponent {
  static propTypes = {
    children: PropTypes.element,
    createBlankDocument: PropTypes.func.isRequired,
    deleteDocumentFromDisk: PropTypes.func.isRequired,
    documentsInDisk: PropTypes.array.isRequired,
    isSidebarOpen: PropTypes.bool.isRequired,
    openDocument: PropTypes.func.isRequired,
    openedDocuments: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        docName: PropTypes.string,
      }).isRequired,
    ).isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    toggleTheme: PropTypes.func.isRequired,
  };

  static propTypes = {};

  generateRows = () => {
    const isUnique =
      [...new Set(this.props.documentsInDisk.map((r) => r.docName))].length !==
      this.props.documentsInDisk;
    if (!isUnique) {
      throw new Error('Must be unique');
    }
    const children = this.props.documentsInDisk
      .filter((r) => r)
      .sort((a, b) => b.created - a.created)
      .map((r) => ({
        ...r,
        title: r.title,
      }))
      .map((item) => (
        <SideBarRow
          key={item.docName}
          onClick={() => this.props.openDocument(item.docName)}
          title={item.title}
          isActive={this.props.openedDocuments.find(
            (r) => r.docName === item.docName,
          )}
          rightIcon={[
            <BaseButton
              key="delete"
              className="text-gray-600 hover:text-gray-900"
              faType="fas fa-times-circle "
              onClick={async (e) => {
                e.stopPropagation();
                await this.props.deleteDocumentFromDisk(item.docName);
              }}
            />,
          ]}
        />
      ));

    return (
      <CollapsibleSideBarRow
        title="master"
        isSticky={true}
        leftIcon={<ChevronDown style={{ width: 16, height: 16 }} />}
        activeLeftIcon={<ChevronRight style={{ width: 16, height: 16 }} />}
      >
        {children}
      </CollapsibleSideBarRow>
    );
  };
  render() {
    return (
      <>
        <ActivityBar {...this.props} />
        {this.props.isSidebarOpen ? (
          <SideBar {...this.props}>{this.generateRows()}</SideBar>
        ) : null}
      </>
    );
  }
}
