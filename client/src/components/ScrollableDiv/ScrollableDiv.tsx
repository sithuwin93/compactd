import * as React from 'react'
import './ScrollableDiv.scss';
import * as classnames from 'classnames';

class ScrollableDiv extends React.Component<{
  offset?: number;
  className?: string;
  binding?: any;
  divRef?: (div: HTMLDivElement) => void;
},{}> {
  private div: HTMLDivElement;
  componentDidMount () {
    window.addEventListener('resize', (evt) => {
      window.requestAnimationFrame(() => {
        this.updateHeight();
      })
    });
    this.updateHeight();
    setTimeout(() => {
      this.updateHeight()
    }, 200);
  }
  componentWillReceiveProps () {
    this.updateHeight();
  }
  updateHeight () {
    this.div.style.height =
      (window.innerHeight
        - this.div.getBoundingClientRect().top
        + (this.props.offset || 0)
        - this.div.parentElement.scrollTop) + "px";
  }
  componentDidUpdate () {
    this.updateHeight();
  }
  render () {
    return <div ref={(ref) =>{
      this.div = ref;
      if (this.props.divRef) this.props.divRef(ref);
    }} className={
        classnames("scrollable-div", this.props.className || '')
      }>
      {this.props.children}
    </div>
  }
}

export default ScrollableDiv;
