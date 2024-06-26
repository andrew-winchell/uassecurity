



(function () {
    function wrapped() {

        (function (window) {

  /**
   * This is the SMCX singleton for the publisher DOM
   */
  var SMCX = window.SMCX = new (function PublisherSMCX() {
    var that = this;

    /**
     * Before SMCX is initialized, it is an array that holds any user-defined
     * settings created via `SMCX.push`. When SMCX is initialized, it consumes
     * the original array, passing it along to the App's Configuration object,
     * but continues to act like an array with push semantics (i.e. users can
     * still call `SMCX.push`)
     */
    that.__settings__ = window.SMCX || [];
    that.push = function () {
      that.__settings__.push.apply(that.__settings__, arguments);
    };

    that.onerror = window.onerror;

    /**
     * Pass this as a query parameter in the publisher page's URL to enable
     * debug mode within the application
     *
     * Usage:
     *
     * http://www.example.com/pages/test?smcx_debug=true
     *
     */
    that.DEBUG_QUERY_PARAM = 'smcx_debug';

    that.initialize = function (options) {
      log("Initializing SMCX");

      withDocumentBody(function () {
        if (shouldAbortInit()) {
          log("Aborted");
          return;
        }

        // A dictionary of performance data, see `SMCX.Sandbox.T` for usage
        that.PERF = {0: +new Date};
        options.perf = that.PERF;

        options.settings = that.__settings__;

        that.env = new SMCX.Publisher.Env;
        that.env.initialize(options);
      });
    };

    that.boot = function () {
      if (that.env) {
        that.env.boot();
      }
    };

    that.destroy = function () {
      that.__settings__ = [];

      if (that.env) {
        that.env.destroy();
        that.env = null;
      }
    };

    that.debug = function () {
      if (that.env && that.env.DEBUG) {
        return true;
      }

      var queryParams = SMCX.Utils.queryParams(window);
      return queryParams.indexOf(that.DEBUG_QUERY_PARAM) !== -1;
    };

    function withDocumentBody(callback) {
      if (document.body) {
        return callback();
      }

      // Poll for up to 10 seconds to see if `document.body`
      // shows up for the party
      var id, count = 0;
      id = setInterval(function () {
        if (document.body || count > 100) {
          clearInterval(id);
          if (document.body) {
            callback();
          }
        }
        log("Called withDocumentBody");
        count++;
      }, 100);
    }

    function shouldAbortInit() {
      // Abort if the browser doesn't support cross-domain messaging
      if (!SMCX.Utils.xdmSupported(window)) {
        return true;
      }

      // Abort if on IE8 and we would be adding more stylesheets than it can
      // handle (we add 2 and it can support up to 30)
      if (SMCX.Utils.browserHasLowStylesLimit(window) &&
        SMCX.Utils.numStyles(window) > 28) {
        return true;
      }

      return false;
    }

    // Logging

    function log(message) {
      SMCX.log(message);
    }

  })();

  window.SMCX.Publisher = {};

}(window));

(function (window) {

  /**
   * This is the SMCX JS SDK log function
   *
   * If you're looking for the main application's log function, it lives
   * at `/app/assets/javascripts/lib/log.js`
   *
   */
  window.SMCX.log = function (message, options) {
    options = options || {};

    if (SMCX.debug() || options.force) {
      if (window.console) {
        // Only add namespaces to messages that are strings so as not to mess up
        // the nice object inspection functionality in modern browsers
        if (typeof message === 'string') {
          if (options.namespace) {
            message = '[smcx.' + options.namespace + '] ' + message;
          } else {
            message = '[smcx] ' + message;
          }
        }

        console.log(message);
      }
    }
  };

}(window));

(function (window) {
  window.SMCX.Utils = {

    /**
     * Get the query parameters from the target window's URL
     *
     * @param targetWindow Window
     * @returns String
     */
    queryParams: function (targetWindow) {
      return targetWindow.document.location.search;
    },

    /**
     * Determine if the current viewport is a mobile device
     *
     * @returns Boolean
     */
    onMobile: function (targetWindow) {
      var innerWidth, clientWidth, width;

      clientWidth = targetWindow.document.documentElement.clientWidth;
      innerWidth = targetWindow.innerWidth;
      width = Math.max(innerWidth, clientWidth || 0);

      return width <= 760;
    },

    /**
     * Check if the browser supports cross-domain messaging (XDM)
     *
     * To support XDM, browsers need to implement the `postMessage` method,
     * which is true for IE8+ and all modern browsers
     *
     * @param targetWindow
     * @returns Boolean
     */
    xdmSupported: function (targetWindow) {
      return !!targetWindow['postMessage'];
    },

    /**
     * Detect whether the current browser has a low stylesheet limit
     *
     * This is used when determining whether to initialize a widget (which would
     * inject another stylesheet) because IE8 has a hard limit of 31 stylesheets
     * and/or style tags on a given page
     *
     * FYI: modern browsers have a limit in the thousands, so for all intents
     * and purposes, we don't need to care about stylesheet limits on any
     * browser other than IE8
     *
     * @returns Boolean
     */
    browserHasLowStylesLimit: function (targetWindow) {
      return !('getComputedStyle' in targetWindow);
    },

    /**
     * Get the # of stylesheets and style tags on the page
     *
     * @param targetWindow Window
     * @returns Integer
     */
    numStyles: function (targetWindow) {
      var doc, numLinks, numStyles;

      doc = targetWindow.document;
      numLinks = doc.getElementsByTagName('link').length;
      numStyles = doc.getElementsByTagName('style').length;

      return numLinks + numStyles;
    }
  }

}(window));

/**
 * This is the SMCX singleton for the publisher DOM
 */
(function (window, document, undefined) {

  var Env = SMCX.Publisher.Env = function () {
    var that = this;

    /**
     *
     * @param options
     * @param options.sandbox
     * @param options.sandbox.init (optional)
     * @param options.sandbox.boot (optional)
     * @param options.sandbox.js
     * @param options.sandbox.data
     */
    this.initialize = function (options) {
      /**
       * Set which type of singleton this is so it's possible to differentiate
       * among the three different types
       *
       * @type String
       * @private
       */
      that.__TYPE__ = 'publisher';

      /**
       * The current environment
       *
       * This is originally set by the parameter passed to `InitV{n}View` on
       * the server
       *
       * @type String
       */
      that.NAME = options.env;

      that.DEBUG = options.debug;

      log("Initializing environment (type=publisher, mode=" + that.NAME + ")");

      that.options = extractOptions(options);

      that.settings = that.options.settings;

      // reference to the sandboxed SMCX singleton
      that.__SMCX__ = null;

      that.events = {
        'smcx.container:sdkjs:loaded': [onSandboxedJSLoaded],
        'smcx.sandbox:init': [],
        'smcx.sandbox:boot': []
      };

      that.container = new SMCX.Publisher.Container();
      that.container.initialize(optionsForContainer());
    };

    function extractOptions(options) {
      if (options.sandbox === undefined) {
        throw("`options.sandbox` must be defined");
      }

      if (options.sandbox.data === undefined) {
        throw("`options.sandbox.data` must be defined");
      }

      if (options.sandbox.js === undefined) {
        throw("`options.sandbox.js` must be defined");
      }

      if (typeof(options.sandbox.js) !== 'string') {
        throw("`options.sandbox.js` must be a string");
      }

      if (that.DEBUG) {
        options.sandbox.js = JSON.parse(options.sandbox.js);
      }

      if (typeof(options.sandbox.data) !== 'object') {
        throw("`options.sandbox.data` must be an object");
      }

      if (options.data['cookie_url'] === undefined) {
        throw("`options.data.cookie_url` must be defined");
      }

      if (options.sandbox.init === undefined) {
        options.sandbox.init = true;
      }

      if (options.sandbox.boot === undefined) {
        options.sandbox.boot = true;
      }

      return options;
    }

    this.boot = function () {
      configureContainer(that.container);
      that.container.render();
    };

    this.addCallback = function (eventName, callback) {
      if (that.events[eventName] === undefined) {
        throw(eventName + ' is not a valid event name');
      }
      that.events[eventName].push(callback);
    };

    this.trigger = function () {
      var eventName = Array.prototype.shift.apply(arguments); // pop first arg
      logEvent(eventName);
      runCallbacksFor(eventName, arguments);
    }

    this.destroy = function () {
      log("Destroying SMCX (type=publisher)");

      that.settings = [];

      if (that.__SMCX__) {
        that.__SMCX__.destroy();
        that.__SMCX__ = null;
      }

      // NB: destroying the container (and its frame) must come after its child
      // objects are destroyed and events unbound, otherwise it creates a race
      // condition that can cause script errors
      if (that.container) {
        that.container.destroy();
        that.container = null;
      }
    };

    this.debug = function () {
      return that.DEBUG;
    };

    // Container

    function optionsForContainer() {
      return {
        debug: that.DEBUG,
        div: {
          id: '__smcx__'
        },
        frame: {
          id: 'smcx_frame'
        }
      }
    }

    /**
     * Build up the HTML we want to `document.write` into the container's frame
     *
     * @param container
     */
    function configureContainer(container) {
      container.addRemoteScript({src: that.constructor.JQUERY_URL});
      container.addRemoteScript({src: buildCookieUrl()});

      /**
       * Inject the script element(s) for the JS SDK
       *
       * In debug mode, `js` will be a set of <script> tags that each
       * reference a file in the `sdk-sandbox-manifest.js` (which makes it
       * possible to use the browser's debugging functionality), therefore we
       * don't need to wrap the string. Otherwise, `js` is the bundled
       * source of `sdk-sandbox-manifest.js`, thus it needs to be wrapped in a
       * single <script> tag so that the JS gets evaluated once it's written
       * into the sandbox frame.
       *
       * NB: IE8 will not wait for remote scripts to finish before beginning to
       * parse inline scripts, thus when not in debug mode there would exist
       * a race condition between jQuery and the inlined JS for the SDK. To
       * avoid this, we wrap the JS SDK in an `onload` callback that will
       * only execute after the window's `onload` event. While this eliminates
       * the race condition, it is still possible that the jQuery request fails
       * (highly unlikely, but it's possible that the Google CDN experiences
       * downtime), so we also have to guard against that possibility.
       *
       * sp: disabled debug load to avoid loading static assets one by one
       */
      if (that.DEBUG) {
        var urls = that.options.sandbox.js;
        for (var i = 0; i < urls.length; i++) {
          container.addRemoteScript({src: urls[i]});
        }
      } else {
        var bundle = that.options.sandbox.js;
        bundle = wrapWithJQueryGuard(bundle);
        container.addInlineScript({text: bundle, on: 'load'});
      }
    }

    // FIXME: docs
    function buildCookieUrl() {
      return that.options.data['cookie_url'] + "?_=" + (+new Date);
    }

    function wrapWithJQueryGuard(js) {
      return 'if (window.jQuery){' + js + '}';
    }

    /**
     * This callback gets run when all of the sandboxed Javascript has been
     * parsed by the browser
     *
     * @param frameWindow
     */
    function onSandboxedJSLoaded(frameWindow) {
      that.__SMCX__ = frameWindow.SMCX;
    }

    // Events

    /**
     * Run callbacks for the given event in FIFO order
     *
     * @param eventName String
     * @param args Arguments
     */
    function runCallbacksFor(eventName, args) {
      var callbacks, callback;
      callbacks = that.events[eventName].reverse();
      while (callbacks.length) {
        callback = callbacks.pop();
        callback.apply(callback, args);
      }
    }

    // Logging

    function log(message) {
      SMCX.log(message, {namespace: that.__TYPE__});
    }

    function logEvent(eventName) {
      var message = "Received '" + eventName + "' event";
      log(message);
    }

  }

  SMCX.Publisher.Env.JQUERY_URL = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.js';

}(window, document));

(function (window, document) {

  /**
   * Provides a way to create an isolated container using the sourceless-iframe
   * technique pioneered by Meebo
   *
   * https://github.com/meebo/embed-code/blob/master/embed-code.js
   *
   * @constructor
   */
  SMCX.Publisher.Container = function () {
    var that = this;

    this.initialize = function (options) {
      log("Initializing an SMCX.Publisher.Container");

      SMCX.Publisher.Container.current = this;

      this.options = {};
      this.options.div = options.div;
      this.options.frame = options.frame;
      this.options.frame.head = [];
      this.options.frame.body = [];
      this.debug = options.debug;
    };

    this.render = function () {
      log("Rendering an SMCX.Publisher.Container");

      // Create an (invisible) container element in the publisher's DOM to
      // hold all future elements that we are going to insert
      that.containerEl = document.createElement('div');
      that.containerEl.id = that.options.div.id;
      that.containerEl.style.display = 'none';
      document.body.appendChild(that.containerEl);

      // Create a sourceless iframe in the publisher's DOM to sandbox the SDK
      that.frameEl = document.createElement('iframe');
      that.frameEl.frameBorder = '0';
      that.frameEl.id = that.options.frame.id;
      that.frameEl.allowTransparency = 'true';
      that.containerEl.appendChild(that.frameEl);
      that.frameWindow = that.frameEl.contentWindow;

      try {

        // Try to access the frame window's document and open it
        //
        // NB: in IE8-10, this will fail is the parent window's `document.domain`
        // has been set (even if if it's the same as `window.location.hostname`),
        // because those browsers' security policy prevents accessing a frame's
        // document if the frame's `document.domain` differs from the parent's).
        // We catch this exception and handle opening the document in a
        // different way below.
        //
        // NB: you cannot avoid this exception by always setting `document.domain`
        // to match the parent window's before trying to access the frame's
        // document because if the parent window hasn't explicitly set
        // `document.domain`, setting it on the frame's document will cause IE
        // to deny access the frame's document (this is because IE doesn't just
        // do a strict equality check of the value of `document.domain`, it
        // actually tracks whether the document's `domain` property has been
        // explicitly set)
        //
        that.frameEl.contentWindow.document.open();

      } catch (e) {

        logDocumentOpenError(e);

        // If an exception occurred while attempting to access the document,
        // that implies that `document.domain` has been set on the parent window.
        //
        // In order to access the frame's document, we need to ensure its
        // `document.domain` matches the parent window's (without opening the
        // frame's document itself...). There's a clever hack to accomplish this,
        // which is to inject a JS snippet via the frame's `src` attribute
        // using the `javascript:` directive
        //
        that.frameEl.src = domainSrcFor(document.domain);

      }

      try {

        // Get a reference to the frame's document again (should work every
        // time now that we have ensured `document.domain` matches)
        that.frameDocument = that.frameEl.contentWindow.document;

        // Write the HTML into the blank iframe (this works in IE8+)
        var html = buildFrameHTML();
        that.frameDocument.write(html);

        // Must call `document.close` to trigger the frame's `onload` event
        that.frameDocument.close();

        // Polyfill `document.head` (which isn't implemented in IE < 9)
        that.frameDocument.head = that.frameDocument.head ||
          that.frameDocument.getElementsByTagName('head')[0];

      } catch (e) {
        logDocumentWriteError(e);
      }
    };

    this.destroy = function () {
      log('Destroying SMCX.Publisher.Container');

      if (that.containerEl) {
        that.containerEl.removeChild(that.frameEl);
        document.body.removeChild(that.containerEl);
      }
    };

    /**
     * Add a string to the list of strings to write into the frame's document
     * for a given element
     *
     * NB: generally, you'll want to use one of the convenience wrappers for
     * this method (`addRemoteScript`, `addInlineScript`, etc)
     *
     * @param options
     * @param options.el String ('head' or 'body', default is 'head')
     * @param options.prepend Boolean (default is False)
     */
    this.addString = function (options) {
      var queue = that.options.frame[options.el || 'head'];
      options.prepend ? queue.unshift(options.text) : queue.push(options.text);
    };

    /**
     * Add a remote script to the list of strings to be written into the
     * frame's document
     *
     * Example:
     *
     *    addRemoteScript({src: 'https://foo.com/bar.js'})
     *
     * This will add the following string to `options.frame.head`:
     *
     *    "<script src='https://foo.com/bar.js'></script>"
     *
     * See `addString` for more details about available options
     *
     * @param options Object
     * @param options.src String (the path or url to the script)
     */
    this.addRemoteScript = function (options) {
      var script = '<' + 'script src="' + options.src + '"></script' + '>';
      this.addString({text: script, el: options.el});
    };

    /**
     * Add an inline script to the list of strings to be written into the
     * frame's document
     *
     * Example:
     *
     *    addInlineScript({text: 'alert("foo");'})
     *
     * This will add the following string to `options.frame.head`:
     *
     *    "<script>alert("foo");</script>"
     *
     * See `addString` for more details about available options
     *
     * @param options Object
     * @param options.text String (escaped Javascript)
     */
    this.addInlineScript = function (options) {
      var script, text;

      if (options['on'] === 'load') {
        text = wrapInOnLoadCallback(options.text);
      } else {
        text = options.text;
      }

      script = '<' + 'script>' + text + '</script' + '>';

      this.addString({text: script, el: options.el});
    };

    /**
     * Build a JS snippet to set a frame's `document.domain` via its `src`
     * attribute
     *
     * @param domain
     * @returns {string}
     */
    function domainSrcFor(domain) {
      var src = "javascript:";
      src += "var d=document.open(); d.domain='" + document.domain + "';";
      src += 'void(0);'
      return src;
    }

    /**
     * Build the HTML markup for the document
     *
     * NB: we include a DOCTYPE here to ensure that iframes getting rendered
     * in IE don't fall in to Quirks Mode (in which certain standard libraries,
     * such as JSON, aren't available)
     *
     * @returns {string}
     */
    function buildFrameHTML() {
      var s = String();

      s += '<!DOCTYPE html>';
      s += '<' + 'html>';
      s += '<' + 'head>';
      s += that.options.frame.head.join('\n');
      s += '<' + '/head>';
      s += '<' + 'body>';
      s += that.options.frame.body.join('\n');
      s += '</body' + '>';
      s += '</html' + '>';

      return s;
    }

    /**
     * Helper to wrap a script in a callback function that will only execute
     * after the page's `onload` event has fired
     *
     * @param text
     * @returns {string}
     */
    function wrapInOnLoadCallback(text) {
      var wrapped = String();
      wrapped += '(function(){'
      wrapped += 'var eventer = window.addEventListener ? window.addEventListener : window.attachEvent;';
      wrapped += 'var name = window.addEventListener ? "load" : "onload";';
      wrapped += 'eventer(name, function(e){' + text + '});';
      wrapped += '}());';
      return wrapped;
    }

    // Logging

    function log(message) {
      SMCX.log(message, {namespace: 'container'});
    }

    function logDocumentOpenError(e) {
      log(e);
      log("could not open document, falling back to a `javascript:` src");
    }

    function logDocumentWriteError(e) {
      log(e);
      log("document.write failed, aborting");
    }

  };

}(window, document));

        
        SMCX.initialize({
            env: 'prod',
            debug: false,
            data: {'cookie_url': 'https://widget.surveymonkey.com/collect/website/js/cookie.js'},
            sandbox: {
                js: '(function(){var e=typeof define===\"function\"&&define.amd;var P={function:true,object:true};var t=P[typeof exports]&&exports&&!exports.nodeType&&exports;var B=P[typeof window]&&window||this,n=t&&P[typeof module]&&module&&!module.nodeType&&typeof global==\"object\"&&global;if(n&&(n[\"global\"]===n||n[\"window\"]===n||n[\"self\"]===n)){B=n}function V(e,c){e||(e=B[\"Object\"]());c||(c=B[\"Object\"]());var l=e[\"Number\"]||B[\"Number\"],f=e[\"String\"]||B[\"String\"],t=e[\"Object\"]||B[\"Object\"],d=e[\"Date\"]||B[\"Date\"],n=e[\"SyntaxError\"]||B[\"SyntaxError\"],x=e[\"TypeError\"]||B[\"TypeError\"],i=e[\"Math\"]||B[\"Math\"],o=e[\"JSON\"]||B[\"JSON\"];if(typeof o==\"object\"&&o){c.stringify=o.stringify;c.parse=o.parse}var r=t.prototype,y=r.toString,_,X,O;var u=new d(-0xc782b5b800cec);try{u=u.getUTCFullYear()==-109252&&u.getUTCMonth()===0&&u.getUTCDate()===1&&u.getUTCHours()==10&&u.getUTCMinutes()==37&&u.getUTCSeconds()==6&&u.getUTCMilliseconds()==708}catch(e){}function g(e){if(g[e]!==O){return g[e]}var t;if(e==\"bug-string-char-index\"){t=\"a\"[0]!=\"a\"}else if(e==\"json\"){t=g(\"json-stringify\")&&g(\"json-parse\")}else{var n,i=\'{\"a\":[1,true,false,null,\"\\\\u0000\\\\b\\\\n\\\\f\\\\r\\\\t\"]}\';if(e==\"json-stringify\"){var o=c.stringify,r=typeof o==\"function\"&&u;if(r){(n=function(){return 1}).toJSON=n;try{r=o(0)===\"0\"&&o(new l)===\"0\"&&o(new f)==\'\"\"\'&&o(y)===O&&o(O)===O&&o()===O&&o(n)===\"1\"&&o([n])==\"[1]\"&&o([O])==\"[null]\"&&o(null)==\"null\"&&o([O,y,null])==\"[null,null,null]\"&&o({a:[n,true,false,null,\"\\0\\b\\n\\f\\r\\t\"]})==i&&o(null,n)===\"1\"&&o([1,2],null,1)==\"[\\n 1,\\n 2\\n]\"&&o(new d(-864e13))==\'\"-271821-04-20T00:00:00.000Z\"\'&&o(new d(864e13))==\'\"+275760-09-13T00:00:00.000Z\"\'&&o(new d(-621987552e5))==\'\"-000001-01-01T00:00:00.000Z\"\'&&o(new d(-1))==\'\"1969-12-31T23:59:59.999Z\"\'}catch(e){r=false}}t=r}if(e==\"json-parse\"){var a=c.parse;if(typeof a==\"function\"){try{if(a(\"0\")===0&&!a(false)){n=a(i);var s=n[\"a\"].length==5&&n[\"a\"][0]===1;if(s){try{s=!a(\'\"\\t\"\')}catch(e){}if(s){try{s=a(\"01\")!==1}catch(e){}}if(s){try{s=a(\"1.\")!==1}catch(e){}}}}}catch(e){s=false}}t=s}}return g[e]=!!t}if(!g(\"json\")){var p=\"[object Function]\",E=\"[object Date]\",T=\"[object Number]\",A=\"[object String]\",I=\"[object Array]\",W=\"[object Boolean]\";var s=g(\"bug-string-char-index\");if(!u){var $=i.floor;var a=[0,31,59,90,120,151,181,212,243,273,304,334];var N=function(e,t){return a[t]+365*(e-1970)+$((e-1969+(t=+(t>1)))/4)-$((e-1901+t)/100)+$((e-1601+t)/400)}}if(!(_=r.hasOwnProperty)){_=function(e){var t={},n;if((t.__proto__=null,t.__proto__={toString:1},t).toString!=y){_=function(e){var t=this.__proto__,n=e in(this.__proto__=null,this);this.__proto__=t;return n}}else{n=t.constructor;_=function(e){var t=(this.constructor||n).prototype;return e in this&&!(e in t&&this[e]===t[e])}}t=null;return _.call(this,e)}}X=function(e,t){var n=0,i,a,o;(i=function(){this.valueOf=0}).prototype.valueOf=0;a=new i;for(o in a){if(_.call(a,o)){n++}}i=a=null;if(!n){a=[\"valueOf\",\"toString\",\"toLocaleString\",\"propertyIsEnumerable\",\"isPrototypeOf\",\"hasOwnProperty\",\"constructor\"];X=function(e,t){var n=y.call(e)==p,i,o;var r=!n&&typeof e.constructor!=\"function\"&&P[typeof e.hasOwnProperty]&&e.hasOwnProperty||_;for(i in e){if(!(n&&i==\"prototype\")&&r.call(e,i)){t(i)}}for(o=a.length;i=a[--o];r.call(e,i)&&t(i));}}else if(n==2){X=function(e,t){var n={},i=y.call(e)==p,o;for(o in e){if(!(i&&o==\"prototype\")&&!_.call(n,o)&&(n[o]=1)&&_.call(e,o)){t(o)}}}}else{X=function(e,t){var n=y.call(e)==p,i,o;for(i in e){if(!(n&&i==\"prototype\")&&_.call(e,i)&&!(o=i===\"constructor\")){t(i)}}if(o||_.call(e,i=\"constructor\")){t(i)}}}return X(e,t)};if(!g(\"json-stringify\")){var h={92:\"\\\\\\\\\",34:\'\\\\\"\',8:\"\\\\b\",12:\"\\\\f\",10:\"\\\\n\",13:\"\\\\r\",9:\"\\\\t\"};var S=\"000000\";var j=function(e,t){return(S+(t||0)).slice(-e)};var v=\"\\\\u00\";var U=function(e){var t=\'\"\',n=0,i=e.length,o=!s||i>10;var r=o&&(s?e.split(\"\"):e);for(;n<i;n++){var a=e.charCodeAt(n);switch(a){case 8:case 9:case 10:case 12:case 13:case 34:case 92:t+=h[a];break;default:if(a<32){t+=v+j(2,a.toString(16));break}t+=o?r[n]:e.charAt(n)}}return t+\'\"\'};var k=function(e,t,n,i,o,r,a){var s,c,l,f,d,u,g,p,h,S,v,m,C,b,M,w;try{s=t[e]}catch(e){}if(typeof s==\"object\"&&s){c=y.call(s);if(c==E&&!_.call(s,\"toJSON\")){if(s>-1/0&&s<1/0){if(N){d=$(s/864e5);for(l=$(d/365.2425)+1970-1;N(l+1,0)<=d;l++);for(f=$((d-N(l,0))/30.42);N(l,f+1)<=d;f++);d=1+d-N(l,f);u=(s%864e5+864e5)%864e5;g=$(u/36e5)%24;p=$(u/6e4)%60;h=$(u/1e3)%60;S=u%1e3}else{l=s.getUTCFullYear();f=s.getUTCMonth();d=s.getUTCDate();g=s.getUTCHours();p=s.getUTCMinutes();h=s.getUTCSeconds();S=s.getUTCMilliseconds()}s=(l<=0||l>=1e4?(l<0?\"-\":\"+\")+j(6,l<0?-l:l):j(4,l))+\"-\"+j(2,f+1)+\"-\"+j(2,d)+\"T\"+j(2,g)+\":\"+j(2,p)+\":\"+j(2,h)+\".\"+j(3,S)+\"Z\"}else{s=null}}else if(typeof s.toJSON==\"function\"&&(c!=T&&c!=A&&c!=I||_.call(s,\"toJSON\"))){s=s.toJSON(e)}}if(n){s=n.call(t,e,s)}if(s===null){return\"null\"}c=y.call(s);if(c==W){return\"\"+s}else if(c==T){return s>-1/0&&s<1/0?\"\"+s:\"null\"}else if(c==A){return U(\"\"+s)}if(typeof s==\"object\"){for(b=a.length;b--;){if(a[b]===s){throw x()}}a.push(s);v=[];M=r;r+=o;if(c==I){for(C=0,b=s.length;C<b;C++){m=k(C,s,n,i,o,r,a);v.push(m===O?\"null\":m)}w=v.length?o?\"[\\n\"+r+v.join(\",\\n\"+r)+\"\\n\"+M+\"]\":\"[\"+v.join(\",\")+\"]\":\"[]\"}else{X(i||s,function(e){var t=k(e,s,n,i,o,r,a);if(t!==O){v.push(U(e)+\":\"+(o?\" \":\"\")+t)}});w=v.length?o?\"{\\n\"+r+v.join(\",\\n\"+r)+\"\\n\"+M+\"}\":\"{\"+v.join(\",\")+\"}\":\"{}\"}a.pop();return w}};c.stringify=function(e,t,n){var i,o,r,a;if(P[typeof t]&&t){if((a=y.call(t))==p){o=t}else if(a==I){r={};for(var s=0,c=t.length,l;s<c;l=t[s++],(a=y.call(l),a==A||a==T)&&(r[l]=1));}}if(n){if((a=y.call(n))==T){if((n-=n%1)>0){for(i=\"\",n>10&&(n=10);i.length<n;i+=\" \");}}else if(a==A){i=n.length<=10?n:n.slice(0,10)}}return k(\"\",(l={},l[\"\"]=e,l),o,r,i,\"\",[])}}if(!g(\"json-parse\")){var m=f.fromCharCode;var C={92:\"\\\\\",34:\'\"\',47:\"/\",98:\"\\b\",116:\"\\t\",110:\"\\n\",102:\"\\f\",114:\"\\r\"};var b,M;var w=function(){b=M=null;throw n()};var D=function(){var e=M,t=e.length,n,i,o,r,a;while(b<t){a=e.charCodeAt(b);switch(a){case 9:case 10:case 13:case 32:b++;break;case 123:case 125:case 91:case 93:case 58:case 44:n=s?e.charAt(b):e[b];b++;return n;case 34:for(n=\"@\",b++;b<t;){a=e.charCodeAt(b);if(a<32){w()}else if(a==92){a=e.charCodeAt(++b);switch(a){case 92:case 34:case 47:case 98:case 116:case 110:case 102:case 114:n+=C[a];b++;break;case 117:i=++b;for(o=b+4;b<o;b++){a=e.charCodeAt(b);if(!(a>=48&&a<=57||a>=97&&a<=102||a>=65&&a<=70)){w()}}n+=m(\"0x\"+e.slice(i,b));break;default:w()}}else{if(a==34){break}a=e.charCodeAt(b);i=b;while(a>=32&&a!=92&&a!=34){a=e.charCodeAt(++b)}n+=e.slice(i,b)}}if(e.charCodeAt(b)==34){b++;return n}w();default:i=b;if(a==45){r=true;a=e.charCodeAt(++b)}if(a>=48&&a<=57){if(a==48&&(a=e.charCodeAt(b+1),a>=48&&a<=57)){w()}r=false;for(;b<t&&(a=e.charCodeAt(b),a>=48&&a<=57);b++);if(e.charCodeAt(b)==46){o=++b;for(;o<t&&(a=e.charCodeAt(o),a>=48&&a<=57);o++);if(o==b){w()}b=o}a=e.charCodeAt(b);if(a==101||a==69){a=e.charCodeAt(++b);if(a==43||a==45){b++}for(o=b;o<t&&(a=e.charCodeAt(o),a>=48&&a<=57);o++);if(o==b){w()}b=o}return+e.slice(i,b)}if(r){w()}if(e.slice(b,b+4)==\"true\"){b+=4;return true}else if(e.slice(b,b+5)==\"false\"){b+=5;return false}else if(e.slice(b,b+4)==\"null\"){b+=4;return null}w()}}return\"$\"};var R=function(e){var t,n;if(e==\"$\"){w()}if(typeof e==\"string\"){if((s?e.charAt(0):e[0])==\"@\"){return e.slice(1)}if(e==\"[\"){t=[];for(;;n||(n=true)){e=D();if(e==\"]\"){break}if(n){if(e==\",\"){e=D();if(e==\"]\"){w()}}else{w()}}if(e==\",\"){w()}t.push(R(e))}return t}else if(e==\"{\"){t={};for(;;n||(n=true)){e=D();if(e==\"}\"){break}if(n){if(e==\",\"){e=D();if(e==\"}\"){w()}}else{w()}}if(e==\",\"||typeof e!=\"string\"||(s?e.charAt(0):e[0])!=\"@\"||D()!=\":\"){w()}t[e.slice(1)]=R(D())}return t}w()}return e};var L=function(e,t,n){var i=z(e,t,n);if(i===O){delete e[t]}else{e[t]=i}};var z=function(e,t,n){var i=e[t],o;if(typeof i==\"object\"&&i){if(y.call(i)==I){for(o=i.length;o--;){L(i,o,n)}}else{X(i,function(e){L(i,e,n)})}}return n.call(e,t,i)};c.parse=function(e,t){var n,i;b=0;M=\"\"+e;n=R(D());if(D()!=\"$\"){w()}b=M=null;return t&&y.call(t)==p?z((i={},i[\"\"]=n,i),\"\",t):n}}}c[\"runInContext\"]=V;return c}if(t&&!e){V(B,t)}else{var i=B.JSON,o=B[\"JSON3\"],r=false;var a=V(B,B[\"JSON3\"]={noConflict:function(){if(!r){r=true;B.JSON=i;B[\"JSON3\"]=o;i=o=null}return a}});B.JSON={parse:a.parse,stringify:a.stringify}}if(e){define(function(){return a})}}).call(this);(function(u){var t=/\\+/g;function g(e){return v.raw?e:encodeURIComponent(e)}function p(e){return v.raw?e:decodeURIComponent(e)}function h(e){return g(v.json?JSON.stringify(e):String(e))}function i(e){if(e.indexOf(\'\"\')===0){e=e.slice(1,-1).replace(/\\\\\"/g,\'\"\').replace(/\\\\\\\\/g,\"\\\\\")}try{e=decodeURIComponent(e.replace(t,\" \"));return v.json?JSON.parse(e):e}catch(e){}}function S(e,t){var n=v.raw?e:i(e);return u.isFunction(t)?t(n):n}var v=u.cookie=function(e,t,n){if(arguments.length>1&&!u.isFunction(t)){n=u.extend({},v.defaults,n);if(typeof n.expires===\"number\"){var i=n.expires,o=n.expires=new Date;o.setTime(+o+i*864e5)}return document.cookie=[g(e),\"=\",h(t),n.expires?\"; expires=\"+n.expires.toUTCString():\"\",n.path?\"; path=\"+n.path:\"\",n.domain?\"; domain=\"+n.domain:\"\",n.secure?\"; secure\":\"\"].join(\"\")}var r=e?undefined:{};var a=document.cookie?document.cookie.split(\"; \"):[];for(var s=0,c=a.length;s<c;s++){var l=a[s].split(\"=\");var f=p(l.shift());var d=l.join(\"=\");if(e&&e===f){r=S(d,t);break}if(!e&&(d=S(d))!==undefined){r[f]=d}}return r};v.defaults={};u.removeCookie=function(e,t){if(u.cookie(e)===undefined){return false}u.cookie(e,\"\",u.extend({},t,{expires:-1}));return!u.cookie(e)};u.readCookie=S})(jQuery);(function(e,n){var t=e.CoreObject;var o=e.CoreObject=function e(){};o.extend=function(e,t){var n,i;n=this;if(n.constructor!=Function||typeof e!=\"function\"){throw\"`extend` only supports function-based inheritance\"}e.prototype=new n;for(i in n){if(n.hasOwnProperty(i)){if(i===\"_super\"||i===\"extend\"||i===\"create\"){continue}e[i]=n[i]}}for(i in t){if(t.hasOwnProperty(i)){e[i]=t[i]}}e._super=n;e.prototype.constructor=e;e.__name__=e.prototype.__name__=r(e);e.prototype.__class__=e;e.extend=o.extend;e.create=o.create;return e};o.create=function(){var e=this;var t=new e;if(t.initialize!==n){t.initialize.apply(t,arguments)}return t};o.noConflict=function(){e.CoreObject=t;return o};function r(e){var t=/function\\s+(.+?)\\s*\\(/;var n=t.exec(e.toString());return n&&n.length>1?n[1]:\"\"}})(window);(function(t,e){var n,i;n=t.location.origin;i=t.locationOrigin;t.locationOrigin={noConflict:function(){var e=t.location.origin;t.location.origin=n;t.locationOrigin=i;return e}};if(!t.location.origin){t.location.origin=t.location.protocol+\"//\"+t.location.hostname+(t.location.port?\":\"+t.location.port:\"\")}})(window);(function(i){var o=i.SMCX=new function e(){var t=this;this.window=i;this.jQuery=this.$=jQuery.noConflict(true);this.JSON=i[\"JSON3\"].noConflict();this.locationOrigin=i.locationOrigin.noConflict();this.Object=i.CoreObject.noConflict();this.DEBUG_QUERY_PARAM=\"smcx_debug\";this.FORCE_SHOW_QUERY_PARAM=\"smcx_force_show\";t.initialize=function(e){t.PERF=e.perf;o.T(\"initializing\");t.env=new o.Sandbox.Env;t.env.initialize(e)};t.boot=function(e){t.env.boot(e)};t.destroy=function(){if(t.env){t.env.destroy()}};t.debug=function(){if(t.env&&t.env.DEBUG){return true}var e=o.Utils.queryParams(i.parent);return e.indexOf(t.DEBUG_QUERY_PARAM)!==-1};t.T=function(e){t.PERF[e]=new Date-t.PERF[0]};function n(e,t){t=t||{};t.namespace=\"sandbox\";o.log(e,t)}};i.SMCX.Sandbox={}})(window,document);(function(n){n.SMCX.log=function(e,t){t=t||{};if(SMCX.debug()||t.force){if(n.console){if(typeof e===\"string\"){if(t.namespace){e=\"[smcx.\"+t.namespace+\"] \"+e}else{e=\"[smcx] \"+e}}console.log(e)}}}})(window);(function(e){e.SMCX.Utils={queryParams:function(e){return e.document.location.search},onMobile:function(e){var t,n,i;n=e.document.documentElement.clientWidth;t=e.innerWidth;i=Math.max(t,n||0);return i<=760},xdmSupported:function(e){return!!e[\"postMessage\"]},browserHasLowStylesLimit:function(e){return!(\"getComputedStyle\"in e)},numStyles:function(e){var t,n,i;t=e.document;n=t.getElementsByTagName(\"link\").length;i=t.getElementsByTagName(\"style\").length;return n+i}}})(window);SMCX.UUID={generate:function(){var n=(new Date).getTime();return\"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx\".replace(/[xy]/g,function(e){var t=(n+Math.random()*16)%16|0;n=Math.floor(n/16);return(e==\"x\"?t:t&3|8).toString(16)})}};(function(e,l){SMCX.Cookie={filter:function(e,t){this.log(\"Extracting CX cookies\");var n,i,o,r,a;if(e===l){this.log(\"WARNING: tried to extract CX cookies from undefined cookie\");return}i={};e=e.replace(/\\+/g,\" \");e=decodeURIComponent(e);n=e.split(\";\");for(var s=0,c=n.length;s<c;s++){n[s]=SMCX.$.trim(n[s]);try{o=n[s].split(\"=\");r=o[0];a=o[1];if(r&&a&&t(r,a)){i[r]=a}}catch(e){this.log(\"WARNING: malformed cookie key-value pair\")}}return i},log:function(e,t){t=t||{};t.namespace=\"cookie\";SMCX.log(e,t)}}})(window);(function(e){SMCX.Messenger=function(){var a;this.initialize=function(e){a=this;a.bindings={};a.window=e.window};this.bind=function(e,t){l(e);if(!a.bindings[e]){a.bindings[e]=[]}a.bindings[e].push(t)};this.send=function(e,t){var n,i,o;n=t.target;i=t.targetOrigin;o=t.data||{};o.eventName=e;o.eventID=c();f(e,o);if(t.success){a.bindings[o.eventID]=[t.success]}o=SMCX.JSON.stringify(o);n.postMessage(o,i)};this.request=function(e,t){a.log(\"Request: \"+e);if(!a.providerFrame){throw\"Cannot send a request without loading the provider\"}t.target=a.providerFrame;t.targetOrigin=a.providerOrigin;a.send(e,t)};this.respondTo=function(n,i,o){var r;a.bind(n,function(e,t){r=i(e,t);r.requestID=e.eventID;a.send(n,{target:a.window.parent,targetOrigin:o.targetOrigin,data:r})})};this.destroy=function(){a.log(\"Destroying SMCX.Messenger\");e()};this.bindOnMessageReceived=function(){if(a.window.addEventListener){a.window.addEventListener(\"message\",t,false)}else{a.window.attachEvent(\"onmessage\",t)}};this.log=function(e){SMCX.log(e,{namespace:\"messenger\"})};function e(){a.log(\"==> unbinding onMessageReceived\");if(a.window.addEventListener){a.window.removeEventListener(\"message\",t)}else{a.window.detachEvent(\"onmessage\",t)}}function t(e){var t=i(e);if(n(t)){if(t.requestID){r(t,e)}else{o(t,e)}}}function n(e){return e&&e.eventName&&e.eventName.substring(0,3)===\"sm:\"}function i(e){var t=e.data;if(typeof t===\"string\"){try{t=SMCX.JSON.parse(t)}catch(e){a.log(\"Invalid JSON: could not parse data\");return null}}return t}function o(e,t){var n=e.eventName,i=a.bindings[n];d(e);if(i){s(i,[e,t])}else{a.log(\"No bindings for \"+n)}}function r(e,t){var n=e.eventName,i=e.requestID,o=a.bindings[i];u(e);if(o){s(o,[e,t],function(){delete a.bindings[i]})}else{a.log(\"No bindings for \"+n)}}function s(e,t,n){var i=0,o=e.length,r;for(;i<o;i++){r=e[i];r.apply(this,t);if(n){n()}}}function c(){return SMCX.UUID.generate()}function l(e){var t=a.role||\"messenger\";a.log(\"Binding \"+e+\" in \"+t)}function f(e,t){var n=\"Sending \"+e+\"#\"+t.eventID;a.log(n)}function d(e){var t=\"Message received: \"+e.eventName;if(e.eventID){t+=\"#\"+e.eventID}a.log(t)}function u(e){var t=\"Response received for request: \"+e.eventName+\"#\"+e.requestID;a.log(t)}}})(window);(function(){var t={\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",\'\"\':\"&quot;\",\"\'\":\"&#39;\",\"/\":\"&#x2F;\"};SMCX.escapeHTML=function(e){return String(e).replace(/[&<>\"\'\\/]/g,function(e){return t[e]})};SMCX.unescapeBreaks=function(e){return e.replace(/&lt;br&gt;/g,\"<br>\")};SMCX.nl2br=function(e){var t=\"<br>\";return(e+\"\").replace(/([^>\\r\\n]?)(\\r\\n|\\n\\r|\\r|\\n)/g,\"$1\"+t+\"$2\")}})();(function(i,o){SMCX.Sandbox.Env=function e(){var t=this;this.initialize=function(e){t.NAME=e.env;t.DEBUG=e.debug;this.__TYPE__=\"sandbox\";n(\"Initializing environment (type=sandbox, debug=\"+t.DEBUG+\")\");t.$parentWindow=SMCX.$(i.parent);t.$parentDocument=SMCX.$(i.parent.document);t.$parentBody=SMCX.$(i.parent.document.body);t.$stage=t.$parentBody.find(\"#__smcx__\");t.CX_COOKIES=SMCX.Cookie.filter(i[\"SM_COOKIE\"],function(e){return e.slice(0,2)===\"CX\"});t.app=SMCX.Sandbox.App.create(e.data,e.settings);SMCX.T(\"initialized\");t.initialized=true;i.parent.SMCX.env.trigger(\"smcx.sandbox:init\",i,SMCX)};this.boot=function(e){SMCX.T(\"booting\");n(\"Booting SMCX\");SMCX.$(o).ready(function(){t.app.boot(function(){SMCX.T(\"booted\");t.app.render(function(){SMCX.T(\"rendered\");n(SMCX.PERF,{force:true});i.parent.SMCX.env.trigger(\"smcx.sandbox:boot\",i,SMCX);if(e){e(SMCX)}})})})};this.destroy=function(){n(\"Destroying SMCX (type=sandbox)\");if(t.app){t.app.destroy();t.app=null}};function n(e,t){t=t||{};t.namespace=\"sandbox.env\";SMCX.log(e,t)}}})(window,document);SMCX.Sandbox.App=SMCX.Object.extend(function e(){var i=this;this.initialize=function(e,t){i.log(\"Initializing SMCX.Sandbox.App\");i.booted=false;i.widget=null;i.widgetView=null;i.assets={css:[]};i.config=SMCX.Sandbox.Configuration.create(t);i.messenger=new SMCX.Messenger;i.messenger.initialize({window:window.parent});SMCX.TEMPLATES=n(e[\"sdk_html\"]);i.assets.css.push(e[\"sdk_css\"]);i.assets.css.push(e[\"widget_css\"]);i.widget=SMCX.Sandbox.WidgetFactory.create(e[\"widget_attrs\"]);i.widgetView=SMCX.Sandbox.WidgetViewFactory.create(i.widget)};this.boot=function(e){i.log(\"Booting SMCX.Sandbox.App\");SMCX.$(document).ready(function(){t();i.booted=true;o();if(e){e.call(e)}})};this.render=function(e){i.log(\"Rendering SMCX.Sandbox.App\");a(e)};this.destroy=function(){i.log(\"Destroying SMCX.Sandbox.App\");if(i.messenger){i.messenger.destroy();i.messenger=null}if(i.booted){i.widgetView.$el.remove();SMCX.env.$parentBody.find(\".smcx-style\").remove()}};this.log=function(e){SMCX.log(e,{namespace:\"app\"})};function n(e){var n={},i,o,t;t=SMCX.$(e);t.map(function(e,t){o=t.id;if(o){o=o.replace(\"smcx_\",\"\").replace(\"_template\",\"\");i=SMCX.$.trim(t.innerHTML);i=i.replace(/(\\r\\n|\\n|\\r)/gm,\"\").replace(/\\s{2,}/g,\"\");n[o]=i}});return n}function t(){var e=i.assets[\"css\"];for(var t=0;t<e.length;t++){var n=e[t];s(n)}}function o(){i.messenger.bindOnMessageReceived();i.messenger.bind(\"sm:close_window\",r)}function r(){i.widgetView.animateOut()}function a(t){i.widgetView.isShowable(function(e){if(e){i.widgetView.insert().animateIn(function(){if(t){t.call(t)}})}else{i.log(\"widgetView was not showable\");if(t){t.call(t)}}})}function s(e){var t=\"<style class=\'smcx-style\' type=\'text/css\'>\"+e+\"</style>\";SMCX.env.$stage.append(SMCX.$(t))}});SMCX.Sandbox.Configuration=SMCX.Object.extend(function e(){var s=this;this.settings=null;this.initialize=function(e){this.settings=e};this.settingsFor=function(e){var t=0,n=s.settings.length,i,o,r,a={};for(;t<n;t++){i=s.settings[t];if(i[0]==e){o=i[1];r=i[2];a[o]=r}}return a}});SMCX.Sandbox.WidgetFactory=new function e(){var i=this;this.WIDGET_TYPES={EmbedWidget:\"EmbedWidget\",ModalInvitationWidget:\"ModalInvitationWidget\",ModalSurveyWidget:\"ModalSurveyWidget\"};this.create=function(e,t){var n,i;i=o(e.type);n=new i;n.initialize(e,t);return n};function o(e){var t,n;t=i.WIDGET_TYPES[e];if(!t){n=e+\" is an invalid type for SMCX.Sandbox.Widget\";throw n}return SMCX.Sandbox[t]}};(function(e,t){SMCX.Sandbox.Widget=SMCX.Object.extend(function e(){var o;this.COLLECTOR_STATUSES={open:\"open\",closed:\"closed\"};this.initialize=function(e){o=this;o.id=e[\"id\"];o.smCollectorId=e[\"sm_collector_id\"];o.type=e[\"type\"];o.collectorStatus=e[\"collector_status\"];o.url=e[\"url\"];o.hideBranding=!!e[\"hide_branding\"]};this.isEmbed=function(){return this.type==\"EmbedWidget\"};this.isModalInvitation=function(){return this.type==\"ModalInvitationWidget\"};this.isModalSurvey=function(){return this.type==\"ModalSurveyWidget\"};this.isSampleable=function(){return o.sampleRate!==t};this.collectorIsOpen=function(){return o.collectorStatus==o.COLLECTOR_STATUSES.open};this.collectorIsClosed=function(){return o.collectorStatus==o.COLLECTOR_STATUSES.closed};this.modifyIframeUrlForIosBrowsers=function(e){if(!e.hasOwnProperty(\"embedded\")){e.embedded=\"1\"}return e},this.parametrizedUrl=function(e){var t,n,i;t=o.url;i=\"\";n=SMCX.env.app.config.settingsFor(\"custom_variable\");if(e){n=o.modifyIframeUrlForIosBrowsers(n)}if(!SMCX.$.isEmptyObject(n)){i+=SMCX.$.param(n)}if(i.length){t+=\"?\"+i}return t}})})(window);SMCX.Sandbox.EmbedWidget=SMCX.Sandbox.Widget.extend(function e(){var t=SMCX.Sandbox.EmbedWidget.prototype;this.initialize=function(e){t.initialize.apply(this,arguments);this.bgColorA=e[\"bg_color_a\"];this.hideOnRepeatVisits=e[\"hide_on_repeat_visits\"]}});SMCX.Sandbox.ModalInvitationWidget=SMCX.Sandbox.Widget.extend(function e(){var t=SMCX.Sandbox.ModalInvitationWidget.prototype;this.initialize=function(e){t.initialize.apply(this,arguments);this.headline=e[\"headline\"];this.message=e[\"message\"];this.primaryBtnText=e[\"primary_btn_text\"];this.secondaryBtnText=e[\"secondary_btn_text\"];this.bgColorA=e[\"bg_color_a\"];this.sampleRate=e[\"sample_rate\"]}});SMCX.Sandbox.ModalSurveyWidget=SMCX.Sandbox.Widget.extend(function e(){var t=SMCX.Sandbox.ModalSurveyWidget.prototype;this.initialize=function(e){t.initialize.apply(this,arguments);this.headline=e[\"headline\"];this.bgColorA=e[\"bg_color_a\"];this.sampleRate=e[\"sample_rate\"]}});SMCX.Sandbox.WidgetViewFactory=new function e(){var n=this;this.TYPE_TO_VIEW_MAP={EmbedWidget:\"EmbedWidgetView\",ModalInvitationWidget:\"ModalInvitationWidgetView\",ModalSurveyWidget:\"ModalSurveyWidgetView\"};this.create=function(e,t){var n,i;i=o(e.type);n=new i;n.initialize(e,t);return n};function o(e){var t=n.TYPE_TO_VIEW_MAP[e];if(!t){throw\"Invalid type: must be one of \'EmbedWidget\', \"+\"\'ModalInvitationWidget\', or \'ModalSurveyWidget\', but it was \"+e}return SMCX.Sandbox[t]}};SMCX.Sandbox.WidgetView=SMCX.Object.extend(function e(){var n;this.WIDGET_TYPES={embed:\"EmbedWidget\",modalInvitation:\"ModalInvitationWidget\",modalSurvey:\"ModalSurveyWidget\"};this.ANIMATION_DURATION=300;this.SHOW_CLASS=\"smcx-show\";this.HIDE_CLASS=\"smcx-hide\";this.initialize=function(e,t){n=this;n.widget=e;n.classes={off:[],on:[]};if(!n.templateName){throw\"Subclasses of WidgetView must set `templateName`\"}n.$el=n._createElement(n.templateName);n._setClasses();n._bindEvents(n.$el)};this._createElement=function(e){var t=SMCX.TEMPLATES[e];return SMCX.$(t)};this._setClasses=function(){var e=n.widget.bgColorA.replace(\"#\",\"\");if(parseInt(e,16)>13421771){n.classes.on.push(\"smcx-widget-light\")}else{n.classes.on.push(\"smcx-widget-dark\")}if(n.widget.hideBranding){n.classes.on.push(\"smcx-hide-branding\")}};this._bindEvents=function(){};this.render=function(){SMCX.log(\"Rendering an SMCX.Sandbox.WidgetView\");this.$el.addClass(i(this));return this};this.insert=function(){};this.animateIn=function(e){var t=this;t.$el.removeClass(t[\"HIDE_CLASS\"]).addClass(t[\"SHOW_CLASS\"]);setTimeout(function(){t.$el.removeClass(i(t)).addClass(o(t));t.setLastShownAt();if(e){e.call(e)}},0)};this.animateOut=function(e){var t=this;t.$el.removeClass(o(t)).addClass(i(t));setTimeout(function(){t.$el.removeClass(t[\"SHOW_CLASS\"]).addClass(t[\"HIDE_CLASS\"]);if(e){e.call(e)}},t[\"ANIMATION_DURATION\"])};function i(e){return e.classes.off.join(\" \")}function o(e){return e.classes.on.join(\" \")}function a(){var e=SMCX.Utils.queryParams(window.parent);return e.indexOf(SMCX.FORCE_SHOW_QUERY_PARAM)>0||document.location.protocol===\"file:\"}this.isShowable=function(e){var t,n,i,o,r;t=this;n=false;if(a()){n=true;e.call(e,n);return}if(t.widget.isEmbed()&&!SMCX.$(window.parent.document).find(\"body #smcx-sdk\").length){SMCX.log(\"WidgetView is not showable because script is in <head>\");n=false;e.call(e,n);return}r=t.respondentStatusFor(t.widget.smCollectorId);SMCX.log(\"User has taken survey? \"+r.userHasTakenSurvey);if(t.widget.collectorIsOpen()){if(r[\"userHasTakenSurvey\"]){if(t.widget.isEmbed()&&!t.widget.hideOnRepeatVisits){n=true}}else{if(t.widget.isEmbed()){n=true}else{if(t.widget.isSampleable()){i=Math.random()>t.widget.sampleRate/100;o=t.getLastShownAt();if(!i&&!o){n=true}}else{n=true}}}}e.call(e,n)};this.getLastShownAt=function(){var e=\"smcx_\"+n.widget.id+\"_last_shown_at\";return SMCX.$.cookie(e)};this.setLastShownAt=function(){var e=\"smcx_\"+n.widget.id+\"_last_shown_at\",t=(new Date).getTime();SMCX.$.cookie(e,t)};this.respondentStatusFor=function(e){var t,n,i;i=\"CX_\"+e;n=SMCX.env.CX_COOKIES[i];t={userHasTakenSurvey:Boolean(n)};return t}});SMCX.Sandbox.EmbedWidgetView=SMCX.Sandbox.WidgetView.extend(function e(){var t=SMCX.Sandbox.EmbedWidgetView.prototype;this.templateName=\"embed\";this.render=function(){t.render.call(this);this.$el.find(\"iframe\").attr(\"src\",this.widget.parametrizedUrl(true));return this};this.insert=function(){SMCX.env.$parentBody.find(\"#smcx-sdk\").before(this.render().$el);t.insert.call(this);return this};this._setClasses=function(){t._setClasses.call(this)};this._bindEvents=function(){t._bindEvents.call(this)}});SMCX.Sandbox.ModalInvitationWidgetView=SMCX.Sandbox.WidgetView.extend(function e(){var r=this;var a=SMCX.Sandbox.ModalInvitationWidgetView.prototype;r.templateName=\"modal_invitation\";r.render=function(){a.render.call(r);var e,t,n,i,o;e=SMCX.escapeHTML(r.widget.headline);t=SMCX.unescapeBreaks(SMCX.escapeHTML(SMCX.nl2br(r.widget.message)));n=SMCX.escapeHTML(r.widget.primaryBtnText);i=SMCX.escapeHTML(r.widget.secondaryBtnText);o=r.widget.parametrizedUrl();r.$el.find(\"[smcx-modal-headline]\").html(e);r.$el.find(\"[smcx-modal-message]\").html(t);r.$el.find(\"[smcx-btn-primary]\").html(n);r.$el.find(\"[smcx-btn-secondary]\").html(i);r.$el.find(\"[smcx-btn-primary]\").attr(\"href\",o);return r};r.insert=function(){SMCX.env.$parentBody.append(r.render().$el);a.insert.call(r);return r};r._setClasses=function(){a._setClasses.call(r);r.classes.off.push(\"smcx-modal-offset-bottom\");r.classes.off.push(\"smcx-transparent\");r.classes.on.push(\"smcx-opaque\")};r._bindEvents=function(){a._bindEvents.call(r);r.$el.find(\".smcx-modal-close\").on(\"click\",function(e){e.preventDefault();r.animateOut()});r.$el.find(\"[smcx-btn-primary]\").on(\"click\",function(e){r.animateOut()});r.$el.find(\"[smcx-btn-secondary]\").on(\"click\",function(e){e.preventDefault();r.animateOut()})}});SMCX.Sandbox.ModalSurveyWidgetView=SMCX.Sandbox.WidgetView.extend(function e(){var n=this;var i=SMCX.Sandbox.ModalSurveyWidgetView.prototype;n.templateName=\"modal_survey\";n.render=function(){i.render.call(n);var e,t;e=SMCX.escapeHTML(n.widget.headline);t=n.widget.parametrizedUrl(true);n.$el.find(\"[smcx-modal-headline]\").html(e);n.$el.find(\"iframe\").attr(\"src\",t);return n};n.insert=function(){SMCX.env.$parentBody.append(n.render().$el);i.insert.call(n);return n};n._setClasses=function(){i._setClasses.call(n);n.classes.off.push(\"smcx-modal-offset-bottom\");n.classes.off.push(\"smcx-transparent\");n.classes.on.push(\"smcx-opaque\")};n._bindEvents=function(){i._bindEvents.call(n);n.$el.find(\".smcx-modal-close\").on(\"click\",function(e){e.preventDefault();n.animateOut()})}});(function(e){if(!parent||!parent.SMCX||!parent.SMCX.env||!parent.window.SMCX.env){return}var t=parent.SMCX.env;if(t.NAME===\"test\"){e.onerror=e.parent.SMCX.onerror}t.trigger(\"smcx.container:sdkjs:loaded\",e);if(t.options.sandbox.init){SMCX.initialize({env:t.NAME,debug:t.DEBUG,data:t.options.sandbox.data,settings:t.settings,perf:parent.SMCX.PERF});if(t.options.sandbox.boot){if(SMCX.env.initialized){SMCX.boot()}}}})(window);',
                data: {
                    'sdk_css': ".smcx-widget{display:block;margin:0;padding:0 !important;position:static;z-index:999997;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-weight:100;font-size:13px;line-height:13px;color:black;opacity:1.0;transform:translate3d(0, 0, 0);-webkit-transition:all 300ms ease 0;-moz-transition:all 300ms ease 0;-ms-transition:all 300ms ease 0;-o-transition:all 300ms ease 0;transition:all 300ms ease 0}.smcx-widget,.smcx-widget *{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.smcx-widget-footer{position:relative;width:100%;height:35px;margin:0;padding:0 10px}.smcx-widget-footer>.smcx-branding{display:block;position:absolute;top:0;right:10px;width:300px;height:35px;line-height:35px;background-position:right 3px;background-attachment:scroll;background-repeat:no-repeat;cursor:pointer}.smcx-widget-footer>.smcx-branding>.smcx-powered-by{position:absolute;top:0;right:146px;height:35px;margin:0;padding:0;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:11px;font-weight:normal;line-height:35px;text-align:right}.smcx-embed{position:static !important;width:470px;height:295px;overflow:hidden;border:1px solid #ccc;background-color:#FFF;-webkit-border-top-left-radius:0;-webkit-border-top-right-radius:0;-webkit-border-bottom-right-radius:3px;-webkit-border-bottom-left-radius:3px;-moz-border-radius-topleft:0;-moz-border-radius-topright:0;-moz-border-radius-bottomright:3px;-moz-border-radius-bottomleft:3px;border-top-left-radius:0;border-top-right-radius:0;border-bottom-right-radius:3px;border-bottom-left-radius:3px}.smcx-embed-footer{-webkit-border-top-left-radius:0;-webkit-border-top-right-radius:0;-webkit-border-bottom-right-radius:3px;-webkit-border-bottom-left-radius:3px;-moz-border-radius-topleft:0;-moz-border-radius-topright:0;-moz-border-radius-bottomright:3px;-moz-border-radius-bottomleft:3px;border-top-left-radius:0;border-top-right-radius:0;border-bottom-right-radius:3px;border-bottom-left-radius:3px}.smcx-modal{position:fixed !important;width:470px;height:295px;left:50%;top:50%;margin:-147.5px 0 0 -235px;padding:0;background:#7f7f2f;background:-webkit-gradient(linear, left top, left bottom, from(#BCD732), to(#B2CB2C));background:-moz-linear-gradient(center top, #BCD732 0%, #B2CB2C 100%);background:-moz-gradient(center top, #BCD732 0%, #B2CB2C 100%);border-radius:5px}.smcx-modal-header{position:relative;width:100%;height:35px;margin:0;padding:0 10px}.smcx-modal-header>.smcx-modal-title{height:35px;line-height:35px;margin:0;padding:0;font-size:14px;font-weight:bold;color:#FFFFFF}.smcx-modal-content{position:relative;height:250px;margin:0;padding:20px;background:white;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box;overflow:none}.smcx-modal-content>.smcx-modal-h1{margin:20px 0 15px 0;padding:0;color:#000;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:28px;font-weight:normal;line-height:28px;text-align:center;word-wrap:break-word}.smcx-modal-content>.smcx-modal-p{color:#333;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;line-height:18px;text-align:center;word-wrap:break-word}.smcx-iframe-container{height:100%;overflow:hidden;margin:0 !important}.smcx-modal-actions{position:absolute;bottom:10px;left:0;width:100%;height:57px;padding:10px 20px}.smcx-modal-close{position:absolute;top:10px;right:10px;width:16px;height:16px;background:#E8E8E8 url(\"https://prod.smassets.net/assets/responseweb/responseweb/0.364.5/assets/images/website/x.png\") 2px 2px scroll no-repeat;cursor:pointer;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box;-webkit-transition:background-color 300ms ease 0;-moz-transition:background-color 300ms ease 0;-ms-transition:background-color 300ms ease 0;-o-transition:background-color 300ms ease 0;transition:background-color 300ms ease 0}.smcx-modal-close:hover{background-color:#C8C8C8}.smcx-modal-invitation>.smcx-modal-content{margin:10px 10px 0 10px}.smcx-modal-survey>.smcx-modal-content{margin:0 10px;padding:0}.smcx-btn{display:inline-block;margin-bottom:0;font-weight:bold;text-align:center;vertical-align:middle;cursor:pointer;background-image:none;border:1px solid transparent;white-space:nowrap;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:8px 14px;font-size:14px;line-height:1.42857;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box}.smcx-btn,.smcx-btn:hover{text-decoration:none}.smcx-btn-secondary{color:#333;background:#7f7f7f;background:-webkit-gradient(linear, left top, left bottom, from(#F8F8F8), to(#E8E8E8));background:-moz-linear-gradient(center top, #F8F8F8 0%, #E8E8E8 100%);background:-moz-gradient(center top, #F8F8F8 0%, #E8E8E8 100%);border:none;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box}.smcx-btn-secondary:hover{color:#333}.smcx-btn-primary{color:#FFF;background:#7f7f35;background:-webkit-gradient(linear, left top, left bottom, from(#BED830), to(#86A33B));background:-moz-linear-gradient(center top, #BED830 0%, #86A33B 100%);background:-moz-gradient(center top, #BED830 0%, #86A33B 100%);border:none}.smcx-btn-primary:hover{color:#FFF;background:#7f7f43;background:-webkit-gradient(linear, left top, left bottom, from(#c5dc45), to(#95b642));background:-moz-linear-gradient(center top, #c5dc45 0%, #95b642 100%);background:-moz-gradient(center top, #c5dc45 0%, #95b642 100%)}.smcx-widget-light .smcx-widget-footer>.smcx-branding{background-image:url(\"https://prod.smassets.net/assets/responseweb/responseweb/0.364.5/assets/images/website/sm-logo-grey-145x30.png\")}.smcx-widget-light .smcx-widget-footer>.smcx-branding>.smcx-powered-by{color:#60604A}.smcx-widget-dark .smcx-widget-footer>.smcx-branding{background-image:url(\"https://prod.smassets.net/assets/responseweb/responseweb/0.364.5/assets/images/website/sm-logo-white-145x30.png\")}.smcx-widget-dark .smcx-widget-footer>.smcx-branding>.smcx-powered-by{color:#FFF}.smcx-widget.smcx-hide-branding .smcx-embed-footer{display:none}.smcx-widget.smcx-hide-branding .smcx-modal-footer{height:10px}.smcx-widget.smcx-hide-branding .smcx-modal-footer>.smcx-branding{display:none}.smcx-show{display:block}.smcx-hide{display:none}.smcx-transparent{opacity:0.0 !important}.smcx-opaque{opacity:1.0 !important}.smcx-offscreen-top{top:-100px !important}.smcx-offscreen-bottom{bottom:-100px !important}.smcx-offscreen-left{left:-100px !important}.smcx-offscreen-right{right:-100px !important}.smcx-modal-offset-top{margin-top:-185px !important}.smcx-modal-offset-bottom{margin-top:-105px !important}.smcx-top{top:0}.smcx-bottom{bottom:0}.smcx-left{left:0}.smcx-right{right:0}.smcx-pull-left{float:left}.smcx-pull-right{float:right}\n",
                    'sdk_html': "<div data-type=\"text/x-smcx-template\" id=\"smcx_modal_invitation_template\">\n\n  <div class=\"smcx-widget smcx-modal smcx-modal-invitation smcx-hide\">\n    <div class=\"smcx-modal-content\">\n      <div smcx-modal-close class=\"smcx-modal-close\"></div>\n      <h1 smcx-modal-headline class=\"smcx-modal-h1\"></h1>\n\n      <p smcx-modal-message class=\"smcx-modal-p\"></p>\n\n      <div class=\"smcx-modal-actions smcx-clearfix\">\n        <a smcx-btn-secondary href=\"#\"\n           class=\"smcx-btn smcx-btn-secondary smcx-pull-left\"></a>\n        <a smcx-btn-primary href=\"#\" target=\"_blank\"\n           class=\"smcx-btn smcx-btn-primary smcx-pull-right\"></a>\n      </div>\n    </div>\n    <div class=\"smcx-widget-footer smcx-modal-footer\">\n      <a class=\"smcx-branding\" href=\"https://www.surveymonkey.com/?ut_source=powered_by&ut_source2=new_website_collector\" target=\"_blank\">\n        <span class=\"smcx-powered-by\">\n            powered by\n        </span>\n      </a>\n    </div>\n  </div>\n\n</div>\n\n<div data-type=\"text/x-smcx-template\" id=\"smcx_modal_survey_template\">\n\n  <div class=\"smcx-widget smcx-modal smcx-modal-survey smcx-hide\">\n    <div class=\"smcx-modal-header\">\n      <div smcx-modal-headline class=\"smcx-modal-title\"></div>\n      <div smcx-modal-close class=\"smcx-modal-close\"></div>\n    </div>\n\n    <div class=\"smcx-modal-content\">\n      <div class=\"smcx-iframe-container\">\n        <iframe width=\"100%\" height=\"100%\" frameborder=\"0\"\n                allowtransparency=\"true\"></iframe>\n      </div>\n    </div>\n\n    <div class=\"smcx-widget-footer smcx-modal-footer\">\n      <a class=\"smcx-branding\" href=\"https://www.surveymonkey.com/?ut_source=powered_by&ut_source2=new_website_collector\" target=\"_blank\">\n        <span class=\"smcx-powered-by\">\n            powered by\n        </span>\n      </a>\n    </div>\n  </div>\n\n</div>\n\n<div data-type=\"text/x-smcx-template\" id=\"smcx_embed_template\">\n\n  <div class=\"smcx-widget smcx-embed smcx-hide\">\n    <div class=\"smcx-iframe-container\">\n      <iframe width=\"100%\" height=\"100%\" frameborder=\"0\"\n              allowtransparency=\"true\"></iframe>\n    </div>\n    <div class=\"smcx-widget-footer smcx-embed-footer\">\n      <a class=\"smcx-branding\" href=\"https://www.surveymonkey.com/?ut_source=powered_by&ut_source2=new_website_collector\" target=\"_blank\">\n        <span class=\"smcx-powered-by\">\n            powered by\n        </span>\n      </a>\n    </div>\n  </div>\n\n</div>",
                    'widget_css': ".smcx-widget{display:block;margin:0;padding:0 !important;position:static;z-index:999997;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-weight:100;font-size:13px;line-height:13px;color:black;opacity:1.0;transform:translate3d(0, 0, 0);-webkit-transition:all 300ms ease 0;-moz-transition:all 300ms ease 0;-ms-transition:all 300ms ease 0;-o-transition:all 300ms ease 0;transition:all 300ms ease 0}.smcx-widget,.smcx-widget *{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.smcx-widget-footer{position:relative;width:100%;height:35px;margin:0;padding:0 10px}.smcx-widget-footer>.smcx-branding{display:block;position:absolute;top:0;right:10px;width:300px;height:35px;line-height:35px;background-position:right 3px;background-attachment:scroll;background-repeat:no-repeat;cursor:pointer}.smcx-widget-footer>.smcx-branding>.smcx-powered-by{position:absolute;top:0;right:146px;height:35px;margin:0;padding:0;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:11px;font-weight:normal;line-height:35px;text-align:right}.smcx-embed{position:static !important;width:470px;height:295px;overflow:hidden;border:1px solid #ccc;background-color:#FFF;-webkit-border-top-left-radius:0;-webkit-border-top-right-radius:0;-webkit-border-bottom-right-radius:3px;-webkit-border-bottom-left-radius:3px;-moz-border-radius-topleft:0;-moz-border-radius-topright:0;-moz-border-radius-bottomright:3px;-moz-border-radius-bottomleft:3px;border-top-left-radius:0;border-top-right-radius:0;border-bottom-right-radius:3px;border-bottom-left-radius:3px}.smcx-embed-footer{-webkit-border-top-left-radius:0;-webkit-border-top-right-radius:0;-webkit-border-bottom-right-radius:3px;-webkit-border-bottom-left-radius:3px;-moz-border-radius-topleft:0;-moz-border-radius-topright:0;-moz-border-radius-bottomright:3px;-moz-border-radius-bottomleft:3px;border-top-left-radius:0;border-top-right-radius:0;border-bottom-right-radius:3px;border-bottom-left-radius:3px}.smcx-modal{position:fixed !important;width:470px;height:295px;left:50%;top:50%;margin:-147.5px 0 0 -235px;padding:0;background:#b7d12f;background:-webkit-gradient(linear, left top, left bottom, from(#BCD732), to(#B2CB2C));background:-moz-linear-gradient(center top, #BCD732 0%, #B2CB2C 100%);background:-moz-gradient(center top, #BCD732 0%, #B2CB2C 100%);border-radius:5px}.smcx-modal-header{position:relative;width:100%;height:35px;margin:0;padding:0 10px}.smcx-modal-header>.smcx-modal-title{height:35px;line-height:35px;margin:0;padding:0;font-size:14px;font-weight:bold;color:#FFFFFF}.smcx-modal-content{position:relative;height:250px;margin:0;padding:20px;background:white;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box;overflow:none}.smcx-modal-content>.smcx-modal-h1{margin:20px 0 15px 0;padding:0;color:#000;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:28px;font-weight:normal;line-height:28px;text-align:center;word-wrap:break-word}.smcx-modal-content>.smcx-modal-p{color:#333;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:14px;font-weight:normal;line-height:18px;text-align:center;word-wrap:break-word}.smcx-iframe-container{height:100%;overflow:hidden;margin:0 !important}.smcx-modal-actions{position:absolute;bottom:10px;left:0;width:100%;height:57px;padding:10px 20px}.smcx-modal-close{position:absolute;top:10px;right:10px;width:16px;height:16px;background:#E8E8E8 url(\"https://prod.smassets.net/assets/responseweb/responseweb/0.364.5/assets/images/website/x.png\") 2px 2px scroll no-repeat;cursor:pointer;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box;-webkit-transition:background-color 300ms ease 0;-moz-transition:background-color 300ms ease 0;-ms-transition:background-color 300ms ease 0;-o-transition:background-color 300ms ease 0;transition:background-color 300ms ease 0}.smcx-modal-close:hover{background-color:#C8C8C8}.smcx-modal-invitation>.smcx-modal-content{margin:10px 10px 0 10px}.smcx-modal-survey>.smcx-modal-content{margin:0 10px;padding:0}.smcx-btn{display:inline-block;margin-bottom:0;font-weight:bold;text-align:center;vertical-align:middle;cursor:pointer;background-image:none;border:1px solid transparent;white-space:nowrap;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;padding:8px 14px;font-size:14px;line-height:1.42857;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box}.smcx-btn,.smcx-btn:hover{text-decoration:none}.smcx-btn-secondary{color:#333;background:#f0f0f0;background:-webkit-gradient(linear, left top, left bottom, from(#F8F8F8), to(#E8E8E8));background:-moz-linear-gradient(center top, #F8F8F8 0%, #E8E8E8 100%);background:-moz-gradient(center top, #F8F8F8 0%, #E8E8E8 100%);border:none;-webkit-background-clip:padding-box;-moz-background-clip:padding-box;-webkit-border-radius:3px;-moz-border-radius:3px;-ms-border-radius:3px;border-radius:3px;background-clip:padding-box}.smcx-btn-secondary:hover{color:#333}.smcx-btn-primary{color:#FFF;background:#a2be36;background:-webkit-gradient(linear, left top, left bottom, from(#BED830), to(#86A33B));background:-moz-linear-gradient(center top, #BED830 0%, #86A33B 100%);background:-moz-gradient(center top, #BED830 0%, #86A33B 100%);border:none}.smcx-btn-primary:hover{color:#FFF;background:#adc944;background:-webkit-gradient(linear, left top, left bottom, from(#c5dc45), to(#95b642));background:-moz-linear-gradient(center top, #c5dc45 0%, #95b642 100%);background:-moz-gradient(center top, #c5dc45 0%, #95b642 100%)}.smcx-widget-light .smcx-widget-footer>.smcx-branding{background-image:url(\"https://prod.smassets.net/assets/responseweb/responseweb/0.364.5/assets/images/website/sm-logo-grey-145x30.png\")}.smcx-widget-light .smcx-widget-footer>.smcx-branding>.smcx-powered-by{color:#60604A}.smcx-widget-dark .smcx-widget-footer>.smcx-branding{background-image:url(\"https://prod.smassets.net/assets/responseweb/responseweb/0.364.5/assets/images/website/sm-logo-white-145x30.png\")}.smcx-widget-dark .smcx-widget-footer>.smcx-branding>.smcx-powered-by{color:#FFF}.smcx-widget.smcx-hide-branding .smcx-embed-footer{display:none}.smcx-widget.smcx-hide-branding .smcx-modal-footer{height:10px}.smcx-widget.smcx-hide-branding .smcx-modal-footer>.smcx-branding{display:none}.smcx-show{display:block}.smcx-hide{display:none}.smcx-transparent{opacity:0.0 !important}.smcx-opaque{opacity:1.0 !important}.smcx-offscreen-top{top:-100px !important}.smcx-offscreen-bottom{bottom:-100px !important}.smcx-offscreen-left{left:-100px !important}.smcx-offscreen-right{right:-100px !important}.smcx-modal-offset-top{margin-top:-185px !important}.smcx-modal-offset-bottom{margin-top:-105px !important}.smcx-top{top:0}.smcx-bottom{bottom:0}.smcx-left{left:0}.smcx-right{right:0}.smcx-pull-left{float:left}.smcx-pull-right{float:right}.smcx-embed{width:100%;max-width:700px;height:700px}.smcx-embed>.smcx-iframe-container{width:100%;max-width:700px;height:665px}.smcx-embed>.smcx-embed-footer{background:#333E48}.smcx-embed.smcx-hide-branding>.smcx-iframe-container{height:700px}\n",
                    'widget_attrs': {"id": 0, "type": "EmbedWidget", "url": "https://www.surveymonkey.com/r/CLF2FDS", "sm_collector_id": 411554651, "collector_status": "open", "survey_url": "https://www.surveymonkey.com/r/CLF2FDS", "allow_multiple_responses": false, "width": 700, "height": 700, "message": "", "hide_completed": true, "bg_color_a": "#333E48", "bg_color_b": null, "branding_url": "https://www.surveymonkey.com/?ut_source=powered_by&ut_source2=new_website_collector", "hide_branding": true, "token_version": 2}
                }
            }
        });

        SMCX.boot();
    }

    
    
        wrapped.call(wrapped);
    

}());