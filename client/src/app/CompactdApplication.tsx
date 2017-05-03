import * as React from 'react';
import { render } from "react-dom";
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import { CompactdState } from 'definitions';
import LibraryView from 'features/library/components/LibraryView';

interface ICompactdApplicationProps {
  store: Redux.Store<CompactdState>;
}
export class CompactdApplication extends
  React.Component<ICompactdApplicationProps, {}> {

  render (): JSX.Element {
    return <Provider store={this.props.store}>
      <LibraryView />
    </Provider>;
  }
}
