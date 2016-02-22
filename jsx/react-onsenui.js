const util = window.ons._util;

var OnsNavigator = React.createClass({
  displayName: 'OnsNavigator',

  componentDidMount: function () {
    this.counter = 0;
    var node = this.node = ReactDOM.findDOMNode(this);
    var page = this.props.children;

    this.init = true;

    if (!reactUtil.rendersToOnsPage(page)) {
      throw new Error("OnsNavigator has to contain exactly one child of type OnsPage");
    }

    var lastLink = window.OnsNavigatorElement.rewritables.link;
    window.OnsNavigatorElement.rewritables.link = (function (navigatorElement, target, options, callback) {
      if (this.init) {
        console.log('init');
        this.init = false;
        node.firstChild.innerHTML = node.firstChild._initialHTML;
        console.log('html');
        console.log(node.firstChild.innerHTML);
      }

      lastLink(navigatorElement, target, options, callback);
    }).bind(this);

    this.elements = [];
    this.elements.push({ elem: this.props.children });

    this.myDom = ReactDOM.render(React.createElement(
      'ons-navigator',
      this.props,
      page
    ), node);
  },

  resetToPage: function (reactPage, options) {
    var page = arguments.length > 0 ? reactPage : this.elements[0].elem;
    this.elements = [];
    this.elements.push({ elem: page });

    var node = this.node;
    this.node.firstChild.children[0].style.display = 'block';

    var htmlString = ReactDOMServer.renderToStaticMarkup(page);

    if (options == undefined) {
      options = {};
    }
    options.pageHTML = htmlString;

    var children = [];
    for (var i = 0; i < this.node.firstChild.children.length; i++) {
      children.push(this.node.firstChild.children[i].cloneNode(true));
    }

    var node = this.node;

    this.node.firstChild.resetToPage('', options).then((function () {
      var newNode = node.firstChild.children[0];
      for (var i = 0; i < children.length; i++) {
        children[i].style.display = i == 0 ? 'block' : 'none';
        node.firstChild.insertBefore(children[i], newNode);
      }

      this.myDom = ReactDOM.render(React.createElement(
        'ons-navigator',
        this.props,
        page
      ), node);

      node.firstChild.removeChild(newNode);
      node.firstChild._pages[0].element = node.firstChild.children[0];
    }).bind(this));
  },

  popPage: function (options) {
    var navNode = ReactDOM.findDOMNode(this).firstChild;
    var lastChild = reactUtil.lastChild(this.node.firstChild).cloneNode(true);

    navNode.popPage(options).then((function () {

      console.log('pop');

      this.elements.pop();
      var help = [];

      lastChild.style.display = 'none';

      // this can happen in animation, that there is some div
      if (util.lastChild(navNode).nodeName == 'ONS-PAGE') {
        navNode.appendChild(lastChild);
      } else {
        navNode.insertBefore(lastChild, util.lastChild(navNode));
      }

      for (var i = 0; i < this.elements.length; i++) {
        help.push(this.elements[i].elem);
      }

      var node = ReactDOM.findDOMNode(this);
      var node2 = ReactDOM.render(React.createElement(
        'ons-navigator',
        this.props,
        help
      ), node);
    }).bind(this));
  },
  render: function () {
    return React.createElement('div', null);
  },

  componentWillReceiveProps: function (newProps) {
    var props = newProps || this.props;

    var help = [];
    this.elements = [];
    this.elements.push({ elem: props.children });

    for (var i = 0; i < this.elements.length; i++) {
      help.push(this.elements[i].elem);
    }

    var node = ReactDOM.findDOMNode(this);

    ReactDOM.render(React.createElement(
      'ons-navigator',
      this.props,
      help
    ), node);
  },

  replacePage: function (reactPage, options) {
    var htmlString = ReactDOMServer.renderToStaticMarkup(reactPage);

    if (options == undefined) {
      options = {};
    }
    options.pageHTML = htmlString;

    var node = this.node;
    var navNode = this.node.firstChild;

    this.elements.pop();
    this.elements.push({ elem: reactPage });
    var help = [];
    for (var i = 0; i < this.elements.length; i++) {
      help.push(this.elements[i].elem);
    }

    var deleteElem = navNode.children[navNode.children.length - 1];

    this.node.firstChild.replacePage('', options).then((function () {

      var lastNode = navNode.children[navNode.children.length - 1];

      navNode.insertBefore(deleteElem, navNode.children[navNode.children.length - 1]);
      var node2 = ReactDOM.render(React.createElement(
        'ons-navigator',
        this.props,
        help
      ), node);

      var index = navNode.children.length - 2;
      navNode.children[index].style.display = 'block';
      navNode._pages[index].element = node.firstChild.children[index];
      navNode.removeChild(lastNode);
    }).bind(this));
  },

  insertComponent: function (reactPage, insertPos, options) {

    var htmlString = ReactDOMServer.renderToStaticMarkup(reactPage);

    if (options == undefined) {
      options = {};
    }
    options.pageHTML = htmlString;

    this.counter++;
    var node = ReactDOM.findDOMNode(this);
    var navNode = node.firstChild;
    insertPos = node.firstChild._normalizeIndex(insertPos);

    if (!reactUtil.rendersToOnsPage(reactPage)) {
      throw new Error("The component that react inserts needs to render to <ons-page>");
    }

    this.elements.splice(insertPos, 0, { elem: reactPage });

    var help = [];
    for (var i = 0; i < this.elements.length; i++) {
      help.push(this.elements[i].elem);
    }

    var counter = this.counter;

    var elements = this.elements;
    node.firstChild.insertPage(insertPos, '', options).then((function () {

      // delete the node again
      navNode.removeChild(navNode.children[insertPos]);
      // console.log(navNode._pages);
      var node2 = ReactDOM.render(React.createElement(
        'ons-navigator',
        this.props,
        help
      ), node);

      for (var i = 0; i < navNode.children.length - 1; i++) {
        navNode.children[i].style.display = 'none';
      }

      for (var i = 0; i < navNode.children.length; i++) {
        navNode._pages[i].element = navNode.children[i];
      }
    }).bind(this));
  },

  pushComponent: function (reactPage, options) {
    if (!reactUtil.rendersToOnsPage(reactPage)) {
      throw new Error("The component that react pushes needs to render to <ons-page>");
    }

    var htmlString = ReactDOMServer.renderToStaticMarkup(reactPage);

    if (options == undefined) {
      options = {};
    }
    options.pageHTML = htmlString;

    this.elements.push({ elem: reactPage });
    var elements = this.elements;

    var node = ReactDOM.findDOMNode(this);
    node.firstChild._pushPage(options).then((function () {
      var help = [];
      for (var i = 0; i < elements.length; i++) {
        help.push(elements[i].elem);
      }

      var node2 = ReactDOM.render(React.createElement(
        'ons-navigator',
        this.props,
        help
      ), node);

      node2._pages[elements.length - 1].element = node2.children[elements.length - 1];
      node2.removeChild(node2.children[elements.length]);
    }).bind(this));
  }
});
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var OnsPage = React.createClass({
  displayName: "OnsPage",

  render: function () {
    var toolbar;
    var otherChildren = [];

    React.Children.forEach(this.props.children, function (child) {
      if (reactUtil.rendersToOnsToolbar(child)) {
        toolbar = child;
      } else {
        otherChildren.push(child);
      }
    });

    return React.createElement(
      "ons-page",
      _extends({}, this.props, { _compiled: "true" }),
      toolbar,
      React.createElement(
        "div",
        { className: "page__background" },
        " "
      ),
      React.createElement(
        "div",
        { className: "page__content" },
        otherChildren
      )
    );
  }
});
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var OnsTabbar = React.createClass({
  displayName: 'OnsTabbar',

  componentDidMount: function () {
    console.log('component did mount');

    var lastLink = window.OnsTabbarElement.rewritables.link;
    window.OnsTabbarElement.rewritables.link = (function (el, target, options, callback) {
      lastLink(el, target, options, callback);
    }).bind(this);

    var node = this.node = ReactDOM.findDOMNode(this);

    var children = [];
    this.childIndex = [];

    var newModifier = this.props.modifier;

    var activeIndex = -1;
    var index = -1;

    React.Children.forEach(this.props.children, (function (child) {
      index++;
      child = React.cloneElement(child, { modifier: newModifier });

      counter = -1;

      var myChildren = React.Children.map(child.props.children, function (child2) {
        counter++;
        return React.cloneElement(child2, { 'data-ons-react': counter });
      });

      this.childIndex.push(child.props.page);
      if (child.props.active) {
        activeIndex = index;
      }

      var mychild = React.cloneElement(child, {}, myChildren);
      var renderString = ReactDOMServer.renderToStaticMarkup(mychild);

      var el = document.createElement('div');
      el.innerHTML = renderString;

      var newElement = buildComponent(el.firstChild, React.Children.toArray(child.props.children));

      children.push(newElement);
    }).bind(this));

    var newNode = React.cloneElement(this, {}, null);

    var renderString = ReactDOMServer.renderToStaticMarkup(React.createElement(
      'ons-tabbar',
      newNode.props,
      children
    ));

    var el = document.createElement('div');
    el.innerHTML = renderString;

    var contentClass = el.firstChild.children[0].className;
    var barClass = el.firstChild.children[1].className;

    ReactDOM.render(React.createElement(
      'ons-tabbar',
      _extends({}, newNode.props, { _compiled: 'true' }),
      React.createElement(
        'div',
        { 'no-status-bar-fill': true, className: contentClass },
        this.props.pages
      ),
      React.createElement(
        'div',
        { className: barClass },
        children
      )
    ), node);

    for (var i = 0; i < node.firstChild.children[1].children.length; i++) {
      node.firstChild.children[1].children[i]._pageElement = node.firstChild.firstChild.children[i];
    }

    for (var i = 0; i < node.firstChild.firstChild.children.length; i++) {
      node.firstChild.firstChild.children[i].style.display = 'none';
    }

    node.firstChild.setActiveTab(activeIndex);
  },

  // add this hook
  componentWillReceiveProps: function (newProps) {
    // its important to pass the new props in
    console.log('will receive props');
    // this.renderDialogContent(newProps);
  },

  shouldComponentUpdate: function () {
    console.log('rerender');
    return false;
  },

  render: function () {
    console.log('render tab');
    return React.createElement(
      'div',
      null,
      ' This is a nice text'
    );
  }
});

var buildComponent = function (domElement, reactChildren) {
  if (domElement.hasAttribute('data-ons-react')) {
    var index = parseInt(domElement.getAttribute('data-ons-react'));
    return reactChildren[index];
  } else {
    var children = [];
    for (var i = 0; i < domElement.children.length; i++) {
      children.push(buildComponent(domElement.children[i], reactChildren));
    }

    if (children.length > 0) {
      return React.createElement(
        MyElem,
        { domNode: domElement, myClass: domElement.className, styleString: domElement.style.cssText },
        children
      );
    } else {
      return React.createElement(MyElem, { domNode: domElement, myClass: domElement.className, styleString: domElement.style.cssText });
    }
  }
};

var OnsTab = React.createClass({
  displayName: 'OnsTab',

  render: function () {
    return React.createElement(
      'ons-tab',
      this.props,
      ' ',
      this.props.children,
      ' '
    );
  }
});

var MyElem = React.createClass({
  displayName: 'MyElem',

  componentDidMount: function () {

    var elem = this.props.domNode;
    for (var i = 0; i < elem.attributes.length; i++) {
      var attrib = elem.attributes[i];
      ReactDOM.findDOMNode(this).setAttribute(attrib.name, attrib.value);
    }

    if (!this.props.children) {
      ReactDOM.findDOMNode(this).innerHTML = elem.innerHTML;
    }
  },
  render: function () {
    return React.createElement(this.props.domNode.nodeName, { '_compiled': '' }, this.props.children);
  }
});

var OnsTemplate = React.createClass({
  displayName: 'OnsTemplate',

  componentDidMount: function () {
    reactUtil.templateMap[this.props.id] = this;
  },
  render: function () {
    return React.createElement(
      'ons-template',
      { type: 'text/ons-template', id: this.props.id },
      this.props.children
    );
  }
});
var ReactTestUtils = React.addons.TestUtils;
var reactUtil = {};

reactUtil.rendersToOnsPage = function (obj) {
  var htmlString = ReactDOMServer.renderToStaticMarkup(obj);
  return htmlString.startsWith('<ons-page');
};

reactUtil.rendersToOnsToolbar = function (obj) {
  var htmlString = ReactDOMServer.renderToStaticMarkup(obj);
  return htmlString.startsWith('<ons-toolbar');
};

reactUtil.lastChild = function (el) {
  return el.children[el.children.length - 1];
};

reactUtil.templateMap = {};