/*
    Ractive.js v0.4.0
    2014-04-08 - commit 276c0e2b

    http://ractivejs.org
    http://twitter.com/RactiveJS

    Released under the MIT License.
*/

( function( global ) {

    'use strict';

    var noConflict = global.Ractive;

    var legacy = function() {

        var win, doc, exportedShims;
        if ( typeof window === 'undefined' ) {
            return;
        }
        win = window;
        doc = win.document;
        exportedShims = {};
        if ( !doc ) {
            return;
        }
        // Shims for older browsers
        if ( !Date.now ) {
            Date.now = function() {
                return +new Date();
            };
        }
        if ( !String.prototype.trim ) {
            String.prototype.trim = function() {
                return this.replace( /^\s+/, '' ).replace( /\s+$/, '' );
            };
        }
        // Polyfill for Object.keys
        // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys
        if ( !Object.keys ) {
            Object.keys = function() {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !{
                        toString: null
                    }.propertyIsEnumerable( 'toString' ),
                    dontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;
                return function( obj ) {
                    if ( typeof obj !== 'object' && typeof obj !== 'function' || obj === null ) {
                        throw new TypeError( 'Object.keys called on non-object' );
                    }
                    var result = [];
                    for ( var prop in obj ) {
                        if ( hasOwnProperty.call( obj, prop ) ) {
                            result.push( prop );
                        }
                    }
                    if ( hasDontEnumBug ) {
                        for ( var i = 0; i < dontEnumsLength; i++ ) {
                            if ( hasOwnProperty.call( obj, dontEnums[ i ] ) ) {
                                result.push( dontEnums[ i ] );
                            }
                        }
                    }
                    return result;
                };
            }();
        }
        // Array extras
        if ( !Array.prototype.indexOf ) {
            Array.prototype.indexOf = function( needle, i ) {
                var len;
                if ( i === undefined ) {
                    i = 0;
                }
                if ( i < 0 ) {
                    i += this.length;
                }
                if ( i < 0 ) {
                    i = 0;
                }
                for ( len = this.length; i < len; i++ ) {
                    if ( this.hasOwnProperty( i ) && this[ i ] === needle ) {
                        return i;
                    }
                }
                return -1;
            };
        }
        if ( !Array.prototype.forEach ) {
            Array.prototype.forEach = function( callback, context ) {
                var i, len;
                for ( i = 0, len = this.length; i < len; i += 1 ) {
                    if ( this.hasOwnProperty( i ) ) {
                        callback.call( context, this[ i ], i, this );
                    }
                }
            };
        }
        if ( !Array.prototype.map ) {
            Array.prototype.map = function( mapper, context ) {
                var array = this,
                    i, len, mapped = [],
                    isActuallyString;
                // incredibly, if you do something like
                // Array.prototype.map.call( someString, iterator )
                // then `this` will become an instance of String in IE8.
                // And in IE8, you then can't do string[i]. Facepalm.
                if ( array instanceof String ) {
                    array = array.toString();
                    isActuallyString = true;
                }
                for ( i = 0, len = array.length; i < len; i += 1 ) {
                    if ( array.hasOwnProperty( i ) || isActuallyString ) {
                        mapped[ i ] = mapper.call( context, array[ i ], i, array );
                    }
                }
                return mapped;
            };
        }
        if ( typeof Array.prototype.reduce !== 'function' ) {
            Array.prototype.reduce = function( callback, opt_initialValue ) {
                var i, value, len, valueIsSet;
                if ( 'function' !== typeof callback ) {
                    throw new TypeError( callback + ' is not a function' );
                }
                len = this.length;
                valueIsSet = false;
                if ( arguments.length > 1 ) {
                    value = opt_initialValue;
                    valueIsSet = true;
                }
                for ( i = 0; i < len; i += 1 ) {
                    if ( this.hasOwnProperty( i ) ) {
                        if ( valueIsSet ) {
                            value = callback( value, this[ i ], i, this );
                        }
                    } else {
                        value = this[ i ];
                        valueIsSet = true;
                    }
                }
                if ( !valueIsSet ) {
                    throw new TypeError( 'Reduce of empty array with no initial value' );
                }
                return value;
            };
        }
        if ( !Array.prototype.filter ) {
            Array.prototype.filter = function( filter, context ) {
                var i, len, filtered = [];
                for ( i = 0, len = this.length; i < len; i += 1 ) {
                    if ( this.hasOwnProperty( i ) && filter.call( context, this[ i ], i, this ) ) {
                        filtered[ filtered.length ] = this[ i ];
                    }
                }
                return filtered;
            };
        }
        if ( typeof Function.prototype.bind !== 'function' ) {
            Function.prototype.bind = function( context ) {
                var args, fn, Empty, bound, slice = [].slice;
                if ( typeof this !== 'function' ) {
                    throw new TypeError( 'Function.prototype.bind called on non-function' );
                }
                args = slice.call( arguments, 1 );
                fn = this;
                Empty = function() {};
                bound = function() {
                    var ctx = this instanceof Empty && context ? this : context;
                    return fn.apply( ctx, args.concat( slice.call( arguments ) ) );
                };
                Empty.prototype = this.prototype;
                bound.prototype = new Empty();
                return bound;
            };
        }
        // https://gist.github.com/Rich-Harris/6010282 via https://gist.github.com/jonathantneal/2869388
        // addEventListener polyfill IE6+
        if ( !win.addEventListener ) {
            ( function( win, doc ) {
                var Event, addEventListener, removeEventListener, head, style, origCreateElement;
                Event = function( e, element ) {
                    var property, instance = this;
                    for ( property in e ) {
                        instance[ property ] = e[ property ];
                    }
                    instance.currentTarget = element;
                    instance.target = e.srcElement || element;
                    instance.timeStamp = +new Date();
                    instance.preventDefault = function() {
                        e.returnValue = false;
                    };
                    instance.stopPropagation = function() {
                        e.cancelBubble = true;
                    };
                };
                addEventListener = function( type, listener ) {
                    var element = this,
                        listeners, i;
                    listeners = element.listeners || ( element.listeners = [] );
                    i = listeners.length;
                    listeners[ i ] = [
                        listener,
                        function( e ) {
                            listener.call( element, new Event( e, element ) );
                        }
                    ];
                    element.attachEvent( 'on' + type, listeners[ i ][ 1 ] );
                };
                removeEventListener = function( type, listener ) {
                    var element = this,
                        listeners, i;
                    if ( !element.listeners ) {
                        return;
                    }
                    listeners = element.listeners;
                    i = listeners.length;
                    while ( i-- ) {
                        if ( listeners[ i ][ 0 ] === listener ) {
                            element.detachEvent( 'on' + type, listeners[ i ][ 1 ] );
                        }
                    }
                };
                win.addEventListener = doc.addEventListener = addEventListener;
                win.removeEventListener = doc.removeEventListener = removeEventListener;
                if ( 'Element' in win ) {
                    Element.prototype.addEventListener = addEventListener;
                    Element.prototype.removeEventListener = removeEventListener;
                } else {
                    // First, intercept any calls to document.createElement - this is necessary
                    // because the CSS hack (see below) doesn't come into play until after a
                    // node is added to the DOM, which is too late for a lot of Ractive setup work
                    origCreateElement = doc.createElement;
                    doc.createElement = function( tagName ) {
                        var el = origCreateElement( tagName );
                        el.addEventListener = addEventListener;
                        el.removeEventListener = removeEventListener;
                        return el;
                    };
                    // Then, mop up any additional elements that weren't created via
                    // document.createElement (i.e. with innerHTML).
                    head = doc.getElementsByTagName( 'head' )[ 0 ];
                    style = doc.createElement( 'style' );
                    head.insertBefore( style, head.firstChild );
                }
            }( win, doc ) );
        }
        // The getComputedStyle polyfill interacts badly with jQuery, so we don't attach
        // it to window. Instead, we export it for other modules to use as needed
        // https://github.com/jonathantneal/Polyfills-for-IE8/blob/master/getComputedStyle.js
        if ( !win.getComputedStyle ) {
            exportedShims.getComputedStyle = function() {
                function getPixelSize( element, style, property, fontSize ) {
                    var sizeWithSuffix = style[ property ],
                        size = parseFloat( sizeWithSuffix ),
                        suffix = sizeWithSuffix.split( /\d/ )[ 0 ],
                        rootSize;
                    fontSize = fontSize != null ? fontSize : /%|em/.test( suffix ) && element.parentElement ? getPixelSize( element.parentElement, element.parentElement.currentStyle, 'fontSize', null ) : 16;
                    rootSize = property == 'fontSize' ? fontSize : /width/i.test( property ) ? element.clientWidth : element.clientHeight;
                    return suffix == 'em' ? size * fontSize : suffix == 'in' ? size * 96 : suffix == 'pt' ? size * 96 / 72 : suffix == '%' ? size / 100 * rootSize : size;
                }

                function setShortStyleProperty( style, property ) {
                    var borderSuffix = property == 'border' ? 'Width' : '',
                        t = property + 'Top' + borderSuffix,
                        r = property + 'Right' + borderSuffix,
                        b = property + 'Bottom' + borderSuffix,
                        l = property + 'Left' + borderSuffix;
                    style[ property ] = ( style[ t ] == style[ r ] == style[ b ] == style[ l ] ? [ style[ t ] ] : style[ t ] == style[ b ] && style[ l ] == style[ r ] ? [
                        style[ t ],
                        style[ r ]
                    ] : style[ l ] == style[ r ] ? [
                        style[ t ],
                        style[ r ],
                        style[ b ]
                    ] : [
                        style[ t ],
                        style[ r ],
                        style[ b ],
                        style[ l ]
                    ] ).join( ' ' );
                }

                function CSSStyleDeclaration( element ) {
                    var currentStyle, style, fontSize, property;
                    currentStyle = element.currentStyle;
                    style = this;
                    fontSize = getPixelSize( element, currentStyle, 'fontSize', null );
                    for ( property in currentStyle ) {
                        if ( /width|height|margin.|padding.|border.+W/.test( property ) && style[ property ] !== 'auto' ) {
                            style[ property ] = getPixelSize( element, currentStyle, property, fontSize ) + 'px';
                        } else if ( property === 'styleFloat' ) {
                            style.float = currentStyle[ property ];
                        } else {
                            style[ property ] = currentStyle[ property ];
                        }
                    }
                    setShortStyleProperty( style, 'margin' );
                    setShortStyleProperty( style, 'padding' );
                    setShortStyleProperty( style, 'border' );
                    style.fontSize = fontSize + 'px';
                    return style;
                }
                CSSStyleDeclaration.prototype = {
                    constructor: CSSStyleDeclaration,
                    getPropertyPriority: function() {},
                    getPropertyValue: function( prop ) {
                        return this[ prop ] || '';
                    },
                    item: function() {},
                    removeProperty: function() {},
                    setProperty: function() {},
                    getPropertyCSSValue: function() {}
                };

                function getComputedStyle( element ) {
                    return new CSSStyleDeclaration( element );
                }
                return getComputedStyle;
            }();
        }
        return exportedShims;
    }();

    var config_initOptions = function() {

        var defaults, initOptions;
        defaults = {
            el: null,
            template: '',
            complete: null,
            preserveWhitespace: false,
            append: false,
            twoway: true,
            modifyArrays: true,
            lazy: false,
            debug: false,
            noIntro: false,
            transitionsEnabled: true,
            magic: false,
            noCssTransform: false,
            adapt: [],
            sanitize: false,
            stripComments: true,
            isolated: false,
            delimiters: [
                '{{',
                '}}'
            ],
            tripleDelimiters: [
                '{{{',
                '}}}'
            ],
            computed: null
        };
        initOptions = {
            keys: Object.keys( defaults ),
            defaults: defaults
        };
        return initOptions;
    }( legacy );

    var config_svg = function() {

        if ( typeof document === 'undefined' ) {
            return;
        }
        return document && document.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1' );
    }();

    var config_namespaces = {
        html: 'http://www.w3.org/1999/xhtml',
        mathml: 'http://www.w3.org/1998/Math/MathML',
        svg: 'http://www.w3.org/2000/svg',
        xlink: 'http://www.w3.org/1999/xlink',
        xml: 'http://www.w3.org/XML/1998/namespace',
        xmlns: 'http://www.w3.org/2000/xmlns/'
    };

    var utils_createElement = function( svg, namespaces ) {

        // Test for SVG support
        if ( !svg ) {
            return function( type, ns ) {
                if ( ns && ns !== namespaces.html ) {
                    throw 'This browser does not support namespaces other than http://www.w3.org/1999/xhtml. The most likely cause of this error is that you\'re trying to render SVG in an older browser. See http://docs.ractivejs.org/latest/svg-and-older-browsers for more information';
                }
                return document.createElement( type );
            };
        } else {
            return function( type, ns ) {
                if ( !ns || ns === namespaces.html ) {
                    return document.createElement( type );
                }
                return document.createElementNS( ns, type );
            };
        }
    }( config_svg, config_namespaces );

    var config_isClient = typeof document === 'object';

    var utils_defineProperty = function( isClient ) {

        try {
            Object.defineProperty( {}, 'test', {
                value: 0
            } );
            if ( isClient ) {
                Object.defineProperty( document.createElement( 'div' ), 'test', {
                    value: 0
                } );
            }
            return Object.defineProperty;
        } catch ( err ) {
            // Object.defineProperty doesn't exist, or we're in IE8 where you can
            // only use it with DOM objects (what the fuck were you smoking, MSFT?)
            return function( obj, prop, desc ) {
                obj[ prop ] = desc.value;
            };
        }
    }( config_isClient );

    var utils_defineProperties = function( createElement, defineProperty, isClient ) {

        try {
            try {
                Object.defineProperties( {}, {
                    test: {
                        value: 0
                    }
                } );
            } catch ( err ) {
                // TODO how do we account for this? noMagic = true;
                throw err;
            }
            if ( isClient ) {
                Object.defineProperties( createElement( 'div' ), {
                    test: {
                        value: 0
                    }
                } );
            }
            return Object.defineProperties;
        } catch ( err ) {
            return function( obj, props ) {
                var prop;
                for ( prop in props ) {
                    if ( props.hasOwnProperty( prop ) ) {
                        defineProperty( obj, prop, props[ prop ] );
                    }
                }
            };
        }
    }( utils_createElement, utils_defineProperty, config_isClient );

    var utils_isNumeric = function( thing ) {
        return !isNaN( parseFloat( thing ) ) && isFinite( thing );
    };

    var Ractive_prototype_shared_add = function( isNumeric ) {

        return function( root, keypath, d ) {
            var value;
            if ( typeof keypath !== 'string' || !isNumeric( d ) ) {
                throw new Error( 'Bad arguments' );
            }
            value = +root.get( keypath ) || 0;
            if ( !isNumeric( value ) ) {
                throw new Error( 'Cannot add to a non-numeric value' );
            }
            return root.set( keypath, value + d );
        };
    }( utils_isNumeric );

    var Ractive_prototype_add = function( add ) {

        return function( keypath, d ) {
            return add( this, keypath, d === undefined ? 1 : +d );
        };
    }( Ractive_prototype_shared_add );

    var utils_isEqual = function( a, b ) {
        if ( a === null && b === null ) {
            return true;
        }
        if ( typeof a === 'object' || typeof b === 'object' ) {
            return false;
        }
        return a === b;
    };

    var utils_Promise = function() {

        var Promise, PENDING = {}, FULFILLED = {}, REJECTED = {};
        Promise = function( callback ) {
            var fulfilledHandlers = [],
                rejectedHandlers = [],
                state = PENDING,
                result, dispatchHandlers, makeResolver, fulfil, reject, promise;
            makeResolver = function( newState ) {
                return function( value ) {
                    if ( state !== PENDING ) {
                        return;
                    }
                    result = value;
                    state = newState;
                    dispatchHandlers = makeDispatcher( state === FULFILLED ? fulfilledHandlers : rejectedHandlers, result );
                    // dispatch onFulfilled and onRejected handlers asynchronously
                    wait( dispatchHandlers );
                };
            };
            fulfil = makeResolver( FULFILLED );
            reject = makeResolver( REJECTED );
            callback( fulfil, reject );
            promise = {
                // `then()` returns a Promise - 2.2.7
                then: function( onFulfilled, onRejected ) {
                    var promise2 = new Promise( function( fulfil, reject ) {
                        var processResolutionHandler = function( handler, handlers, forward ) {
                            // 2.2.1.1
                            if ( typeof handler === 'function' ) {
                                handlers.push( function( p1result ) {
                                    var x;
                                    try {
                                        x = handler( p1result );
                                        resolve( promise2, x, fulfil, reject );
                                    } catch ( err ) {
                                        reject( err );
                                    }
                                } );
                            } else {
                                // Forward the result of promise1 to promise2, if resolution handlers
                                // are not given
                                handlers.push( forward );
                            }
                        };
                        // 2.2
                        processResolutionHandler( onFulfilled, fulfilledHandlers, fulfil );
                        processResolutionHandler( onRejected, rejectedHandlers, reject );
                        if ( state !== PENDING ) {
                            // If the promise has resolved already, dispatch the appropriate handlers asynchronously
                            wait( dispatchHandlers );
                        }
                    } );
                    return promise2;
                }
            };
            promise[ 'catch' ] = function( onRejected ) {
                return this.then( null, onRejected );
            };
            return promise;
        };
        Promise.all = function( promises ) {
            return new Promise( function( fulfil, reject ) {
                var result = [],
                    pending, i, processPromise;
                if ( !promises.length ) {
                    fulfil( result );
                    return;
                }
                processPromise = function( i ) {
                    promises[ i ].then( function( value ) {
                        result[ i ] = value;
                        if ( !--pending ) {
                            fulfil( result );
                        }
                    }, reject );
                };
                pending = i = promises.length;
                while ( i-- ) {
                    processPromise( i );
                }
            } );
        };
        Promise.resolve = function( value ) {
            return new Promise( function( fulfil ) {
                fulfil( value );
            } );
        };
        Promise.reject = function( reason ) {
            return new Promise( function( fulfil, reject ) {
                reject( reason );
            } );
        };
        return Promise;
        // TODO use MutationObservers or something to simulate setImmediate
        function wait( callback ) {
            setTimeout( callback, 0 );
        }

        function makeDispatcher( handlers, result ) {
            return function() {
                var handler;
                while ( handler = handlers.shift() ) {
                    handler( result );
                }
            };
        }

        function resolve( promise, x, fulfil, reject ) {
            // Promise Resolution Procedure
            var then;
            // 2.3.1
            if ( x === promise ) {
                throw new TypeError( 'A promise\'s fulfillment handler cannot return the same promise' );
            }
            // 2.3.2
            if ( x instanceof Promise ) {
                x.then( fulfil, reject );
            } else if ( x && ( typeof x === 'object' || typeof x === 'function' ) ) {
                try {
                    then = x.then;
                } catch ( e ) {
                    reject( e );
                    // 2.3.3.2
                    return;
                }
                // 2.3.3.3
                if ( typeof then === 'function' ) {
                    var called, resolvePromise, rejectPromise;
                    resolvePromise = function( y ) {
                        if ( called ) {
                            return;
                        }
                        called = true;
                        resolve( promise, y, fulfil, reject );
                    };
                    rejectPromise = function( r ) {
                        if ( called ) {
                            return;
                        }
                        called = true;
                        reject( r );
                    };
                    try {
                        then.call( x, resolvePromise, rejectPromise );
                    } catch ( e ) {
                        if ( !called ) {
                            // 2.3.3.3.4.1
                            reject( e );
                            // 2.3.3.3.4.2
                            called = true;
                            return;
                        }
                    }
                } else {
                    fulfil( x );
                }
            } else {
                fulfil( x );
            }
        }
    }();

    var utils_normaliseKeypath = function() {

        var regex = /\[\s*(\*|[0-9]|[1-9][0-9]+)\s*\]/g;
        return function normaliseKeypath( keypath ) {
            return ( keypath || '' ).replace( regex, '.$1' );
        };
    }();

    var config_vendors = [
        'o',
        'ms',
        'moz',
        'webkit'
    ];

    var utils_requestAnimationFrame = function( vendors ) {

        // If window doesn't exist, we don't need requestAnimationFrame
        if ( typeof window === 'undefined' ) {
            return;
        }
        // https://gist.github.com/paulirish/1579671
        ( function( vendors, lastTime, window ) {
            var x, setTimeout;
            if ( window.requestAnimationFrame ) {
                return;
            }
            for ( x = 0; x < vendors.length && !window.requestAnimationFrame; ++x ) {
                window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
            }
            if ( !window.requestAnimationFrame ) {
                setTimeout = window.setTimeout;
                window.requestAnimationFrame = function( callback ) {
                    var currTime, timeToCall, id;
                    currTime = Date.now();
                    timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
                    id = setTimeout( function() {
                        callback( currTime + timeToCall );
                    }, timeToCall );
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }
        }( vendors, 0, window ) );
        return window.requestAnimationFrame;
    }( config_vendors );

    var utils_getTime = function() {

        if ( typeof window !== 'undefined' && window.performance && typeof window.performance.now === 'function' ) {
            return function() {
                return window.performance.now();
            };
        } else {
            return function() {
                return Date.now();
            };
        }
    }();

    // This module provides a place to store a) circular dependencies and
    // b) the callback functions that require those circular dependencies
    var circular = [];

    var utils_removeFromArray = function( array, member ) {
        var index = array.indexOf( member );
        if ( index !== -1 ) {
            array.splice( index, 1 );
        }
    };

    var global_css = function( circular, isClient, removeFromArray ) {

        var runloop, styleElement, head, styleSheet, inDom, prefix = '/* Ractive.js component styles */\n',
            componentsInPage = {}, styles = [];
        if ( !isClient ) {
            return;
        }
        circular.push( function() {
            runloop = circular.runloop;
        } );
        styleElement = document.createElement( 'style' );
        styleElement.type = 'text/css';
        head = document.getElementsByTagName( 'head' )[ 0 ];
        inDom = false;
        // Internet Exploder won't let you use styleSheet.innerHTML - we have to
        // use styleSheet.cssText instead
        styleSheet = styleElement.styleSheet;
        return {
            add: function( Component ) {
                if ( !Component.css ) {
                    return;
                }
                if ( !componentsInPage[ Component._guid ] ) {
                    // we create this counter so that we can in/decrement it as
                    // instances are added and removed. When all components are
                    // removed, the style is too
                    componentsInPage[ Component._guid ] = 0;
                    styles.push( Component.css );
                    runloop.scheduleCssUpdate();
                }
                componentsInPage[ Component._guid ] += 1;
            },
            remove: function( Component ) {
                if ( !Component.css ) {
                    return;
                }
                componentsInPage[ Component._guid ] -= 1;
                if ( !componentsInPage[ Component._guid ] ) {
                    removeFromArray( styles, Component.css );
                    runloop.scheduleCssUpdate();
                }
            },
            update: function() {
                var css;
                if ( styles.length ) {
                    css = prefix + styles.join( ' ' );
                    if ( styleSheet ) {
                        styleSheet.cssText = css;
                    } else {
                        styleElement.innerHTML = css;
                    }
                    if ( !inDom ) {
                        head.appendChild( styleElement );
                    }
                } else if ( inDom ) {
                    head.removeChild( styleElement );
                }
            }
        };
    }( circular, config_isClient, utils_removeFromArray );

    var shared_getValueFromCheckboxes = function( ractive, keypath ) {
        var value, checkboxes, checkbox, len, i, rootEl;
        value = [];
        // TODO in edge cases involving components with inputs bound to the same keypath, this
        // could get messy
        // if we're still in the initial render, we need to find the inputs from the as-yet off-DOM
        // document fragment. otherwise, the root element
        rootEl = ractive._rendering ? ractive.fragment.docFrag : ractive.el;
        checkboxes = rootEl.querySelectorAll( 'input[type="checkbox"][name="{{' + keypath + '}}"]' );
        len = checkboxes.length;
        for ( i = 0; i < len; i += 1 ) {
            checkbox = checkboxes[ i ];
            if ( checkbox.hasAttribute( 'checked' ) || checkbox.checked ) {
                value.push( checkbox._ractive.value );
            }
        }
        return value;
    };

    var utils_hasOwnProperty = Object.prototype.hasOwnProperty;

    var shared_getInnerContext = function( fragment ) {
        do {
            if ( fragment.context ) {
                return fragment.context;
            }
        } while ( fragment = fragment.parent );
        return '';
    };

    var shared_resolveRef = function( circular, normaliseKeypath, hasOwnProperty, getInnerContext ) {

        var get, ancestorErrorMessage = 'Could not resolve reference - too many "../" prefixes';
        circular.push( function() {
            get = circular.get;
        } );
        return function resolveRef( ractive, ref, fragment ) {
            var context, contextKeys, keys, lastKey, postfix, parentKeypath, parentValue, wrapped, hasContextChain;
            ref = normaliseKeypath( ref );
            // Implicit iterators - i.e. {{.}} - are a special case
            if ( ref === '.' ) {
                return getInnerContext( fragment );
            }
            // If a reference begins with '.', it's either a restricted reference or
            // an ancestor reference...
            if ( ref.charAt( 0 ) === '.' ) {
                // ...either way we need to get the innermost context
                context = getInnerContext( fragment );
                contextKeys = context ? context.split( '.' ) : [];
                // ancestor references (starting "../") go up the tree
                if ( ref.substr( 0, 3 ) === '../' ) {
                    while ( ref.substr( 0, 3 ) === '../' ) {
                        if ( !contextKeys.length ) {
                            throw new Error( ancestorErrorMessage );
                        }
                        contextKeys.pop();
                        ref = ref.substring( 3 );
                    }
                    contextKeys.push( ref );
                    return contextKeys.join( '.' );
                }
                // not an ancestor reference - must be a restricted reference (prepended with ".")
                if ( !context ) {
                    return ref.substring( 1 );
                }
                return context + ref;
            }
            // Now we need to try and resolve the reference against any
            // contexts set by parent list/object sections
            keys = ref.split( '.' );
            lastKey = keys.pop();
            postfix = keys.length ? '.' + keys.join( '.' ) : '';
            do {
                context = fragment.context;
                if ( !context ) {
                    continue;
                }
                hasContextChain = true;
                parentKeypath = context + postfix;
                parentValue = get( ractive, parentKeypath );
                if ( wrapped = ractive._wrapped[ parentKeypath ] ) {
                    parentValue = wrapped.get();
                }
                if ( parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' ) && lastKey in parentValue ) {
                    return context + '.' + ref;
                }
            } while ( fragment = fragment.parent );
            // Still no keypath?
            // If there's no context chain, and the instance is either a) isolated or
            // b) an orphan, then we know that the keypath is identical to the reference
            if ( !hasContextChain && ( !ractive._parent || ractive.isolated ) ) {
                return ref;
            }
            // We need both of these - the first enables components to treat data contexts
            // like lexical scopes in JavaScript functions...
            if ( hasOwnProperty.call( ractive.data, ref ) ) {
                return ref;
            } else if ( get( ractive, ref ) !== undefined ) {
                return ref;
            }
        };
    }( circular, utils_normaliseKeypath, utils_hasOwnProperty, shared_getInnerContext );

    var shared_getUpstreamChanges = function getUpstreamChanges( changes ) {
        var upstreamChanges = [ '' ],
            i, keypath, keys, upstreamKeypath;
        i = changes.length;
        while ( i-- ) {
            keypath = changes[ i ];
            keys = keypath.split( '.' );
            while ( keys.length > 1 ) {
                keys.pop();
                upstreamKeypath = keys.join( '.' );
                if ( upstreamChanges[ upstreamKeypath ] !== true ) {
                    upstreamChanges.push( upstreamKeypath );
                    upstreamChanges[ upstreamKeypath ] = true;
                }
            }
        }
        return upstreamChanges;
    };

    var shared_notifyDependants = function() {

        var lastKey, starMaps = {};
        lastKey = /[^\.]+$/;

        function notifyDependants( ractive, keypath, onlyDirect ) {
            var i;
            // Notify any pattern observers
            if ( ractive._patternObservers.length ) {
                notifyPatternObservers( ractive, keypath, keypath, onlyDirect, true );
            }
            for ( i = 0; i < ractive._deps.length; i += 1 ) {
                // can't cache ractive._deps.length, it may change
                notifyDependantsAtPriority( ractive, keypath, i, onlyDirect );
            }
        }
        notifyDependants.multiple = function notifyMultipleDependants( ractive, keypaths, onlyDirect ) {
            var i, j, len;
            len = keypaths.length;
            // Notify any pattern observers
            if ( ractive._patternObservers.length ) {
                i = len;
                while ( i-- ) {
                    notifyPatternObservers( ractive, keypaths[ i ], keypaths[ i ], onlyDirect, true );
                }
            }
            for ( i = 0; i < ractive._deps.length; i += 1 ) {
                if ( ractive._deps[ i ] ) {
                    j = len;
                    while ( j-- ) {
                        notifyDependantsAtPriority( ractive, keypaths[ j ], i, onlyDirect );
                    }
                }
            }
        };
        return notifyDependants;

        function notifyDependantsAtPriority( ractive, keypath, priority, onlyDirect ) {
            var depsByKeypath = ractive._deps[ priority ];
            if ( !depsByKeypath ) {
                return;
            }
            // update dependants of this keypath
            updateAll( depsByKeypath[ keypath ] );
            // If we're only notifying direct dependants, not dependants
            // of downstream keypaths, then YOU SHALL NOT PASS
            if ( onlyDirect ) {
                return;
            }
            // otherwise, cascade
            cascade( ractive._depsMap[ keypath ], ractive, priority );
        }

        function updateAll( deps ) {
            var i, len;
            if ( deps ) {
                len = deps.length;
                for ( i = 0; i < len; i += 1 ) {
                    deps[ i ].update();
                }
            }
        }

        function cascade( childDeps, ractive, priority, onlyDirect ) {
            var i;
            if ( childDeps ) {
                i = childDeps.length;
                while ( i-- ) {
                    notifyDependantsAtPriority( ractive, childDeps[ i ], priority, onlyDirect );
                }
            }
        }
        // TODO split into two functions? i.e. one for the top-level call, one for the cascade
        function notifyPatternObservers( ractive, registeredKeypath, actualKeypath, isParentOfChangedKeypath, isTopLevelCall ) {
            var i, patternObserver, children, child, key, childActualKeypath, potentialWildcardMatches, cascade;
            // First, observers that match patterns at the same level
            // or higher in the tree
            i = ractive._patternObservers.length;
            while ( i-- ) {
                patternObserver = ractive._patternObservers[ i ];
                if ( patternObserver.regex.test( actualKeypath ) ) {
                    patternObserver.update( actualKeypath );
                }
            }
            if ( isParentOfChangedKeypath ) {
                return;
            }
            // If the changed keypath is 'foo.bar', we need to see if there are
            // any pattern observer dependants of keypaths below any of
            // 'foo.bar', 'foo.*', '*.bar' or '*.*' (e.g. 'foo.bar.*' or 'foo.*.baz' )
            cascade = function( keypath ) {
                if ( children = ractive._depsMap[ keypath ] ) {
                    i = children.length;
                    while ( i-- ) {
                        child = children[ i ];
                        // foo.*.baz
                        key = lastKey.exec( child )[ 0 ];
                        // 'baz'
                        childActualKeypath = actualKeypath ? actualKeypath + '.' + key : key;
                        // 'foo.bar.baz'
                        notifyPatternObservers( ractive, child, childActualKeypath );
                    }
                }
            };
            if ( isTopLevelCall ) {
                potentialWildcardMatches = getPotentialWildcardMatches( actualKeypath );
                potentialWildcardMatches.forEach( cascade );
            } else {
                cascade( registeredKeypath );
            }
        }
        // This function takes a keypath such as 'foo.bar.baz', and returns
        // all the variants of that keypath that include a wildcard in place
        // of a key, such as 'foo.bar.*', 'foo.*.baz', 'foo.*.*' and so on.
        // These are then checked against the dependants map (ractive._depsMap)
        // to see if any pattern observers are downstream of one or more of
        // these wildcard keypaths (e.g. 'foo.bar.*.status')
        function getPotentialWildcardMatches( keypath ) {
            var keys, starMap, mapper, i, result, wildcardKeypath;
            keys = keypath.split( '.' );
            starMap = getStarMap( keys.length );
            result = [];
            mapper = function( star, i ) {
                return star ? '*' : keys[ i ];
            };
            i = starMap.length;
            while ( i-- ) {
                wildcardKeypath = starMap[ i ].map( mapper ).join( '.' );
                if ( !result[ wildcardKeypath ] ) {
                    result.push( wildcardKeypath );
                    result[ wildcardKeypath ] = true;
                }
            }
            return result;
        }
        // This function returns all the possible true/false combinations for
        // a given number - e.g. for two, the possible combinations are
        // [ true, true ], [ true, false ], [ false, true ], [ false, false ].
        // It does so by getting all the binary values between 0 and e.g. 11
        function getStarMap( num ) {
            var ones = '',
                max, binary, starMap, mapper, i;
            if ( !starMaps[ num ] ) {
                starMap = [];
                while ( ones.length < num ) {
                    ones += 1;
                }
                max = parseInt( ones, 2 );
                mapper = function( digit ) {
                    return digit === '1';
                };
                for ( i = 0; i <= max; i += 1 ) {
                    binary = i.toString( 2 );
                    while ( binary.length < num ) {
                        binary = '0' + binary;
                    }
                    starMap[ i ] = Array.prototype.map.call( binary, mapper );
                }
                starMaps[ num ] = starMap;
            }
            return starMaps[ num ];
        }
    }();

    var shared_makeTransitionManager = function( removeFromArray ) {

        var makeTransitionManager, checkComplete, remove, init;
        makeTransitionManager = function( callback, previous ) {
            var transitionManager = [];
            transitionManager.detachQueue = [];
            transitionManager.remove = remove;
            transitionManager.init = init;
            transitionManager._check = checkComplete;
            transitionManager._callback = callback;
            transitionManager._previous = previous;
            if ( previous ) {
                previous.push( transitionManager );
            }
            return transitionManager;
        };
        checkComplete = function() {
            var element;
            if ( this._ready && !this.length ) {
                while ( element = this.detachQueue.pop() ) {
                    element.detach();
                }
                if ( typeof this._callback === 'function' ) {
                    this._callback();
                }
                if ( this._previous ) {
                    this._previous.remove( this );
                }
            }
        };
        remove = function( transition ) {
            removeFromArray( this, transition );
            this._check();
        };
        init = function() {
            this._ready = true;
            this._check();
        };
        return makeTransitionManager;
    }( utils_removeFromArray );

    var global_runloop = function( circular, css, removeFromArray, getValueFromCheckboxes, resolveRef, getUpstreamChanges, notifyDependants, makeTransitionManager ) {

        circular.push( function() {
            get = circular.get;
            set = circular.set;
        } );
        var runloop, get, set, dirty = false,
            flushing = false,
            pendingCssChanges, inFlight = 0,
            toFocus = null,
            liveQueries = [],
            decorators = [],
            transitions = [],
            observers = [],
            attributes = [],
            activeBindings = [],
            evaluators = [],
            computations = [],
            selectValues = [],
            checkboxKeypaths = {}, checkboxes = [],
            radios = [],
            unresolved = [],
            instances = [],
            transitionManager;
        runloop = {
            start: function( instance, callback ) {
                this.addInstance( instance );
                if ( !flushing ) {
                    inFlight += 1;
                    // create a new transition manager
                    transitionManager = makeTransitionManager( callback, transitionManager );
                }
            },
            end: function() {
                if ( flushing ) {
                    attemptKeypathResolution();
                    return;
                }
                if ( !--inFlight ) {
                    flushing = true;
                    flushChanges();
                    flushing = false;
                    land();
                }
                transitionManager.init();
                transitionManager = transitionManager._previous;
            },
            trigger: function() {
                if ( inFlight || flushing ) {
                    attemptKeypathResolution();
                    return;
                }
                flushing = true;
                flushChanges();
                flushing = false;
                land();
            },
            focus: function( node ) {
                toFocus = node;
            },
            addInstance: function( instance ) {
                if ( instance && !instances[ instance._guid ] ) {
                    instances.push( instance );
                    instances[ instances._guid ] = true;
                }
            },
            addLiveQuery: function( query ) {
                liveQueries.push( query );
            },
            addDecorator: function( decorator ) {
                decorators.push( decorator );
            },
            addTransition: function( transition ) {
                transition._manager = transitionManager;
                transitionManager.push( transition );
                transitions.push( transition );
            },
            addObserver: function( observer ) {
                observers.push( observer );
            },
            addAttribute: function( attribute ) {
                attributes.push( attribute );
            },
            addBinding: function( binding ) {
                binding.active = true;
                activeBindings.push( binding );
            },
            scheduleCssUpdate: function() {
                // if runloop isn't currently active, we need to trigger change immediately
                if ( !inFlight && !flushing ) {
                    // TODO does this ever happen?
                    css.update();
                } else {
                    pendingCssChanges = true;
                }
            },
            // changes that may cause additional changes...
            addEvaluator: function( evaluator ) {
                dirty = true;
                evaluators.push( evaluator );
            },
            addComputation: function( thing ) {
                dirty = true;
                computations.push( thing );
            },
            addSelectValue: function( selectValue ) {
                dirty = true;
                selectValues.push( selectValue );
            },
            addCheckbox: function( checkbox ) {
                if ( !checkboxKeypaths[ checkbox.keypath ] ) {
                    dirty = true;
                    checkboxes.push( checkbox );
                }
            },
            addRadio: function( radio ) {
                dirty = true;
                radios.push( radio );
            },
            addUnresolved: function( thing ) {
                dirty = true;
                unresolved.push( thing );
            },
            removeUnresolved: function( thing ) {
                removeFromArray( unresolved, thing );
            },
            // synchronise node detachments with transition ends
            detachWhenReady: function( thing ) {
                transitionManager.detachQueue.push( thing );
            }
        };
        circular.runloop = runloop;
        return runloop;

        function land() {
            var thing, changedKeypath, changeHash;
            if ( toFocus ) {
                toFocus.focus();
                toFocus = null;
            }
            while ( thing = attributes.pop() ) {
                thing.update().deferred = false;
            }
            while ( thing = liveQueries.pop() ) {
                thing._sort();
            }
            while ( thing = decorators.pop() ) {
                thing.init();
            }
            while ( thing = transitions.pop() ) {
                thing.init();
            }
            while ( thing = observers.pop() ) {
                thing.update();
            }
            while ( thing = activeBindings.pop() ) {
                thing.active = false;
            }
            // Change events are fired last
            while ( thing = instances.pop() ) {
                instances[ thing._guid ] = false;
                if ( thing._changes.length ) {
                    changeHash = {};
                    while ( changedKeypath = thing._changes.pop() ) {
                        changeHash[ changedKeypath ] = get( thing, changedKeypath );
                    }
                    thing.fire( 'change', changeHash );
                }
            }
            if ( pendingCssChanges ) {
                css.update();
                pendingCssChanges = false;
            }
        }

        function flushChanges() {
            var thing, upstreamChanges, i;
            i = instances.length;
            while ( i-- ) {
                thing = instances[ i ];
                if ( thing._changes.length ) {
                    upstreamChanges = getUpstreamChanges( thing._changes );
                    notifyDependants.multiple( thing, upstreamChanges, true );
                }
            }
            attemptKeypathResolution();
            while ( dirty ) {
                dirty = false;
                while ( thing = computations.pop() ) {
                    thing.update();
                }
                while ( thing = evaluators.pop() ) {
                    thing.update().deferred = false;
                }
                while ( thing = selectValues.pop() ) {
                    thing.deferredUpdate();
                }
                while ( thing = checkboxes.pop() ) {
                    set( thing.root, thing.keypath, getValueFromCheckboxes( thing.root, thing.keypath ) );
                }
                while ( thing = radios.pop() ) {
                    thing.update();
                }
            }
        }

        function attemptKeypathResolution() {
            var array, thing, keypath;
            if ( !unresolved.length ) {
                return;
            }
            // see if we can resolve any unresolved references
            array = unresolved.splice( 0, unresolved.length );
            while ( thing = array.pop() ) {
                if ( thing.keypath ) {
                    continue;
                }
                keypath = resolveRef( thing.root, thing.ref, thing.parentFragment );
                if ( keypath !== undefined ) {
                    // If we've resolved the keypath, we can initialise this item
                    thing.resolve( keypath );
                } else {
                    // If we can't resolve the reference, try again next time
                    unresolved.push( thing );
                }
            }
        }
    }( circular, global_css, utils_removeFromArray, shared_getValueFromCheckboxes, shared_resolveRef, shared_getUpstreamChanges, shared_notifyDependants, shared_makeTransitionManager );

    var shared_animations = function( rAF, getTime, runloop ) {

        var queue = [];
        var animations = {
            tick: function() {
                var i, animation, now;
                now = getTime();
                runloop.start();
                for ( i = 0; i < queue.length; i += 1 ) {
                    animation = queue[ i ];
                    if ( !animation.tick( now ) ) {
                        // animation is complete, remove it from the stack, and decrement i so we don't miss one
                        queue.splice( i--, 1 );
                    }
                }
                runloop.end();
                if ( queue.length ) {
                    rAF( animations.tick );
                } else {
                    animations.running = false;
                }
            },
            add: function( animation ) {
                queue.push( animation );
                if ( !animations.running ) {
                    animations.running = true;
                    rAF( animations.tick );
                }
            },
            // TODO optimise this
            abort: function( keypath, root ) {
                var i = queue.length,
                    animation;
                while ( i-- ) {
                    animation = queue[ i ];
                    if ( animation.root === root && animation.keypath === keypath ) {
                        animation.stop();
                    }
                }
            }
        };
        return animations;
    }( utils_requestAnimationFrame, utils_getTime, global_runloop );

    var utils_isArray = function() {

        var toString = Object.prototype.toString;
        // thanks, http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
        return function( thing ) {
            return toString.call( thing ) === '[object Array]';
        };
    }();

    var utils_clone = function( isArray ) {

        return function( source ) {
            var target, key;
            if ( !source || typeof source !== 'object' ) {
                return source;
            }
            if ( isArray( source ) ) {
                return source.slice();
            }
            target = {};
            for ( key in source ) {
                if ( source.hasOwnProperty( key ) ) {
                    target[ key ] = source[ key ];
                }
            }
            return target;
        };
    }( utils_isArray );

    var registries_adaptors = {};

    var shared_get_arrayAdaptor_getSpliceEquivalent = function( array, methodName, args ) {
        switch ( methodName ) {
            case 'splice':
                return args;
            case 'sort':
            case 'reverse':
                return null;
            case 'pop':
                if ( array.length ) {
                    return [ -1 ];
                }
                return null;
            case 'push':
                return [
                    array.length,
                    0
                ].concat( args );
            case 'shift':
                return [
                    0,
                    1
                ];
            case 'unshift':
                return [
                    0,
                    0
                ].concat( args );
        }
    };

    var shared_get_arrayAdaptor_summariseSpliceOperation = function( array, args ) {
        var start, addedItems, removedItems, balance;
        if ( !args ) {
            return null;
        }
        // figure out where the changes started...
        start = +( args[ 0 ] < 0 ? array.length + args[ 0 ] : args[ 0 ] );
        // ...and how many items were added to or removed from the array
        addedItems = Math.max( 0, args.length - 2 );
        removedItems = args[ 1 ] !== undefined ? args[ 1 ] : array.length - start;
        // It's possible to do e.g. [ 1, 2, 3 ].splice( 2, 2 ) - i.e. the second argument
        // means removing more items from the end of the array than there are. In these
        // cases we need to curb JavaScript's enthusiasm or we'll get out of sync
        removedItems = Math.min( removedItems, array.length - start );
        balance = addedItems - removedItems;
        return {
            start: start,
            balance: balance,
            added: addedItems,
            removed: removedItems
        };
    };

    var config_types = {
        TEXT: 1,
        INTERPOLATOR: 2,
        TRIPLE: 3,
        SECTION: 4,
        INVERTED: 5,
        CLOSING: 6,
        ELEMENT: 7,
        PARTIAL: 8,
        COMMENT: 9,
        DELIMCHANGE: 10,
        MUSTACHE: 11,
        TAG: 12,
        ATTRIBUTE: 13,
        COMPONENT: 15,
        NUMBER_LITERAL: 20,
        STRING_LITERAL: 21,
        ARRAY_LITERAL: 22,
        OBJECT_LITERAL: 23,
        BOOLEAN_LITERAL: 24,
        GLOBAL: 26,
        KEY_VALUE_PAIR: 27,
        REFERENCE: 30,
        REFINEMENT: 31,
        MEMBER: 32,
        PREFIX_OPERATOR: 33,
        BRACKETED: 34,
        CONDITIONAL: 35,
        INFIX_OPERATOR: 36,
        INVOCATION: 40
    };

    var shared_clearCache = function clearCache( ractive, keypath, dontTeardownWrapper ) {
        var cacheMap, wrappedProperty;
        if ( !dontTeardownWrapper ) {
            // Is there a wrapped property at this keypath?
            if ( wrappedProperty = ractive._wrapped[ keypath ] ) {
                // Did we unwrap it?
                if ( wrappedProperty.teardown() !== false ) {
                    ractive._wrapped[ keypath ] = null;
                }
            }
        }
        ractive._cache[ keypath ] = undefined;
        if ( cacheMap = ractive._cacheMap[ keypath ] ) {
            while ( cacheMap.length ) {
                clearCache( ractive, cacheMap.pop() );
            }
        }
    };

    var utils_createBranch = function() {

        var numeric = /^\s*[0-9]+\s*$/;
        return function( key ) {
            return numeric.test( key ) ? [] : {};
        };
    }();

    var shared_set = function( circular, isEqual, createBranch, clearCache, notifyDependants ) {

        var get;
        circular.push( function() {
            get = circular.get;
        } );

        function set( ractive, keypath, value, silent ) {
            var keys, lastKey, parentKeypath, parentValue, computation, wrapper, evaluator, dontTeardownWrapper;
            if ( isEqual( ractive._cache[ keypath ], value ) ) {
                return;
            }
            computation = ractive._computations[ keypath ];
            wrapper = ractive._wrapped[ keypath ];
            evaluator = ractive._evaluators[ keypath ];
            if ( computation && !computation.setting ) {
                computation.set( value );
            }
            // If we have a wrapper with a `reset()` method, we try and use it. If the
            // `reset()` method returns false, the wrapper should be torn down, and
            // (most likely) a new one should be created later
            if ( wrapper && wrapper.reset ) {
                dontTeardownWrapper = wrapper.reset( value ) !== false;
                if ( dontTeardownWrapper ) {
                    value = wrapper.get();
                }
            }
            // Update evaluator value. This may be from the evaluator itself, or
            // it may be from the wrapper that wraps an evaluator's result - it
            // doesn't matter
            if ( evaluator ) {
                evaluator.value = value;
            }
            if ( !computation && !evaluator && !dontTeardownWrapper ) {
                keys = keypath.split( '.' );
                lastKey = keys.pop();
                parentKeypath = keys.join( '.' );
                wrapper = ractive._wrapped[ parentKeypath ];
                if ( wrapper && wrapper.set ) {
                    wrapper.set( lastKey, value );
                } else {
                    parentValue = wrapper ? wrapper.get() : get( ractive, parentKeypath );
                    if ( !parentValue ) {
                        parentValue = createBranch( lastKey );
                        set( ractive, parentKeypath, parentValue, true );
                    }
                    parentValue[ lastKey ] = value;
                }
            }
            clearCache( ractive, keypath, dontTeardownWrapper );
            if ( !silent ) {
                ractive._changes.push( keypath );
                notifyDependants( ractive, keypath );
            }
        }
        circular.set = set;
        return set;
    }( circular, utils_isEqual, utils_createBranch, shared_clearCache, shared_notifyDependants );

    var shared_get_arrayAdaptor_processWrapper = function( types, clearCache, notifyDependants, set ) {

        return function( wrapper, array, methodName, spliceSummary ) {
            var root, keypath, clearEnd, updateDependant, i, changed, start, end, childKeypath, lengthUnchanged;
            root = wrapper.root;
            keypath = wrapper.keypath;
            root._changes.push( keypath );
            // If this is a sort or reverse, we just do root.set()...
            // TODO use merge logic?
            if ( methodName === 'sort' || methodName === 'reverse' ) {
                set( root, keypath, array );
                return;
            }
            if ( !spliceSummary ) {
                // (presumably we tried to pop from an array of zero length.
                // in which case there's nothing to do)
                return;
            }
            // ...otherwise we do a smart update whereby elements are added/removed
            // in the right place. But we do need to clear the cache downstream
            clearEnd = !spliceSummary.balance ? spliceSummary.added : array.length - Math.min( spliceSummary.balance, 0 );
            for ( i = spliceSummary.start; i < clearEnd; i += 1 ) {
                clearCache( root, keypath + '.' + i );
            }
            // Propagate changes
            updateDependant = function( dependant ) {
                // is this a DOM section?
                if ( dependant.keypath === keypath && dependant.type === types.SECTION && !dependant.inverted && dependant.docFrag ) {
                    dependant.splice( spliceSummary );
                } else {
                    dependant.update();
                }
            };
            // Go through all dependant priority levels, finding smart update targets
            root._deps.forEach( function( depsByKeypath ) {
                var dependants = depsByKeypath[ keypath ];
                if ( dependants ) {
                    dependants.forEach( updateDependant );
                }
            } );
            // if we're removing old items and adding new ones, simultaneously, we need to force an update
            if ( spliceSummary.added && spliceSummary.removed ) {
                changed = Math.max( spliceSummary.added, spliceSummary.removed );
                start = spliceSummary.start;
                end = start + changed;
                lengthUnchanged = spliceSummary.added === spliceSummary.removed;
                for ( i = start; i < end; i += 1 ) {
                    childKeypath = keypath + '.' + i;
                    notifyDependants( root, childKeypath );
                }
            }
            // length property has changed - notify dependants
            // TODO in some cases (e.g. todo list example, when marking all as complete, then
            // adding a new item (which should deactivate the 'all complete' checkbox
            // but doesn't) this needs to happen before other updates. But doing so causes
            // other mental problems. not sure what's going on...
            if ( !lengthUnchanged ) {
                clearCache( root, keypath + '.length' );
                notifyDependants( root, keypath + '.length', true );
            }
        };
    }( config_types, shared_clearCache, shared_notifyDependants, shared_set );

    var shared_get_arrayAdaptor_patch = function( runloop, defineProperty, getSpliceEquivalent, summariseSpliceOperation, processWrapper ) {

        var patchedArrayProto = [],
            mutatorMethods = [
                'pop',
                'push',
                'reverse',
                'shift',
                'sort',
                'splice',
                'unshift'
            ],
            testObj, patchArrayMethods, unpatchArrayMethods;
        mutatorMethods.forEach( function( methodName ) {
            var method = function() {
                var spliceEquivalent, spliceSummary, result, wrapper, i;
                // push, pop, shift and unshift can all be represented as a splice operation.
                // this makes life easier later
                spliceEquivalent = getSpliceEquivalent( this, methodName, Array.prototype.slice.call( arguments ) );
                spliceSummary = summariseSpliceOperation( this, spliceEquivalent );
                // apply the underlying method
                result = Array.prototype[ methodName ].apply( this, arguments );
                // trigger changes
                this._ractive.setting = true;
                i = this._ractive.wrappers.length;
                while ( i-- ) {
                    wrapper = this._ractive.wrappers[ i ];
                    runloop.start( wrapper.root );
                    processWrapper( wrapper, this, methodName, spliceSummary );
                    runloop.end();
                }
                this._ractive.setting = false;
                return result;
            };
            defineProperty( patchedArrayProto, methodName, {
                value: method
            } );
        } );
        // can we use prototype chain injection?
        // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection
        testObj = {};
        if ( testObj.__proto__ ) {
            // yes, we can
            patchArrayMethods = function( array ) {
                array.__proto__ = patchedArrayProto;
            };
            unpatchArrayMethods = function( array ) {
                array.__proto__ = Array.prototype;
            };
        } else {
            // no, we can't
            patchArrayMethods = function( array ) {
                var i, methodName;
                i = mutatorMethods.length;
                while ( i-- ) {
                    methodName = mutatorMethods[ i ];
                    defineProperty( array, methodName, {
                        value: patchedArrayProto[ methodName ],
                        configurable: true
                    } );
                }
            };
            unpatchArrayMethods = function( array ) {
                var i;
                i = mutatorMethods.length;
                while ( i-- ) {
                    delete array[ mutatorMethods[ i ] ];
                }
            };
        }
        patchArrayMethods.unpatch = unpatchArrayMethods;
        return patchArrayMethods;
    }( global_runloop, utils_defineProperty, shared_get_arrayAdaptor_getSpliceEquivalent, shared_get_arrayAdaptor_summariseSpliceOperation, shared_get_arrayAdaptor_processWrapper );

    var shared_get_arrayAdaptor__arrayAdaptor = function( defineProperty, isArray, patch ) {

        var arrayAdaptor,
            // helpers
            ArrayWrapper, errorMessage;
        arrayAdaptor = {
            filter: function( object ) {
                // wrap the array if a) b) it's an array, and b) either it hasn't been wrapped already,
                // or the array didn't trigger the get() itself
                return isArray( object ) && ( !object._ractive || !object._ractive.setting );
            },
            wrap: function( ractive, array, keypath ) {
                return new ArrayWrapper( ractive, array, keypath );
            }
        };
        ArrayWrapper = function( ractive, array, keypath ) {
            this.root = ractive;
            this.value = array;
            this.keypath = keypath;
            // if this array hasn't already been ractified, ractify it
            if ( !array._ractive ) {
                // define a non-enumerable _ractive property to store the wrappers
                defineProperty( array, '_ractive', {
                    value: {
                        wrappers: [],
                        instances: [],
                        setting: false
                    },
                    configurable: true
                } );
                patch( array );
            }
            // store the ractive instance, so we can handle transitions later
            if ( !array._ractive.instances[ ractive._guid ] ) {
                array._ractive.instances[ ractive._guid ] = 0;
                array._ractive.instances.push( ractive );
            }
            array._ractive.instances[ ractive._guid ] += 1;
            array._ractive.wrappers.push( this );
        };
        ArrayWrapper.prototype = {
            get: function() {
                return this.value;
            },
            teardown: function() {
                var array, storage, wrappers, instances, index;
                array = this.value;
                storage = array._ractive;
                wrappers = storage.wrappers;
                instances = storage.instances;
                // if teardown() was invoked because we're clearing the cache as a result of
                // a change that the array itself triggered, we can save ourselves the teardown
                // and immediate setup
                if ( storage.setting ) {
                    return false;
                }
                index = wrappers.indexOf( this );
                if ( index === -1 ) {
                    throw new Error( errorMessage );
                }
                wrappers.splice( index, 1 );
                // if nothing else depends on this array, we can revert it to its
                // natural state
                if ( !wrappers.length ) {
                    delete array._ractive;
                    patch.unpatch( this.value );
                } else {
                    // remove ractive instance if possible
                    instances[ this.root._guid ] -= 1;
                    if ( !instances[ this.root._guid ] ) {
                        index = instances.indexOf( this.root );
                        if ( index === -1 ) {
                            throw new Error( errorMessage );
                        }
                        instances.splice( index, 1 );
                    }
                }
            }
        };
        errorMessage = 'Something went wrong in a rather interesting way';
        return arrayAdaptor;
    }( utils_defineProperty, utils_isArray, shared_get_arrayAdaptor_patch );

    var shared_get_magicAdaptor = function( runloop, createBranch, isArray, clearCache, notifyDependants ) {

        var magicAdaptor, MagicWrapper;
        try {
            Object.defineProperty( {}, 'test', {
                value: 0
            } );
        } catch ( err ) {
            return false;
        }
        magicAdaptor = {
            filter: function( object, keypath, ractive ) {
                var keys, key, parentKeypath, parentWrapper, parentValue;
                if ( !keypath ) {
                    return false;
                }
                keys = keypath.split( '.' );
                key = keys.pop();
                parentKeypath = keys.join( '.' );
                // If the parent value is a wrapper, other than a magic wrapper,
                // we shouldn't wrap this property
                if ( ( parentWrapper = ractive._wrapped[ parentKeypath ] ) && !parentWrapper.magic ) {
                    return false;
                }
                parentValue = ractive.get( parentKeypath );
                // if parentValue is an array that doesn't include this member,
                // we should return false otherwise lengths will get messed up
                if ( isArray( parentValue ) && /^[0-9]+$/.test( key ) ) {
                    return false;
                }
                return parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' );
            },
            wrap: function( ractive, property, keypath ) {
                return new MagicWrapper( ractive, property, keypath );
            }
        };
        MagicWrapper = function( ractive, value, keypath ) {
            var keys, objKeypath, descriptor, siblings;
            this.magic = true;
            this.ractive = ractive;
            this.keypath = keypath;
            this.value = value;
            keys = keypath.split( '.' );
            this.prop = keys.pop();
            objKeypath = keys.join( '.' );
            this.obj = objKeypath ? ractive.get( objKeypath ) : ractive.data;
            descriptor = this.originalDescriptor = Object.getOwnPropertyDescriptor( this.obj, this.prop );
            // Has this property already been wrapped?
            if ( descriptor && descriptor.set && ( siblings = descriptor.set._ractiveWrappers ) ) {
                // Yes. Register this wrapper to this property, if it hasn't been already
                if ( siblings.indexOf( this ) === -1 ) {
                    siblings.push( this );
                }
                return;
            }
            // No, it hasn't been wrapped
            createAccessors( this, value, descriptor );
        };
        MagicWrapper.prototype = {
            get: function() {
                return this.value;
            },
            reset: function( value ) {
                if ( this.updating ) {
                    return;
                }
                this.updating = true;
                this.obj[ this.prop ] = value;
                // trigger set() accessor
                clearCache( this.ractive, this.keypath );
                this.updating = false;
            },
            set: function( key, value ) {
                if ( this.updating ) {
                    return;
                }
                if ( !this.obj[ this.prop ] ) {
                    this.updating = true;
                    this.obj[ this.prop ] = createBranch( key );
                    this.updating = false;
                }
                this.obj[ this.prop ][ key ] = value;
            },
            teardown: function() {
                var descriptor, set, value, wrappers, index;
                // If this method was called because the cache was being cleared as a
                // result of a set()/update() call made by this wrapper, we return false
                // so that it doesn't get torn down
                if ( this.updating ) {
                    return false;
                }
                descriptor = Object.getOwnPropertyDescriptor( this.obj, this.prop );
                set = descriptor && descriptor.set;
                if ( !set ) {
                    // most likely, this was an array member that was spliced out
                    return;
                }
                wrappers = set._ractiveWrappers;
                index = wrappers.indexOf( this );
                if ( index !== -1 ) {
                    wrappers.splice( index, 1 );
                }
                // Last one out, turn off the lights
                if ( !wrappers.length ) {
                    value = this.obj[ this.prop ];
                    Object.defineProperty( this.obj, this.prop, this.originalDescriptor || {
                        writable: true,
                        enumerable: true,
                        configurable: true
                    } );
                    this.obj[ this.prop ] = value;
                }
            }
        };

        function createAccessors( originalWrapper, value, descriptor ) {
            var object, property, oldGet, oldSet, get, set;
            object = originalWrapper.obj;
            property = originalWrapper.prop;
            // Is this descriptor configurable?
            if ( descriptor && !descriptor.configurable ) {
                // Special case - array length
                if ( property === 'length' ) {
                    return;
                }
                throw new Error( 'Cannot use magic mode with property "' + property + '" - object is not configurable' );
            }
            // Time to wrap this property
            if ( descriptor ) {
                oldGet = descriptor.get;
                oldSet = descriptor.set;
            }
            get = oldGet || function() {
                return value;
            };
            set = function( v ) {
                if ( oldSet ) {
                    oldSet( v );
                }
                value = oldGet ? oldGet() : v;
                set._ractiveWrappers.forEach( updateWrapper );
            };

            function updateWrapper( wrapper ) {
                var keypath, ractive;
                wrapper.value = value;
                if ( wrapper.updating ) {
                    return;
                }
                ractive = wrapper.ractive;
                keypath = wrapper.keypath;
                wrapper.updating = true;
                runloop.start( ractive );
                ractive._changes.push( keypath );
                clearCache( ractive, keypath );
                notifyDependants( ractive, keypath );
                runloop.end();
                wrapper.updating = false;
            }
            // Create an array of wrappers, in case other keypaths/ractives depend on this property.
            // Handily, we can store them as a property of the set function. Yay JavaScript.
            set._ractiveWrappers = [ originalWrapper ];
            Object.defineProperty( object, property, {
                get: get,
                set: set,
                enumerable: true,
                configurable: true
            } );
        }
        return magicAdaptor;
    }( global_runloop, utils_createBranch, utils_isArray, shared_clearCache, shared_notifyDependants );

    var shared_get_magicArrayAdaptor = function( magicAdaptor, arrayAdaptor ) {

        if ( !magicAdaptor ) {
            return false;
        }
        var magicArrayAdaptor, MagicArrayWrapper;
        magicArrayAdaptor = {
            filter: function( object, keypath, ractive ) {
                return magicAdaptor.filter( object, keypath, ractive ) && arrayAdaptor.filter( object );
            },
            wrap: function( ractive, array, keypath ) {
                return new MagicArrayWrapper( ractive, array, keypath );
            }
        };
        MagicArrayWrapper = function( ractive, array, keypath ) {
            this.value = array;
            this.magic = true;
            this.magicWrapper = magicAdaptor.wrap( ractive, array, keypath );
            this.arrayWrapper = arrayAdaptor.wrap( ractive, array, keypath );
        };
        MagicArrayWrapper.prototype = {
            get: function() {
                return this.value;
            },
            teardown: function() {
                this.arrayWrapper.teardown();
                this.magicWrapper.teardown();
            },
            reset: function( value ) {
                return this.magicWrapper.reset( value );
            }
        };
        return magicArrayAdaptor;
    }( shared_get_magicAdaptor, shared_get_arrayAdaptor__arrayAdaptor );

    var shared_adaptIfNecessary = function( adaptorRegistry, arrayAdaptor, magicAdaptor, magicArrayAdaptor ) {

        var prefixers = {};
        return function adaptIfNecessary( ractive, keypath, value, isExpressionResult ) {
            var len, i, adaptor, wrapped;
            // Do we have an adaptor for this value?
            len = ractive.adapt.length;
            for ( i = 0; i < len; i += 1 ) {
                adaptor = ractive.adapt[ i ];
                // Adaptors can be specified as e.g. [ 'Backbone.Model', 'Backbone.Collection' ] -
                // we need to get the actual adaptor if that's the case
                if ( typeof adaptor === 'string' ) {
                    if ( !adaptorRegistry[ adaptor ] ) {
                        throw new Error( 'Missing adaptor "' + adaptor + '"' );
                    }
                    adaptor = ractive.adapt[ i ] = adaptorRegistry[ adaptor ];
                }
                if ( adaptor.filter( value, keypath, ractive ) ) {
                    wrapped = ractive._wrapped[ keypath ] = adaptor.wrap( ractive, value, keypath, getPrefixer( keypath ) );
                    wrapped.value = value;
                    return value;
                }
            }
            if ( !isExpressionResult ) {
                if ( ractive.magic ) {
                    if ( magicArrayAdaptor.filter( value, keypath, ractive ) ) {
                        ractive._wrapped[ keypath ] = magicArrayAdaptor.wrap( ractive, value, keypath );
                    } else if ( magicAdaptor.filter( value, keypath, ractive ) ) {
                        ractive._wrapped[ keypath ] = magicAdaptor.wrap( ractive, value, keypath );
                    }
                } else if ( ractive.modifyArrays && arrayAdaptor.filter( value, keypath, ractive ) ) {
                    ractive._wrapped[ keypath ] = arrayAdaptor.wrap( ractive, value, keypath );
                }
            }
            return value;
        };

        function prefixKeypath( obj, prefix ) {
            var prefixed = {}, key;
            if ( !prefix ) {
                return obj;
            }
            prefix += '.';
            for ( key in obj ) {
                if ( obj.hasOwnProperty( key ) ) {
                    prefixed[ prefix + key ] = obj[ key ];
                }
            }
            return prefixed;
        }

        function getPrefixer( rootKeypath ) {
            var rootDot;
            if ( !prefixers[ rootKeypath ] ) {
                rootDot = rootKeypath ? rootKeypath + '.' : '';
                prefixers[ rootKeypath ] = function( relativeKeypath, value ) {
                    var obj;
                    if ( typeof relativeKeypath === 'string' ) {
                        obj = {};
                        obj[ rootDot + relativeKeypath ] = value;
                        return obj;
                    }
                    if ( typeof relativeKeypath === 'object' ) {
                        // 'relativeKeypath' is in fact a hash, not a keypath
                        return rootDot ? prefixKeypath( relativeKeypath, rootKeypath ) : relativeKeypath;
                    }
                };
            }
            return prefixers[ rootKeypath ];
        }
    }( registries_adaptors, shared_get_arrayAdaptor__arrayAdaptor, shared_get_magicAdaptor, shared_get_magicArrayAdaptor );

    var shared_registerDependant = function() {

        return function registerDependant( dependant ) {
            var depsByKeypath, deps, ractive, keypath, priority;
            ractive = dependant.root;
            keypath = dependant.keypath;
            priority = dependant.priority;
            depsByKeypath = ractive._deps[ priority ] || ( ractive._deps[ priority ] = {} );
            deps = depsByKeypath[ keypath ] || ( depsByKeypath[ keypath ] = [] );
            deps.push( dependant );
            dependant.registered = true;
            if ( !keypath ) {
                return;
            }
            updateDependantsMap( ractive, keypath );
        };

        function updateDependantsMap( ractive, keypath ) {
            var keys, parentKeypath, map;
            // update dependants map
            keys = keypath.split( '.' );
            while ( keys.length ) {
                keys.pop();
                parentKeypath = keys.join( '.' );
                map = ractive._depsMap[ parentKeypath ] || ( ractive._depsMap[ parentKeypath ] = [] );
                if ( map[ keypath ] === undefined ) {
                    map[ keypath ] = 0;
                    map[ map.length ] = keypath;
                }
                map[ keypath ] += 1;
                keypath = parentKeypath;
            }
        }
    }();

    var shared_unregisterDependant = function() {

        return function unregisterDependant( dependant ) {
            var deps, index, ractive, keypath, priority;
            ractive = dependant.root;
            keypath = dependant.keypath;
            priority = dependant.priority;
            deps = ractive._deps[ priority ][ keypath ];
            index = deps.indexOf( dependant );
            if ( index === -1 || !dependant.registered ) {
                throw new Error( 'Attempted to remove a dependant that was no longer registered! This should not happen. If you are seeing this bug in development please raise an issue at https://github.com/RactiveJS/Ractive/issues - thanks' );
            }
            deps.splice( index, 1 );
            dependant.registered = false;
            if ( !keypath ) {
                return;
            }
            updateDependantsMap( ractive, keypath );
        };

        function updateDependantsMap( ractive, keypath ) {
            var keys, parentKeypath, map;
            // update dependants map
            keys = keypath.split( '.' );
            while ( keys.length ) {
                keys.pop();
                parentKeypath = keys.join( '.' );
                map = ractive._depsMap[ parentKeypath ];
                map[ keypath ] -= 1;
                if ( !map[ keypath ] ) {
                    // remove from parent deps map
                    map.splice( map.indexOf( keypath ), 1 );
                    map[ keypath ] = undefined;
                }
                keypath = parentKeypath;
            }
        }
    }();

    var shared_createComponentBinding = function( circular, runloop, isArray, isEqual, registerDependant, unregisterDependant ) {

        var get, set;
        circular.push( function() {
            get = circular.get;
            set = circular.set;
        } );
        var Binding = function( ractive, keypath, otherInstance, otherKeypath, priority ) {
            this.root = ractive;
            this.keypath = keypath;
            this.priority = priority;
            this.otherInstance = otherInstance;
            this.otherKeypath = otherKeypath;
            registerDependant( this );
            this.value = get( this.root, this.keypath );
        };
        Binding.prototype = {
            update: function() {
                var value;
                // Only *you* can prevent infinite loops
                if ( this.updating || this.counterpart && this.counterpart.updating ) {
                    return;
                }
                value = get( this.root, this.keypath );
                // Is this a smart array update? If so, it'll update on its
                // own, we shouldn't do anything
                if ( isArray( value ) && value._ractive && value._ractive.setting ) {
                    return;
                }
                if ( !isEqual( value, this.value ) ) {
                    this.updating = true;
                    // TODO maybe the case that `value === this.value` - should that result
                    // in an update rather than a set?
                    runloop.addInstance( this.otherInstance );
                    set( this.otherInstance, this.otherKeypath, value );
                    this.value = value;
                    // TODO will the counterpart update after this line, during
                    // the runloop end cycle? may be a problem...
                    this.updating = false;
                }
            },
            reassign: function( newKeypath ) {
                unregisterDependant( this );
                unregisterDependant( this.counterpart );
                this.keypath = newKeypath;
                this.counterpart.otherKeypath = newKeypath;
                registerDependant( this );
                registerDependant( this.counterpart );
            },
            teardown: function() {
                unregisterDependant( this );
            }
        };
        return function createComponentBinding( component, parentInstance, parentKeypath, childKeypath ) {
            var hash, childInstance, bindings, priority, parentToChildBinding, childToParentBinding;
            hash = parentKeypath + '=' + childKeypath;
            bindings = component.bindings;
            if ( bindings[ hash ] ) {
                // TODO does this ever happen?
                return;
            }
            bindings[ hash ] = true;
            childInstance = component.instance;
            priority = component.parentFragment.priority;
            parentToChildBinding = new Binding( parentInstance, parentKeypath, childInstance, childKeypath, priority );
            bindings.push( parentToChildBinding );
            if ( childInstance.twoway ) {
                childToParentBinding = new Binding( childInstance, childKeypath, parentInstance, parentKeypath, 1 );
                bindings.push( childToParentBinding );
                parentToChildBinding.counterpart = childToParentBinding;
                childToParentBinding.counterpart = parentToChildBinding;
            }
        };
    }( circular, global_runloop, utils_isArray, utils_isEqual, shared_registerDependant, shared_unregisterDependant );

    var shared_get_getFromParent = function( circular, createComponentBinding, set ) {

        var get;
        circular.push( function() {
            get = circular.get;
        } );
        return function getFromParent( child, keypath ) {
            var parent, fragment, keypathToTest, value, index;
            parent = child._parent;
            fragment = child.component.parentFragment;
            // Special case - index refs
            if ( fragment.indexRefs && ( index = fragment.indexRefs[ keypath ] ) !== undefined ) {
                // create an index ref binding, so that it can be reassigned letter if necessary
                child.component.indexRefBindings[ keypath ] = keypath;
                return index;
            }
            do {
                if ( !fragment.context ) {
                    continue;
                }
                keypathToTest = fragment.context + '.' + keypath;
                value = get( parent, keypathToTest );
                if ( value !== undefined ) {
                    createLateComponentBinding( parent, child, keypathToTest, keypath, value );
                    return value;
                }
            } while ( fragment = fragment.parent );
            value = get( parent, keypath );
            if ( value !== undefined ) {
                createLateComponentBinding( parent, child, keypath, keypath, value );
                return value;
            }
        };

        function createLateComponentBinding( parent, child, parentKeypath, childKeypath, value ) {
            set( child, childKeypath, value, true );
            createComponentBinding( child.component, parent, parentKeypath, childKeypath );
        }
    }( circular, shared_createComponentBinding, shared_set );

    var shared_get_FAILED_LOOKUP = {
        FAILED_LOOKUP: true
    };

    var shared_get__get = function( circular, hasOwnProperty, clone, adaptIfNecessary, getFromParent, FAILED_LOOKUP ) {

        function get( ractive, keypath, options ) {
            var cache = ractive._cache,
                value, computation, wrapped, evaluator;
            if ( cache[ keypath ] === undefined ) {
                // Is this a computed property?
                if ( computation = ractive._computations[ keypath ] ) {
                    value = computation.value;
                } else if ( wrapped = ractive._wrapped[ keypath ] ) {
                    value = wrapped.value;
                } else if ( !keypath ) {
                    adaptIfNecessary( ractive, '', ractive.data );
                    value = ractive.data;
                } else if ( evaluator = ractive._evaluators[ keypath ] ) {
                    value = evaluator.value;
                } else {
                    value = retrieve( ractive, keypath );
                }
                cache[ keypath ] = value;
            } else {
                value = cache[ keypath ];
            }
            // If the property doesn't exist on this viewmodel, we
            // can try going up a scope. This will create bindings
            // between parent and child if possible
            if ( value === FAILED_LOOKUP ) {
                if ( ractive._parent && !ractive.isolated ) {
                    value = getFromParent( ractive, keypath, options );
                } else {
                    value = undefined;
                }
            }
            if ( options && options.evaluateWrapped && ( wrapped = ractive._wrapped[ keypath ] ) ) {
                value = wrapped.get();
            }
            return value;
        }
        circular.get = get;
        return get;

        function retrieve( ractive, keypath ) {
            var keys, key, parentKeypath, parentValue, cacheMap, value, wrapped, shouldClone;
            keys = keypath.split( '.' );
            key = keys.pop();
            parentKeypath = keys.join( '.' );
            parentValue = get( ractive, parentKeypath );
            if ( wrapped = ractive._wrapped[ parentKeypath ] ) {
                parentValue = wrapped.get();
            }
            if ( parentValue === null || parentValue === undefined ) {
                return;
            }
            // update cache map
            if ( !( cacheMap = ractive._cacheMap[ parentKeypath ] ) ) {
                ractive._cacheMap[ parentKeypath ] = [ keypath ];
            } else {
                if ( cacheMap.indexOf( keypath ) === -1 ) {
                    cacheMap.push( keypath );
                }
            }
            // If this property doesn't exist, we return a sentinel value
            // so that we know to query parent scope (if such there be)
            if ( typeof parentValue === 'object' && !( key in parentValue ) ) {
                return ractive._cache[ keypath ] = FAILED_LOOKUP;
            }
            // If this value actually lives on the prototype of this
            // instance's `data`, and not as an own property, we need to
            // clone it. Otherwise the instance could end up manipulating
            // data that doesn't belong to it
            shouldClone = !hasOwnProperty.call( parentValue, key );
            value = shouldClone ? clone( parentValue[ key ] ) : parentValue[ key ];
            // Do we have an adaptor for this value?
            value = adaptIfNecessary( ractive, keypath, value, false );
            // Update cache
            ractive._cache[ keypath ] = value;
            return value;
        }
    }( circular, utils_hasOwnProperty, utils_clone, shared_adaptIfNecessary, shared_get_getFromParent, shared_get_FAILED_LOOKUP );

    /* global console */
    var utils_warn = function() {

        if ( typeof console !== 'undefined' && typeof console.warn === 'function' && typeof console.warn.apply === 'function' ) {
            return function() {
                console.warn.apply( console, arguments );
            };
        }
        return function() {};
    }();

    var utils_isObject = function() {

        var toString = Object.prototype.toString;
        return function( thing ) {
            return typeof thing === 'object' && toString.call( thing ) === '[object Object]';
        };
    }();

    var registries_interpolators = function( circular, hasOwnProperty, isArray, isObject, isNumeric ) {

        var interpolators, interpolate, cssLengthPattern;
        circular.push( function() {
            interpolate = circular.interpolate;
        } );
        cssLengthPattern = /^([+-]?[0-9]+\.?(?:[0-9]+)?)(px|em|ex|%|in|cm|mm|pt|pc)$/;
        interpolators = {
            number: function( from, to ) {
                var delta;
                if ( !isNumeric( from ) || !isNumeric( to ) ) {
                    return null;
                }
                from = +from;
                to = +to;
                delta = to - from;
                if ( !delta ) {
                    return function() {
                        return from;
                    };
                }
                return function( t ) {
                    return from + t * delta;
                };
            },
            array: function( from, to ) {
                var intermediate, interpolators, len, i;
                if ( !isArray( from ) || !isArray( to ) ) {
                    return null;
                }
                intermediate = [];
                interpolators = [];
                i = len = Math.min( from.length, to.length );
                while ( i-- ) {
                    interpolators[ i ] = interpolate( from[ i ], to[ i ] );
                }
                // surplus values - don't interpolate, but don't exclude them either
                for ( i = len; i < from.length; i += 1 ) {
                    intermediate[ i ] = from[ i ];
                }
                for ( i = len; i < to.length; i += 1 ) {
                    intermediate[ i ] = to[ i ];
                }
                return function( t ) {
                    var i = len;
                    while ( i-- ) {
                        intermediate[ i ] = interpolators[ i ]( t );
                    }
                    return intermediate;
                };
            },
            object: function( from, to ) {
                var properties, len, interpolators, intermediate, prop;
                if ( !isObject( from ) || !isObject( to ) ) {
                    return null;
                }
                properties = [];
                intermediate = {};
                interpolators = {};
                for ( prop in from ) {
                    if ( hasOwnProperty.call( from, prop ) ) {
                        if ( hasOwnProperty.call( to, prop ) ) {
                            properties.push( prop );
                            interpolators[ prop ] = interpolate( from[ prop ], to[ prop ] );
                        } else {
                            intermediate[ prop ] = from[ prop ];
                        }
                    }
                }
                for ( prop in to ) {
                    if ( hasOwnProperty.call( to, prop ) && !hasOwnProperty.call( from, prop ) ) {
                        intermediate[ prop ] = to[ prop ];
                    }
                }
                len = properties.length;
                return function( t ) {
                    var i = len,
                        prop;
                    while ( i-- ) {
                        prop = properties[ i ];
                        intermediate[ prop ] = interpolators[ prop ]( t );
                    }
                    return intermediate;
                };
            },
            cssLength: function( from, to ) {
                var fromMatch, toMatch, fromUnit, toUnit, fromValue, toValue, unit, delta;
                if ( from !== 0 && typeof from !== 'string' || to !== 0 && typeof to !== 'string' ) {
                    return null;
                }
                fromMatch = cssLengthPattern.exec( from );
                toMatch = cssLengthPattern.exec( to );
                fromUnit = fromMatch ? fromMatch[ 2 ] : '';
                toUnit = toMatch ? toMatch[ 2 ] : '';
                if ( fromUnit && toUnit && fromUnit !== toUnit ) {
                    return null;
                }
                unit = fromUnit || toUnit;
                fromValue = fromMatch ? +fromMatch[ 1 ] : 0;
                toValue = toMatch ? +toMatch[ 1 ] : 0;
                delta = toValue - fromValue;
                if ( !delta ) {
                    return function() {
                        return fromValue + unit;
                    };
                }
                return function( t ) {
                    return fromValue + t * delta + unit;
                };
            }
        };
        return interpolators;
    }( circular, utils_hasOwnProperty, utils_isArray, utils_isObject, utils_isNumeric );

    var shared_interpolate = function( circular, warn, interpolators ) {

        var interpolate = function( from, to, ractive, type ) {
            if ( from === to ) {
                return snap( to );
            }
            if ( type ) {
                if ( ractive.interpolators[ type ] ) {
                    return ractive.interpolators[ type ]( from, to ) || snap( to );
                }
                warn( 'Missing "' + type + '" interpolator. You may need to download a plugin from [TODO]' );
            }
            return interpolators.number( from, to ) || interpolators.array( from, to ) || interpolators.object( from, to ) || interpolators.cssLength( from, to ) || snap( to );
        };
        circular.interpolate = interpolate;
        return interpolate;

        function snap( to ) {
            return function() {
                return to;
            };
        }
    }( circular, utils_warn, registries_interpolators );

    var Ractive_prototype_animate_Animation = function( warn, runloop, interpolate, set ) {

        var Animation = function( options ) {
            var key;
            this.startTime = Date.now();
            // from and to
            for ( key in options ) {
                if ( options.hasOwnProperty( key ) ) {
                    this[ key ] = options[ key ];
                }
            }
            this.interpolator = interpolate( this.from, this.to, this.root, this.interpolator );
            this.running = true;
        };
        Animation.prototype = {
            tick: function() {
                var elapsed, t, value, timeNow, index, keypath;
                keypath = this.keypath;
                if ( this.running ) {
                    timeNow = Date.now();
                    elapsed = timeNow - this.startTime;
                    if ( elapsed >= this.duration ) {
                        if ( keypath !== null ) {
                            runloop.start( this.root );
                            set( this.root, keypath, this.to );
                            runloop.end();
                        }
                        if ( this.step ) {
                            this.step( 1, this.to );
                        }
                        this.complete( this.to );
                        index = this.root._animations.indexOf( this );
                        // TODO investigate why this happens
                        if ( index === -1 ) {
                            warn( 'Animation was not found' );
                        }
                        this.root._animations.splice( index, 1 );
                        this.running = false;
                        return false;
                    }
                    t = this.easing ? this.easing( elapsed / this.duration ) : elapsed / this.duration;
                    if ( keypath !== null ) {
                        value = this.interpolator( t );
                        runloop.start( this.root );
                        set( this.root, keypath, value );
                        runloop.end();
                    }
                    if ( this.step ) {
                        this.step( t, value );
                    }
                    return true;
                }
                return false;
            },
            stop: function() {
                var index;
                this.running = false;
                index = this.root._animations.indexOf( this );
                // TODO investigate why this happens
                if ( index === -1 ) {
                    warn( 'Animation was not found' );
                }
                this.root._animations.splice( index, 1 );
            }
        };
        return Animation;
    }( utils_warn, global_runloop, shared_interpolate, shared_set );

    var Ractive_prototype_animate__animate = function( isEqual, Promise, normaliseKeypath, animations, get, Animation ) {

        var noop = function() {}, noAnimation = {
                stop: noop
            };
        return function( keypath, to, options ) {
            var promise, fulfilPromise, k, animation, animations, easing, duration, step, complete, makeValueCollector, currentValues, collectValue, dummy, dummyOptions;
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            // animate multiple keypaths
            if ( typeof keypath === 'object' ) {
                options = to || {};
                easing = options.easing;
                duration = options.duration;
                animations = [];
                // we don't want to pass the `step` and `complete` handlers, as they will
                // run for each animation! So instead we'll store the handlers and create
                // our own...
                step = options.step;
                complete = options.complete;
                if ( step || complete ) {
                    currentValues = {};
                    options.step = null;
                    options.complete = null;
                    makeValueCollector = function( keypath ) {
                        return function( t, value ) {
                            currentValues[ keypath ] = value;
                        };
                    };
                }
                for ( k in keypath ) {
                    if ( keypath.hasOwnProperty( k ) ) {
                        if ( step || complete ) {
                            collectValue = makeValueCollector( k );
                            options = {
                                easing: easing,
                                duration: duration
                            };
                            if ( step ) {
                                options.step = collectValue;
                            }
                        }
                        options.complete = complete ? collectValue : noop;
                        animations.push( animate( this, k, keypath[ k ], options ) );
                    }
                }
                if ( step || complete ) {
                    dummyOptions = {
                        easing: easing,
                        duration: duration
                    };
                    if ( step ) {
                        dummyOptions.step = function( t ) {
                            step( t, currentValues );
                        };
                    }
                    if ( complete ) {
                        promise.then( function( t ) {
                            complete( t, currentValues );
                        } );
                    }
                    dummyOptions.complete = fulfilPromise;
                    dummy = animate( this, null, null, dummyOptions );
                    animations.push( dummy );
                }
                return {
                    stop: function() {
                        var animation;
                        while ( animation = animations.pop() ) {
                            animation.stop();
                        }
                        if ( dummy ) {
                            dummy.stop();
                        }
                    }
                };
            }
            // animate a single keypath
            options = options || {};
            if ( options.complete ) {
                promise.then( options.complete );
            }
            options.complete = fulfilPromise;
            animation = animate( this, keypath, to, options );
            promise.stop = function() {
                animation.stop();
            };
            return promise;
        };

        function animate( root, keypath, to, options ) {
            var easing, duration, animation, from;
            if ( keypath ) {
                keypath = normaliseKeypath( keypath );
            }
            if ( keypath !== null ) {
                from = get( root, keypath );
            }
            // cancel any existing animation
            // TODO what about upstream/downstream keypaths?
            animations.abort( keypath, root );
            // don't bother animating values that stay the same
            if ( isEqual( from, to ) ) {
                if ( options.complete ) {
                    options.complete( options.to );
                }
                return noAnimation;
            }
            // easing function
            if ( options.easing ) {
                if ( typeof options.easing === 'function' ) {
                    easing = options.easing;
                } else {
                    easing = root.easing[ options.easing ];
                }
                if ( typeof easing !== 'function' ) {
                    easing = null;
                }
            }
            // duration
            duration = options.duration === undefined ? 400 : options.duration;
            // TODO store keys, use an internal set method
            animation = new Animation( {
                keypath: keypath,
                from: from,
                to: to,
                root: root,
                duration: duration,
                easing: easing,
                interpolator: options.interpolator,
                // TODO wrap callbacks if necessary, to use instance as context
                step: options.step,
                complete: options.complete
            } );
            animations.add( animation );
            root._animations.push( animation );
            return animation;
        }
    }( utils_isEqual, utils_Promise, utils_normaliseKeypath, shared_animations, shared_get__get, Ractive_prototype_animate_Animation );

    var Ractive_prototype_detach = function() {
        return this.fragment.detach();
    };

    var Ractive_prototype_find = function( selector ) {
        if ( !this.el ) {
            return null;
        }
        return this.fragment.find( selector );
    };

    var utils_matches = function( isClient, vendors, createElement ) {

        var div, methodNames, unprefixed, prefixed, i, j, makeFunction;
        if ( !isClient ) {
            return;
        }
        div = createElement( 'div' );
        methodNames = [
            'matches',
            'matchesSelector'
        ];
        makeFunction = function( methodName ) {
            return function( node, selector ) {
                return node[ methodName ]( selector );
            };
        };
        i = methodNames.length;
        while ( i-- ) {
            unprefixed = methodNames[ i ];
            if ( div[ unprefixed ] ) {
                return makeFunction( unprefixed );
            }
            j = vendors.length;
            while ( j-- ) {
                prefixed = vendors[ i ] + unprefixed.substr( 0, 1 ).toUpperCase() + unprefixed.substring( 1 );
                if ( div[ prefixed ] ) {
                    return makeFunction( prefixed );
                }
            }
        }
        // IE8...
        return function( node, selector ) {
            var nodes, i;
            nodes = ( node.parentNode || node.document ).querySelectorAll( selector );
            i = nodes.length;
            while ( i-- ) {
                if ( nodes[ i ] === node ) {
                    return true;
                }
            }
            return false;
        };
    }( config_isClient, config_vendors, utils_createElement );

    var Ractive_prototype_shared_makeQuery_test = function( matches ) {

        return function( item, noDirty ) {
            var itemMatches = this._isComponentQuery ? !this.selector || item.name === this.selector : matches( item.node, this.selector );
            if ( itemMatches ) {
                this.push( item.node || item.instance );
                if ( !noDirty ) {
                    this._makeDirty();
                }
                return true;
            }
        };
    }( utils_matches );

    var Ractive_prototype_shared_makeQuery_cancel = function() {
        var liveQueries, selector, index;
        liveQueries = this._root[ this._isComponentQuery ? 'liveComponentQueries' : 'liveQueries' ];
        selector = this.selector;
        index = liveQueries.indexOf( selector );
        if ( index !== -1 ) {
            liveQueries.splice( index, 1 );
            liveQueries[ selector ] = null;
        }
    };

    var Ractive_prototype_shared_makeQuery_sortByItemPosition = function() {

        return function( a, b ) {
            var ancestryA, ancestryB, oldestA, oldestB, mutualAncestor, indexA, indexB, fragments, fragmentA, fragmentB;
            ancestryA = getAncestry( a.component || a._ractive.proxy );
            ancestryB = getAncestry( b.component || b._ractive.proxy );
            oldestA = ancestryA[ ancestryA.length - 1 ];
            oldestB = ancestryB[ ancestryB.length - 1 ];
            // remove items from the end of both ancestries as long as they are identical
            // - the final one removed is the closest mutual ancestor
            while ( oldestA && oldestA === oldestB ) {
                ancestryA.pop();
                ancestryB.pop();
                mutualAncestor = oldestA;
                oldestA = ancestryA[ ancestryA.length - 1 ];
                oldestB = ancestryB[ ancestryB.length - 1 ];
            }
            // now that we have the mutual ancestor, we can find which is earliest
            oldestA = oldestA.component || oldestA;
            oldestB = oldestB.component || oldestB;
            fragmentA = oldestA.parentFragment;
            fragmentB = oldestB.parentFragment;
            // if both items share a parent fragment, our job is easy
            if ( fragmentA === fragmentB ) {
                indexA = fragmentA.items.indexOf( oldestA );
                indexB = fragmentB.items.indexOf( oldestB );
                // if it's the same index, it means one contains the other,
                // so we see which has the longest ancestry
                return indexA - indexB || ancestryA.length - ancestryB.length;
            }
            // if mutual ancestor is a section, we first test to see which section
            // fragment comes first
            if ( fragments = mutualAncestor.fragments ) {
                indexA = fragments.indexOf( fragmentA );
                indexB = fragments.indexOf( fragmentB );
                return indexA - indexB || ancestryA.length - ancestryB.length;
            }
            throw new Error( 'An unexpected condition was met while comparing the position of two components. Please file an issue at https://github.com/RactiveJS/Ractive/issues - thanks!' );
        };

        function getParent( item ) {
            var parentFragment;
            if ( parentFragment = item.parentFragment ) {
                return parentFragment.owner;
            }
            if ( item.component && ( parentFragment = item.component.parentFragment ) ) {
                return parentFragment.owner;
            }
        }

        function getAncestry( item ) {
            var ancestry, ancestor;
            ancestry = [ item ];
            ancestor = getParent( item );
            while ( ancestor ) {
                ancestry.push( ancestor );
                ancestor = getParent( ancestor );
            }
            return ancestry;
        }
    }();

    var Ractive_prototype_shared_makeQuery_sortByDocumentPosition = function( sortByItemPosition ) {

        return function( node, otherNode ) {
            var bitmask;
            if ( node.compareDocumentPosition ) {
                bitmask = node.compareDocumentPosition( otherNode );
                return bitmask & 2 ? 1 : -1;
            }
            // In old IE, we can piggy back on the mechanism for
            // comparing component positions
            return sortByItemPosition( node, otherNode );
        };
    }( Ractive_prototype_shared_makeQuery_sortByItemPosition );

    var Ractive_prototype_shared_makeQuery_sort = function( sortByDocumentPosition, sortByItemPosition ) {

        return function() {
            this.sort( this._isComponentQuery ? sortByItemPosition : sortByDocumentPosition );
            this._dirty = false;
        };
    }( Ractive_prototype_shared_makeQuery_sortByDocumentPosition, Ractive_prototype_shared_makeQuery_sortByItemPosition );

    var Ractive_prototype_shared_makeQuery_dirty = function( runloop ) {

        return function() {
            if ( !this._dirty ) {
                runloop.addLiveQuery( this );
                this._dirty = true;
            }
        };
    }( global_runloop );

    var Ractive_prototype_shared_makeQuery_remove = function( nodeOrComponent ) {
        var index = this.indexOf( this._isComponentQuery ? nodeOrComponent.instance : nodeOrComponent );
        if ( index !== -1 ) {
            this.splice( index, 1 );
        }
    };

    var Ractive_prototype_shared_makeQuery__makeQuery = function( defineProperties, test, cancel, sort, dirty, remove ) {

        return function( ractive, selector, live, isComponentQuery ) {
            var query = [];
            defineProperties( query, {
                selector: {
                    value: selector
                },
                live: {
                    value: live
                },
                _isComponentQuery: {
                    value: isComponentQuery
                },
                _test: {
                    value: test
                }
            } );
            if ( !live ) {
                return query;
            }
            defineProperties( query, {
                cancel: {
                    value: cancel
                },
                _root: {
                    value: ractive
                },
                _sort: {
                    value: sort
                },
                _makeDirty: {
                    value: dirty
                },
                _remove: {
                    value: remove
                },
                _dirty: {
                    value: false,
                    writable: true
                }
            } );
            return query;
        };
    }( utils_defineProperties, Ractive_prototype_shared_makeQuery_test, Ractive_prototype_shared_makeQuery_cancel, Ractive_prototype_shared_makeQuery_sort, Ractive_prototype_shared_makeQuery_dirty, Ractive_prototype_shared_makeQuery_remove );

    var Ractive_prototype_findAll = function( makeQuery ) {

        return function( selector, options ) {
            var liveQueries, query;
            if ( !this.el ) {
                return [];
            }
            options = options || {};
            liveQueries = this._liveQueries;
            // Shortcut: if we're maintaining a live query with this
            // selector, we don't need to traverse the parallel DOM
            if ( query = liveQueries[ selector ] ) {
                // Either return the exact same query, or (if not live) a snapshot
                return options && options.live ? query : query.slice();
            }
            query = makeQuery( this, selector, !! options.live, false );
            // Add this to the list of live queries Ractive needs to maintain,
            // if applicable
            if ( query.live ) {
                liveQueries.push( selector );
                liveQueries[ selector ] = query;
            }
            this.fragment.findAll( selector, query );
            return query;
        };
    }( Ractive_prototype_shared_makeQuery__makeQuery );

    var Ractive_prototype_findAllComponents = function( makeQuery ) {

        return function( selector, options ) {
            var liveQueries, query;
            options = options || {};
            liveQueries = this._liveComponentQueries;
            // Shortcut: if we're maintaining a live query with this
            // selector, we don't need to traverse the parallel DOM
            if ( query = liveQueries[ selector ] ) {
                // Either return the exact same query, or (if not live) a snapshot
                return options && options.live ? query : query.slice();
            }
            query = makeQuery( this, selector, !! options.live, true );
            // Add this to the list of live queries Ractive needs to maintain,
            // if applicable
            if ( query.live ) {
                liveQueries.push( selector );
                liveQueries[ selector ] = query;
            }
            this.fragment.findAllComponents( selector, query );
            return query;
        };
    }( Ractive_prototype_shared_makeQuery__makeQuery );

    var Ractive_prototype_findComponent = function( selector ) {
        return this.fragment.findComponent( selector );
    };

    var Ractive_prototype_fire = function( eventName ) {
        var args, i, len, subscribers = this._subs[ eventName ];
        if ( !subscribers ) {
            return;
        }
        args = Array.prototype.slice.call( arguments, 1 );
        for ( i = 0, len = subscribers.length; i < len; i += 1 ) {
            subscribers[ i ].apply( this, args );
        }
    };

    var shared_get_UnresolvedImplicitDependency = function( circular, removeFromArray, runloop, notifyDependants ) {

        var get, empty = {};
        circular.push( function() {
            get = circular.get;
        } );
        var UnresolvedImplicitDependency = function( ractive, keypath ) {
            this.root = ractive;
            this.ref = keypath;
            this.parentFragment = empty;
            ractive._unresolvedImplicitDependencies[ keypath ] = true;
            ractive._unresolvedImplicitDependencies.push( this );
            runloop.addUnresolved( this );
        };
        UnresolvedImplicitDependency.prototype = {
            resolve: function() {
                var ractive = this.root;
                notifyDependants( ractive, this.ref );
                ractive._unresolvedImplicitDependencies[ this.ref ] = false;
                removeFromArray( ractive._unresolvedImplicitDependencies, this );
            },
            teardown: function() {
                runloop.removeUnresolved( this );
            }
        };
        return UnresolvedImplicitDependency;
    }( circular, utils_removeFromArray, global_runloop, shared_notifyDependants );

    var Ractive_prototype_get = function( normaliseKeypath, get, UnresolvedImplicitDependency ) {

        var options = {
            isTopLevel: true
        };
        return function Ractive_prototype_get( keypath ) {
            var value;
            keypath = normaliseKeypath( keypath );
            value = get( this, keypath, options );
            // capture the dependency, if we're inside an evaluator
            if ( this._captured && this._captured[ keypath ] !== true ) {
                this._captured.push( keypath );
                this._captured[ keypath ] = true;
                // if we couldn't resolve the keypath, we need to make it as a failed
                // lookup, so that the evaluator updates correctly once we CAN
                // resolve the keypath
                if ( value === undefined && this._unresolvedImplicitDependencies[ keypath ] !== true ) {
                    new UnresolvedImplicitDependency( this, keypath );
                }
            }
            return value;
        };
    }( utils_normaliseKeypath, shared_get__get, shared_get_UnresolvedImplicitDependency );

    var utils_getElement = function( input ) {
        var output;
        if ( typeof window === 'undefined' || !document || !input ) {
            return null;
        }
        // We already have a DOM node - no work to do. (Duck typing alert!)
        if ( input.nodeType ) {
            return input;
        }
        // Get node from string
        if ( typeof input === 'string' ) {
            // try ID first
            output = document.getElementById( input );
            // then as selector, if possible
            if ( !output && document.querySelector ) {
                output = document.querySelector( input );
            }
            // did it work?
            if ( output && output.nodeType ) {
                return output;
            }
        }
        // If we've been given a collection (jQuery, Zepto etc), extract the first item
        if ( input[ 0 ] && input[ 0 ].nodeType ) {
            return input[ 0 ];
        }
        return null;
    };

    var Ractive_prototype_insert = function( getElement ) {

        return function( target, anchor ) {
            target = getElement( target );
            anchor = getElement( anchor ) || null;
            if ( !target ) {
                throw new Error( 'You must specify a valid target to insert into' );
            }
            target.insertBefore( this.detach(), anchor );
            this.fragment.pNode = this.el = target;
        };
    }( utils_getElement );

    var Ractive_prototype_merge_mapOldToNewIndex = function( oldArray, newArray ) {
        var usedIndices, firstUnusedIndex, newIndices, changed;
        usedIndices = {};
        firstUnusedIndex = 0;
        newIndices = oldArray.map( function( item, i ) {
            var index, start, len;
            start = firstUnusedIndex;
            len = newArray.length;
            do {
                index = newArray.indexOf( item, start );
                if ( index === -1 ) {
                    changed = true;
                    return -1;
                }
                start = index + 1;
            } while ( usedIndices[ index ] && start < len );
            // keep track of the first unused index, so we don't search
            // the whole of newArray for each item in oldArray unnecessarily
            if ( index === firstUnusedIndex ) {
                firstUnusedIndex += 1;
            }
            if ( index !== i ) {
                changed = true;
            }
            usedIndices[ index ] = true;
            return index;
        } );
        newIndices.unchanged = !changed;
        return newIndices;
    };

    var Ractive_prototype_merge_propagateChanges = function( types, notifyDependants ) {

        return function( ractive, keypath, newIndices, lengthUnchanged ) {
            var updateDependant;
            ractive._changes.push( keypath );
            updateDependant = function( dependant ) {
                // references need to get processed before mustaches
                if ( dependant.type === types.REFERENCE ) {
                    dependant.update();
                } else if ( dependant.keypath === keypath && dependant.type === types.SECTION && !dependant.inverted && dependant.docFrag ) {
                    dependant.merge( newIndices );
                } else {
                    dependant.update();
                }
            };
            // Go through all dependant priority levels, finding merge targets
            ractive._deps.forEach( function( depsByKeypath ) {
                var dependants = depsByKeypath[ keypath ];
                if ( dependants ) {
                    dependants.forEach( updateDependant );
                }
            } );
            // length property has changed - notify dependants
            // TODO in some cases (e.g. todo list example, when marking all as complete, then
            // adding a new item (which should deactivate the 'all complete' checkbox
            // but doesn't) this needs to happen before other updates. But doing so causes
            // other mental problems. not sure what's going on...
            if ( !lengthUnchanged ) {
                notifyDependants( ractive, keypath + '.length', true );
            }
        };
    }( config_types, shared_notifyDependants );

    var Ractive_prototype_merge__merge = function( runloop, warn, isArray, Promise, set, mapOldToNewIndex, propagateChanges ) {

        var comparators = {};
        return function merge( keypath, array, options ) {
            var currentArray, oldArray, newArray, comparator, lengthUnchanged, newIndices, promise, fulfilPromise;
            currentArray = this.get( keypath );
            // If either the existing value or the new value isn't an
            // array, just do a regular set
            if ( !isArray( currentArray ) || !isArray( array ) ) {
                return this.set( keypath, array, options && options.complete );
            }
            lengthUnchanged = currentArray.length === array.length;
            if ( options && options.compare ) {
                comparator = getComparatorFunction( options.compare );
                try {
                    oldArray = currentArray.map( comparator );
                    newArray = array.map( comparator );
                } catch ( err ) {
                    // fallback to an identity check - worst case scenario we have
                    // to do more DOM manipulation than we thought...
                    // ...unless we're in debug mode of course
                    if ( this.debug ) {
                        throw err;
                    } else {
                        warn( 'Merge operation: comparison failed. Falling back to identity checking' );
                    }
                    oldArray = currentArray;
                    newArray = array;
                }
            } else {
                oldArray = currentArray;
                newArray = array;
            }
            // find new indices for members of oldArray
            newIndices = mapOldToNewIndex( oldArray, newArray );
            // Manage transitions
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            runloop.start( this, fulfilPromise );
            // Update the model
            // TODO allow existing array to be updated in place, rather than replaced?
            set( this, keypath, array, true );
            propagateChanges( this, keypath, newIndices, lengthUnchanged );
            runloop.end();
            // attach callback as fulfilment handler, if specified
            if ( options && options.complete ) {
                promise.then( options.complete );
            }
            return promise;
        };

        function stringify( item ) {
            return JSON.stringify( item );
        }

        function getComparatorFunction( comparator ) {
            // If `compare` is `true`, we use JSON.stringify to compare
            // objects that are the same shape, but non-identical - i.e.
            // { foo: 'bar' } !== { foo: 'bar' }
            if ( comparator === true ) {
                return stringify;
            }
            if ( typeof comparator === 'string' ) {
                if ( !comparators[ comparator ] ) {
                    comparators[ comparator ] = function( item ) {
                        return item[ comparator ];
                    };
                }
                return comparators[ comparator ];
            }
            if ( typeof comparator === 'function' ) {
                return comparator;
            }
            throw new Error( 'The `compare` option must be a function, or a string representing an identifying field (or `true` to use JSON.stringify)' );
        }
    }( global_runloop, utils_warn, utils_isArray, utils_Promise, shared_set, Ractive_prototype_merge_mapOldToNewIndex, Ractive_prototype_merge_propagateChanges );

    var Ractive_prototype_observe_Observer = function( runloop, isEqual, get ) {

        var Observer = function( ractive, keypath, callback, options ) {
            var self = this;
            this.root = ractive;
            this.keypath = keypath;
            this.callback = callback;
            this.defer = options.defer;
            this.debug = options.debug;
            this.proxy = {
                update: function() {
                    self.reallyUpdate();
                }
            };
            // Observers are notified before any DOM changes take place (though
            // they can defer execution until afterwards)
            this.priority = 0;
            // default to root as context, but allow it to be overridden
            this.context = options && options.context ? options.context : ractive;
        };
        Observer.prototype = {
            init: function( immediate ) {
                if ( immediate !== false ) {
                    this.update();
                } else {
                    this.value = get( this.root, this.keypath );
                }
            },
            update: function() {
                if ( this.defer && this.ready ) {
                    runloop.addObserver( this.proxy );
                    return;
                }
                this.reallyUpdate();
            },
            reallyUpdate: function() {
                var oldValue, newValue;
                oldValue = this.value;
                newValue = get( this.root, this.keypath );
                this.value = newValue;
                // Prevent infinite loops
                if ( this.updating ) {
                    return;
                }
                this.updating = true;
                if ( !isEqual( newValue, oldValue ) || !this.ready ) {
                    // wrap the callback in a try-catch block, and only throw error in
                    // debug mode
                    try {
                        this.callback.call( this.context, newValue, oldValue, this.keypath );
                    } catch ( err ) {
                        if ( this.debug || this.root.debug ) {
                            throw err;
                        }
                    }
                }
                this.updating = false;
            }
        };
        return Observer;
    }( global_runloop, utils_isEqual, shared_get__get );

    var Ractive_prototype_observe_getPattern = function( isArray ) {

        return function( ractive, pattern ) {
            var keys, key, values, toGet, newToGet, expand, concatenate;
            keys = pattern.split( '.' );
            toGet = [];
            expand = function( keypath ) {
                var value, key;
                value = ractive._wrapped[ keypath ] ? ractive._wrapped[ keypath ].get() : ractive.get( keypath );
                for ( key in value ) {
                    if ( value.hasOwnProperty( key ) && ( key !== '_ractive' || !isArray( value ) ) ) {
                        // for benefit of IE8
                        newToGet.push( keypath + '.' + key );
                    }
                }
            };
            concatenate = function( keypath ) {
                return keypath + '.' + key;
            };
            while ( key = keys.shift() ) {
                if ( key === '*' ) {
                    newToGet = [];
                    toGet.forEach( expand );
                    toGet = newToGet;
                } else {
                    if ( !toGet[ 0 ] ) {
                        toGet[ 0 ] = key;
                    } else {
                        toGet = toGet.map( concatenate );
                    }
                }
            }
            values = {};
            toGet.forEach( function( keypath ) {
                values[ keypath ] = ractive.get( keypath );
            } );
            return values;
        };
    }( utils_isArray );

    var Ractive_prototype_observe_PatternObserver = function( runloop, isEqual, get, getPattern ) {

        var PatternObserver, wildcard = /\*/;
        PatternObserver = function( ractive, keypath, callback, options ) {
            this.root = ractive;
            this.callback = callback;
            this.defer = options.defer;
            this.debug = options.debug;
            this.keypath = keypath;
            this.regex = new RegExp( '^' + keypath.replace( /\./g, '\\.' ).replace( /\*/g, '[^\\.]+' ) + '$' );
            this.values = {};
            if ( this.defer ) {
                this.proxies = [];
            }
            // Observers are notified before any DOM changes take place (though
            // they can defer execution until afterwards)
            this.priority = 'pattern';
            // default to root as context, but allow it to be overridden
            this.context = options && options.context ? options.context : ractive;
        };
        PatternObserver.prototype = {
            init: function( immediate ) {
                var values, keypath;
                values = getPattern( this.root, this.keypath );
                if ( immediate !== false ) {
                    for ( keypath in values ) {
                        if ( values.hasOwnProperty( keypath ) ) {
                            this.update( keypath );
                        }
                    }
                } else {
                    this.values = values;
                }
            },
            update: function( keypath ) {
                var values;
                if ( wildcard.test( keypath ) ) {
                    values = getPattern( this.root, keypath );
                    for ( keypath in values ) {
                        if ( values.hasOwnProperty( keypath ) ) {
                            this.update( keypath );
                        }
                    }
                    return;
                }
                if ( this.defer && this.ready ) {
                    runloop.addObserver( this.getProxy( keypath ) );
                    return;
                }
                this.reallyUpdate( keypath );
            },
            reallyUpdate: function( keypath ) {
                var value = get( this.root, keypath );
                // Prevent infinite loops
                if ( this.updating ) {
                    this.values[ keypath ] = value;
                    return;
                }
                this.updating = true;
                if ( !isEqual( value, this.values[ keypath ] ) || !this.ready ) {
                    // wrap the callback in a try-catch block, and only throw error in
                    // debug mode
                    try {
                        this.callback.call( this.context, value, this.values[ keypath ], keypath );
                    } catch ( err ) {
                        if ( this.debug || this.root.debug ) {
                            throw err;
                        }
                    }
                    this.values[ keypath ] = value;
                }
                this.updating = false;
            },
            getProxy: function( keypath ) {
                var self = this;
                if ( !this.proxies[ keypath ] ) {
                    this.proxies[ keypath ] = {
                        update: function() {
                            self.reallyUpdate( keypath );
                        }
                    };
                }
                return this.proxies[ keypath ];
            }
        };
        return PatternObserver;
    }( global_runloop, utils_isEqual, shared_get__get, Ractive_prototype_observe_getPattern );

    var Ractive_prototype_observe_getObserverFacade = function( normaliseKeypath, registerDependant, unregisterDependant, Observer, PatternObserver ) {

        var wildcard = /\*/,
            emptyObject = {};
        return function getObserverFacade( ractive, keypath, callback, options ) {
            var observer, isPatternObserver;
            keypath = normaliseKeypath( keypath );
            options = options || emptyObject;
            // pattern observers are treated differently
            if ( wildcard.test( keypath ) ) {
                observer = new PatternObserver( ractive, keypath, callback, options );
                ractive._patternObservers.push( observer );
                isPatternObserver = true;
            } else {
                observer = new Observer( ractive, keypath, callback, options );
            }
            registerDependant( observer );
            observer.init( options.init );
            // This flag allows observers to initialise even with undefined values
            observer.ready = true;
            return {
                cancel: function() {
                    var index;
                    if ( isPatternObserver ) {
                        index = ractive._patternObservers.indexOf( observer );
                        if ( index !== -1 ) {
                            ractive._patternObservers.splice( index, 1 );
                        }
                    }
                    unregisterDependant( observer );
                }
            };
        };
    }( utils_normaliseKeypath, shared_registerDependant, shared_unregisterDependant, Ractive_prototype_observe_Observer, Ractive_prototype_observe_PatternObserver );

    var Ractive_prototype_observe__observe = function( isObject, getObserverFacade ) {

        return function observe( keypath, callback, options ) {
            var observers, map, keypaths, i;
            // Allow a map of keypaths to handlers
            if ( isObject( keypath ) ) {
                options = callback;
                map = keypath;
                observers = [];
                for ( keypath in map ) {
                    if ( map.hasOwnProperty( keypath ) ) {
                        callback = map[ keypath ];
                        observers.push( this.observe( keypath, callback, options ) );
                    }
                }
                return {
                    cancel: function() {
                        while ( observers.length ) {
                            observers.pop().cancel();
                        }
                    }
                };
            }
            // Allow `ractive.observe( callback )` - i.e. observe entire model
            if ( typeof keypath === 'function' ) {
                options = callback;
                callback = keypath;
                keypath = '';
                return getObserverFacade( this, keypath, callback, options );
            }
            keypaths = keypath.split( ' ' );
            // Single keypath
            if ( keypaths.length === 1 ) {
                return getObserverFacade( this, keypath, callback, options );
            }
            // Multiple space-separated keypaths
            observers = [];
            i = keypaths.length;
            while ( i-- ) {
                keypath = keypaths[ i ];
                if ( keypath ) {
                    observers.push( getObserverFacade( this, keypath, callback, options ) );
                }
            }
            return {
                cancel: function() {
                    while ( observers.length ) {
                        observers.pop().cancel();
                    }
                }
            };
        };
    }( utils_isObject, Ractive_prototype_observe_getObserverFacade );

    var Ractive_prototype_off = function( eventName, callback ) {
        var subscribers, index;
        // if no callback specified, remove all callbacks
        if ( !callback ) {
            // if no event name specified, remove all callbacks for all events
            if ( !eventName ) {
                // TODO use this code instead, once the following issue has been resolved
                // in PhantomJS (tests are unpassable otherwise!)
                // https://github.com/ariya/phantomjs/issues/11856
                // defineProperty( this, '_subs', { value: create( null ), configurable: true });
                for ( eventName in this._subs ) {
                    delete this._subs[ eventName ];
                }
            } else {
                this._subs[ eventName ] = [];
            }
        }
        subscribers = this._subs[ eventName ];
        if ( subscribers ) {
            index = subscribers.indexOf( callback );
            if ( index !== -1 ) {
                subscribers.splice( index, 1 );
            }
        }
    };

    var Ractive_prototype_on = function( eventName, callback ) {
        var self = this,
            listeners, n;
        // allow mutliple listeners to be bound in one go
        if ( typeof eventName === 'object' ) {
            listeners = [];
            for ( n in eventName ) {
                if ( eventName.hasOwnProperty( n ) ) {
                    listeners.push( this.on( n, eventName[ n ] ) );
                }
            }
            return {
                cancel: function() {
                    var listener;
                    while ( listener = listeners.pop() ) {
                        listener.cancel();
                    }
                }
            };
        }
        if ( !this._subs[ eventName ] ) {
            this._subs[ eventName ] = [ callback ];
        } else {
            this._subs[ eventName ].push( callback );
        }
        return {
            cancel: function() {
                self.off( eventName, callback );
            }
        };
    };

    var utils_create = function() {

        var create;
        try {
            Object.create( null );
            create = Object.create;
        } catch ( err ) {
            // sigh
            create = function() {
                var F = function() {};
                return function( proto, props ) {
                    var obj;
                    if ( proto === null ) {
                        return {};
                    }
                    F.prototype = proto;
                    obj = new F();
                    if ( props ) {
                        Object.defineProperties( obj, props );
                    }
                    return obj;
                };
            }();
        }
        return create;
    }();

    var render_shared_Fragment_initialise = function( types, create ) {

        return function initFragment( fragment, options ) {
            var numItems, i, parentFragment, parentRefs, ref;
            // The item that owns this fragment - an element, section, partial, or attribute
            fragment.owner = options.owner;
            parentFragment = fragment.parent = fragment.owner.parentFragment;
            // inherited properties
            fragment.root = options.root;
            fragment.pNode = options.pNode;
            fragment.pElement = options.pElement;
            fragment.context = options.context;
            // If parent item is a section, this may not be the only fragment
            // that belongs to it - we need to make a note of the index
            if ( fragment.owner.type === types.SECTION ) {
                fragment.index = options.index;
            }
            // index references (the 'i' in {{#section:i}}<!-- -->{{/section}}) need to cascade
            // down the tree
            if ( parentFragment ) {
                parentRefs = parentFragment.indexRefs;
                if ( parentRefs ) {
                    fragment.indexRefs = create( null );
                    // avoids need for hasOwnProperty
                    for ( ref in parentRefs ) {
                        fragment.indexRefs[ ref ] = parentRefs[ ref ];
                    }
                }
            }
            // inherit priority
            fragment.priority = parentFragment ? parentFragment.priority + 1 : 1;
            if ( options.indexRef ) {
                if ( !fragment.indexRefs ) {
                    fragment.indexRefs = {};
                }
                fragment.indexRefs[ options.indexRef ] = options.index;
            }
            // Time to create this fragment's child items;
            fragment.items = [];
            numItems = options.descriptor ? options.descriptor.length : 0;
            for ( i = 0; i < numItems; i += 1 ) {
                fragment.items[ fragment.items.length ] = fragment.createItem( {
                    parentFragment: fragment,
                    pElement: options.pElement,
                    descriptor: options.descriptor[ i ],
                    index: i
                } );
            }
        };
    }( config_types, utils_create );

    var render_shared_utils_startsWithKeypath = function startsWithKeypath( target, keypath ) {
        return target.substr( 0, keypath.length + 1 ) === keypath + '.';
    };

    var render_shared_utils_startsWith = function( startsWithKeypath ) {

        return function startsWith( target, keypath ) {
            return target === keypath || startsWithKeypath( target, keypath );
        };
    }( render_shared_utils_startsWithKeypath );

    var render_shared_utils_getNewKeypath = function( startsWithKeypath ) {

        return function getNewKeypath( targetKeypath, oldKeypath, newKeypath ) {
            //exact match
            if ( targetKeypath === oldKeypath ) {
                return newKeypath;
            }
            //partial match based on leading keypath segments
            if ( startsWithKeypath( targetKeypath, oldKeypath ) ) {
                return targetKeypath.replace( oldKeypath + '.', newKeypath + '.' );
            }
        };
    }( render_shared_utils_startsWithKeypath );

    var render_shared_utils_assignNewKeypath = function( startsWith, getNewKeypath ) {

        return function assignNewKeypath( target, property, oldKeypath, newKeypath ) {
            if ( !target[ property ] || startsWith( target[ property ], newKeypath ) ) {
                return;
            }
            target[ property ] = getNewKeypath( target[ property ], oldKeypath, newKeypath );
        };
    }( render_shared_utils_startsWith, render_shared_utils_getNewKeypath );

    var render_shared_Fragment_reassign = function( assignNewKeypath ) {

        return function reassignFragment( indexRef, newIndex, oldKeypath, newKeypath ) {
            // If this fragment was rendered with innerHTML, we have nothing to do
            // TODO a less hacky way of determining this
            if ( this.html !== undefined ) {
                return;
            }
            // assign new context keypath if needed
            assignNewKeypath( this, 'context', oldKeypath, newKeypath );
            if ( this.indexRefs && this.indexRefs[ indexRef ] !== undefined && this.indexRefs[ indexRef ] !== newIndex ) {
                this.indexRefs[ indexRef ] = newIndex;
            }
            this.items.forEach( function( item ) {
                item.reassign( indexRef, newIndex, oldKeypath, newKeypath );
            } );
        };
    }( render_shared_utils_assignNewKeypath );

    var render_shared_Fragment__Fragment = function( init, reassign ) {

        return {
            init: init,
            reassign: reassign
        };
    }( render_shared_Fragment_initialise, render_shared_Fragment_reassign );

    var render_DomFragment_shared_insertHtml = function( namespaces, createElement ) {

        var elementCache = {}, ieBug, ieBlacklist;
        try {
            createElement( 'table' ).innerHTML = 'foo';
        } catch ( err ) {
            ieBug = true;
            ieBlacklist = {
                TABLE: [
                    '<table class="x">',
                    '</table>'
                ],
                THEAD: [
                    '<table><thead class="x">',
                    '</thead></table>'
                ],
                TBODY: [
                    '<table><tbody class="x">',
                    '</tbody></table>'
                ],
                TR: [
                    '<table><tr class="x">',
                    '</tr></table>'
                ],
                SELECT: [
                    '<select class="x">',
                    '</select>'
                ]
            };
        }
        return function( html, tagName, namespace, docFrag ) {
            var container, nodes = [],
                wrapper;
            if ( html ) {
                if ( ieBug && ( wrapper = ieBlacklist[ tagName ] ) ) {
                    container = element( 'DIV' );
                    container.innerHTML = wrapper[ 0 ] + html + wrapper[ 1 ];
                    container = container.querySelector( '.x' );
                } else if ( namespace === namespaces.svg ) {
                    container = element( 'DIV' );
                    container.innerHTML = '<svg class="x">' + html + '</svg>';
                    container = container.querySelector( '.x' );
                } else {
                    container = element( tagName );
                    container.innerHTML = html;
                }
                while ( container.firstChild ) {
                    nodes.push( container.firstChild );
                    docFrag.appendChild( container.firstChild );
                }
            }
            return nodes;
        };

        function element( tagName ) {
            return elementCache[ tagName ] || ( elementCache[ tagName ] = createElement( tagName ) );
        }
    }( config_namespaces, utils_createElement );

    var render_DomFragment_shared_detach = function() {
        var node = this.node,
            parentNode;
        if ( node && ( parentNode = node.parentNode ) ) {
            parentNode.removeChild( node );
            return node;
        }
    };

    var render_DomFragment_Text = function( types, detach ) {

        var DomText, lessThan, greaterThan;
        lessThan = /</g;
        greaterThan = />/g;
        DomText = function( options, docFrag ) {
            this.type = types.TEXT;
            this.descriptor = options.descriptor;
            if ( docFrag ) {
                this.node = document.createTextNode( options.descriptor );
                docFrag.appendChild( this.node );
            }
        };
        DomText.prototype = {
            detach: detach,
            reassign: function() {},
            //no-op
            teardown: function( destroy ) {
                if ( destroy ) {
                    this.detach();
                }
            },
            firstNode: function() {
                return this.node;
            },
            toString: function() {
                return ( '' + this.descriptor ).replace( lessThan, '&lt;' ).replace( greaterThan, '&gt;' );
            }
        };
        return DomText;
    }( config_types, render_DomFragment_shared_detach );

    var shared_teardown = function( runloop, unregisterDependant ) {

        return function( thing ) {
            if ( !thing.keypath ) {
                // this was on the 'unresolved' list, we need to remove it
                runloop.removeUnresolved( thing );
            } else {
                // this was registered as a dependant
                unregisterDependant( thing );
            }
        };
    }( global_runloop, shared_unregisterDependant );

    var shared_Unresolved = function( runloop ) {

        var Unresolved = function( ractive, ref, parentFragment, callback ) {
            this.root = ractive;
            this.ref = ref;
            this.parentFragment = parentFragment;
            this.resolve = callback;
            runloop.addUnresolved( this );
        };
        Unresolved.prototype = {
            teardown: function() {
                runloop.removeUnresolved( this );
            }
        };
        return Unresolved;
    }( global_runloop );

    var render_shared_Evaluator_Reference = function( types, isEqual, defineProperty, registerDependant, unregisterDependant ) {

        var Reference, thisPattern;
        thisPattern = /this/;
        Reference = function( root, keypath, evaluator, argNum, priority ) {
            var value;
            this.evaluator = evaluator;
            this.keypath = keypath;
            this.root = root;
            this.argNum = argNum;
            this.type = types.REFERENCE;
            this.priority = priority;
            value = root.get( keypath );
            if ( typeof value === 'function' ) {
                value = wrapFunction( value, root, evaluator );
            }
            this.value = evaluator.values[ argNum ] = value;
            registerDependant( this );
        };
        Reference.prototype = {
            update: function() {
                var value = this.root.get( this.keypath );
                if ( typeof value === 'function' && !value._nowrap ) {
                    value = wrapFunction( value, this.root, this.evaluator );
                }
                if ( !isEqual( value, this.value ) ) {
                    this.evaluator.values[ this.argNum ] = value;
                    this.evaluator.bubble();
                    this.value = value;
                }
            },
            teardown: function() {
                unregisterDependant( this );
            }
        };
        return Reference;

        function wrapFunction( fn, ractive, evaluator ) {
            var prop, evaluators, index;
            // If the function doesn't refer to `this`, we don't need
            // to set the context, because we're not doing `this.get()`
            // (which is how dependencies are tracked)
            if ( !thisPattern.test( fn.toString() ) ) {
                defineProperty( fn, '_nowrap', {
                    // no point doing this every time
                    value: true
                } );
                return fn;
            }
            // If this function is being wrapped for the first time...
            if ( !fn[ '_' + ractive._guid ] ) {
                // ...we need to do some work
                defineProperty( fn, '_' + ractive._guid, {
                    value: function() {
                        var originalCaptured, result, i, evaluator;
                        originalCaptured = ractive._captured;
                        if ( !originalCaptured ) {
                            ractive._captured = [];
                        }
                        result = fn.apply( ractive, arguments );
                        if ( ractive._captured.length ) {
                            i = evaluators.length;
                            while ( i-- ) {
                                evaluator = evaluators[ i ];
                                evaluator.updateSoftDependencies( ractive._captured );
                            }
                        }
                        // reset
                        ractive._captured = originalCaptured;
                        return result;
                    },
                    writable: true
                } );
                for ( prop in fn ) {
                    if ( fn.hasOwnProperty( prop ) ) {
                        fn[ '_' + ractive._guid ][ prop ] = fn[ prop ];
                    }
                }
                fn[ '_' + ractive._guid + '_evaluators' ] = [];
            }
            // We need to make a note of which evaluators are using this function,
            // so that they can all be notified of changes
            evaluators = fn[ '_' + ractive._guid + '_evaluators' ];
            index = evaluators.indexOf( evaluator );
            if ( index === -1 ) {
                evaluators.push( evaluator );
            }
            // Return the wrapped function
            return fn[ '_' + ractive._guid ];
        }
    }( config_types, utils_isEqual, utils_defineProperty, shared_registerDependant, shared_unregisterDependant );

    var render_shared_Evaluator_SoftReference = function( isEqual, registerDependant, unregisterDependant ) {

        var SoftReference = function( root, keypath, evaluator ) {
            this.root = root;
            this.keypath = keypath;
            this.priority = evaluator.priority;
            this.evaluator = evaluator;
            registerDependant( this );
        };
        SoftReference.prototype = {
            update: function() {
                var value = this.root.get( this.keypath );
                if ( !isEqual( value, this.value ) ) {
                    this.evaluator.bubble();
                    this.value = value;
                }
            },
            teardown: function() {
                unregisterDependant( this );
            }
        };
        return SoftReference;
    }( utils_isEqual, shared_registerDependant, shared_unregisterDependant );

    var render_shared_Evaluator__Evaluator = function( runloop, warn, isEqual, clearCache, notifyDependants, adaptIfNecessary, Reference, SoftReference ) {

        var Evaluator, cache = {};
        Evaluator = function( root, keypath, uniqueString, functionStr, args, priority ) {
            var evaluator = this;
            evaluator.root = root;
            evaluator.uniqueString = uniqueString;
            evaluator.keypath = keypath;
            evaluator.priority = priority;
            evaluator.fn = getFunctionFromString( functionStr, args.length );
            evaluator.values = [];
            evaluator.refs = [];
            args.forEach( function( arg, i ) {
                if ( !arg ) {
                    return;
                }
                if ( arg.indexRef ) {
                    // this is an index ref... we don't need to register a dependant
                    evaluator.values[ i ] = arg.value;
                } else {
                    evaluator.refs.push( new Reference( root, arg.keypath, evaluator, i, priority ) );
                }
            } );
            evaluator.selfUpdating = evaluator.refs.length <= 1;
        };
        Evaluator.prototype = {
            bubble: function() {
                // If we only have one reference, we can update immediately...
                if ( this.selfUpdating ) {
                    this.update();
                } else if ( !this.deferred ) {
                    runloop.addEvaluator( this );
                    this.deferred = true;
                }
            },
            update: function() {
                var value;
                // prevent infinite loops
                if ( this.evaluating ) {
                    return this;
                }
                this.evaluating = true;
                try {
                    value = this.fn.apply( null, this.values );
                } catch ( err ) {
                    if ( this.root.debug ) {
                        warn( 'Error evaluating "' + this.uniqueString + '": ' + err.message || err );
                    }
                    value = undefined;
                }
                if ( !isEqual( value, this.value ) ) {
                    this.value = value;
                    clearCache( this.root, this.keypath );
                    adaptIfNecessary( this.root, this.keypath, value, true );
                    notifyDependants( this.root, this.keypath );
                }
                this.evaluating = false;
                return this;
            },
            // TODO should evaluators ever get torn down? At present, they don't...
            teardown: function() {
                while ( this.refs.length ) {
                    this.refs.pop().teardown();
                }
                clearCache( this.root, this.keypath );
                this.root._evaluators[ this.keypath ] = null;
            },
            // This method forces the evaluator to sync with the current model
            // in the case of a smart update
            refresh: function() {
                if ( !this.selfUpdating ) {
                    this.deferred = true;
                }
                var i = this.refs.length;
                while ( i-- ) {
                    this.refs[ i ].update();
                }
                if ( this.deferred ) {
                    this.update();
                    this.deferred = false;
                }
            },
            updateSoftDependencies: function( softDeps ) {
                var i, keypath, ref;
                if ( !this.softRefs ) {
                    this.softRefs = [];
                }
                // teardown any references that are no longer relevant
                i = this.softRefs.length;
                while ( i-- ) {
                    ref = this.softRefs[ i ];
                    if ( !softDeps[ ref.keypath ] ) {
                        this.softRefs.splice( i, 1 );
                        this.softRefs[ ref.keypath ] = false;
                        ref.teardown();
                    }
                }
                // add references for any new soft dependencies
                i = softDeps.length;
                while ( i-- ) {
                    keypath = softDeps[ i ];
                    if ( !this.softRefs[ keypath ] ) {
                        ref = new SoftReference( this.root, keypath, this );
                        this.softRefs.push( ref );
                        this.softRefs[ keypath ] = true;
                    }
                }
                this.selfUpdating = this.refs.length + this.softRefs.length <= 1;
            }
        };
        return Evaluator;

        function getFunctionFromString( str, i ) {
            var fn, args;
            str = str.replace( /\$\{([0-9]+)\}/g, '_$1' );
            if ( cache[ str ] ) {
                return cache[ str ];
            }
            args = [];
            while ( i-- ) {
                args[ i ] = '_' + i;
            }
            fn = new Function( args.join( ',' ), 'return(' + str + ')' );
            cache[ str ] = fn;
            return fn;
        }
    }( global_runloop, utils_warn, utils_isEqual, shared_clearCache, shared_notifyDependants, shared_adaptIfNecessary, render_shared_Evaluator_Reference, render_shared_Evaluator_SoftReference );

    var render_shared_Resolvers_ExpressionResolver = function( removeFromArray, resolveRef, Unresolved, Evaluator, getNewKeypath ) {

        var ExpressionResolver = function( owner, parentFragment, expression, callback ) {
            var expressionResolver = this,
                ractive, indexRefs, args;
            ractive = owner.root;
            this.root = ractive;
            this.callback = callback;
            this.owner = owner;
            this.str = expression.s;
            this.args = args = [];
            this.unresolved = [];
            this.pending = 0;
            indexRefs = parentFragment.indexRefs;
            // some expressions don't have references. edge case, but, yeah.
            if ( !expression.r || !expression.r.length ) {
                this.resolved = this.ready = true;
                this.bubble();
                return;
            }
            // Create resolvers for each reference
            expression.r.forEach( function( reference, i ) {
                var index, keypath, unresolved;
                // Is this an index reference?
                if ( indexRefs && ( index = indexRefs[ reference ] ) !== undefined ) {
                    args[ i ] = {
                        indexRef: reference,
                        value: index
                    };
                    return;
                }
                // Can we resolve it immediately?
                if ( keypath = resolveRef( ractive, reference, parentFragment ) ) {
                    args[ i ] = {
                        keypath: keypath
                    };
                    return;
                }
                // Couldn't resolve yet
                args[ i ] = undefined;
                expressionResolver.pending += 1;
                unresolved = new Unresolved( ractive, reference, parentFragment, function( keypath ) {
                    expressionResolver.resolve( i, keypath );
                    removeFromArray( expressionResolver.unresolved, unresolved );
                } );
                expressionResolver.unresolved.push( unresolved );
            } );
            this.ready = true;
            this.bubble();
        };
        ExpressionResolver.prototype = {
            bubble: function() {
                if ( !this.ready ) {
                    return;
                }
                this.uniqueString = getUniqueString( this.str, this.args );
                this.keypath = getKeypath( this.uniqueString );
                this.createEvaluator();
                this.callback( this.keypath );
            },
            teardown: function() {
                var unresolved;
                while ( unresolved = this.unresolved.pop() ) {
                    unresolved.teardown();
                }
            },
            resolve: function( index, keypath ) {
                this.args[ index ] = {
                    keypath: keypath
                };
                this.bubble();
                // when all references have been resolved, we can flag the entire expression
                // as having been resolved
                this.resolved = !--this.pending;
            },
            createEvaluator: function() {
                var evaluator;
                // only if it doesn't exist yet!
                if ( !this.root._evaluators[ this.keypath ] ) {
                    evaluator = new Evaluator( this.root, this.keypath, this.uniqueString, this.str, this.args, this.owner.priority );
                    this.root._evaluators[ this.keypath ] = evaluator;
                    evaluator.update();
                } else {
                    // we need to trigger a refresh of the evaluator, since it
                    // will have become de-synced from the model if we're in a
                    // reassignment cycle
                    this.root._evaluators[ this.keypath ].refresh();
                }
            },
            reassign: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                var changed;
                this.args.forEach( function( arg ) {
                    var changedKeypath;
                    if ( arg.keypath && ( changedKeypath = getNewKeypath( arg.keypath, oldKeypath, newKeypath ) ) ) {
                        arg.keypath = changedKeypath;
                        changed = true;
                    } else if ( arg.indexRef === indexRef ) {
                        arg.value = newIndex;
                        changed = true;
                    }
                } );
                if ( changed ) {
                    this.bubble();
                }
            }
        };
        return ExpressionResolver;

        function getUniqueString( str, args ) {
            // get string that is unique to this expression
            return str.replace( /\$\{([0-9]+)\}/g, function( match, $1 ) {
                return args[ $1 ] ? args[ $1 ].value || args[ $1 ].keypath : 'undefined';
            } );
        }

        function getKeypath( uniqueString ) {
            // Sanitize by removing any periods or square brackets. Otherwise
            // we can't split the keypath into keys!
            return '${' + uniqueString.replace( /[\.\[\]]/g, '-' ) + '}';
        }
    }( utils_removeFromArray, shared_resolveRef, shared_Unresolved, render_shared_Evaluator__Evaluator, render_shared_utils_getNewKeypath );

    var render_shared_Resolvers_KeypathExpressionResolver = function( types, removeFromArray, resolveRef, Unresolved, registerDependant, unregisterDependant, ExpressionResolver ) {

        var KeypathExpressionResolver = function( mustache, descriptor, callback ) {
            var resolver = this,
                ractive, parentFragment, keypath, dynamic, members;
            ractive = mustache.root;
            parentFragment = mustache.parentFragment;
            this.ref = descriptor.r;
            this.root = mustache.root;
            this.mustache = mustache;
            this.callback = callback;
            this.pending = 0;
            this.unresolved = [];
            members = this.members = [];
            this.indexRefMembers = [];
            this.keypathObservers = [];
            this.expressionResolvers = [];
            descriptor.m.forEach( function( member, i ) {
                var ref, indexRefs, index, createKeypathObserver, unresolved, expressionResolver;
                if ( typeof member === 'string' ) {
                    resolver.members[ i ] = member;
                    return;
                }
                // simple reference?
                if ( member.t === types.REFERENCE ) {
                    ref = member.n;
                    indexRefs = parentFragment.indexRefs;
                    if ( indexRefs && ( index = indexRefs[ ref ] ) !== undefined ) {
                        members[ i ] = index;
                        // make a note of it, in case of reassignments
                        resolver.indexRefMembers.push( {
                            ref: ref,
                            index: i
                        } );
                        return;
                    }
                    dynamic = true;
                    createKeypathObserver = function( keypath ) {
                        var keypathObserver = new KeypathObserver( ractive, keypath, mustache.priority, resolver, i );
                        resolver.keypathObservers.push( keypathObserver );
                    };
                    // Can we resolve the reference immediately?
                    if ( keypath = resolveRef( ractive, ref, parentFragment ) ) {
                        createKeypathObserver( keypath );
                        return;
                    }
                    // Couldn't resolve yet
                    members[ i ] = undefined;
                    resolver.pending += 1;
                    unresolved = new Unresolved( ractive, ref, parentFragment, function( keypath ) {
                        resolver.resolve( i, keypath );
                        removeFromArray( resolver.unresolved, unresolved );
                    } );
                    resolver.unresolved.push( unresolved );
                    return null;
                }
                // Otherwise we have an expression in its own right
                dynamic = true;
                resolver.pending += 1;
                expressionResolver = new ExpressionResolver( resolver, parentFragment, member, function( keypath ) {
                    resolver.resolve( i, keypath );
                    removeFromArray( resolver.unresolved, expressionResolver );
                } );
                resolver.unresolved.push( expressionResolver );
            } );
            // Some keypath expressions (e.g. foo["bar"], or foo[i] where `i` is an
            // index reference) won't change. So we don't need to register any watchers
            if ( !dynamic ) {
                keypath = this.getKeypath();
                callback( keypath );
                return;
            }
            this.ready = true;
            this.bubble();
        };
        KeypathExpressionResolver.prototype = {
            getKeypath: function() {
                return this.ref + '.' + this.members.join( '.' );
            },
            bubble: function() {
                if ( !this.ready || this.pending ) {
                    return;
                }
                this.callback( this.getKeypath() );
            },
            resolve: function( index, value ) {
                var keypathObserver = new KeypathObserver( this.root, value, this.mustache.priority, this, index );
                keypathObserver.update();
                this.keypathObservers.push( keypathObserver );
                // when all references have been resolved, we can flag the entire expression
                // as having been resolved
                this.resolved = !--this.pending;
                this.bubble();
            },
            teardown: function() {
                var unresolved;
                while ( unresolved = this.unresolved.pop() ) {
                    unresolved.teardown();
                }
            },
            reassign: function( indexRef, newIndex ) {
                var changed, i, member;
                i = this.indexRefMembers.length;
                while ( i-- ) {
                    member = this.indexRefMembers[ i ];
                    if ( member.ref === indexRef ) {
                        changed = true;
                        this.members[ member.index ] = newIndex;
                    }
                }
                if ( changed ) {
                    this.bubble();
                }
            }
        };
        var KeypathObserver = function( ractive, keypath, priority, resolver, index ) {
            this.root = ractive;
            this.keypath = keypath;
            this.priority = priority;
            this.resolver = resolver;
            this.index = index;
            registerDependant( this );
            this.update();
        };
        KeypathObserver.prototype = {
            update: function() {
                var resolver = this.resolver;
                resolver.members[ this.index ] = this.root.get( this.keypath );
                resolver.bubble();
            },
            teardown: function() {
                unregisterDependant( this );
            }
        };
        return KeypathExpressionResolver;
    }( config_types, utils_removeFromArray, shared_resolveRef, shared_Unresolved, shared_registerDependant, shared_unregisterDependant, render_shared_Resolvers_ExpressionResolver );

    var render_shared_Mustache_initialise = function( runloop, resolveRef, KeypathExpressionResolver, ExpressionResolver ) {

        return function initMustache( mustache, options ) {
            var ref, keypath, indexRefs, index, parentFragment, descriptor, resolve;
            parentFragment = options.parentFragment;
            descriptor = options.descriptor;
            mustache.root = parentFragment.root;
            mustache.parentFragment = parentFragment;
            mustache.descriptor = options.descriptor;
            mustache.index = options.index || 0;
            mustache.priority = parentFragment.priority;
            mustache.type = options.descriptor.t;
            resolve = function( keypath ) {
                mustache.resolve( keypath );
            };
            // if this is a simple mustache, with a reference, we just need to resolve
            // the reference to a keypath
            if ( ref = descriptor.r ) {
                indexRefs = parentFragment.indexRefs;
                if ( indexRefs && ( index = indexRefs[ ref ] ) !== undefined ) {
                    mustache.indexRef = ref;
                    mustache.value = index;
                    mustache.render( mustache.value );
                } else {
                    keypath = resolveRef( mustache.root, ref, mustache.parentFragment );
                    if ( keypath !== undefined ) {
                        resolve( keypath );
                    } else {
                        mustache.ref = ref;
                        runloop.addUnresolved( mustache );
                    }
                }
            }
            // if it's an expression, we have a bit more work to do
            if ( options.descriptor.x ) {
                mustache.resolver = new ExpressionResolver( mustache, parentFragment, options.descriptor.x, resolve );
            }
            if ( options.descriptor.kx ) {
                mustache.resolver = new KeypathExpressionResolver( mustache, options.descriptor.kx, resolve );
            }
            // Special case - inverted sections
            if ( mustache.descriptor.n && !mustache.hasOwnProperty( 'value' ) ) {
                mustache.render( undefined );
            }
        };
    }( global_runloop, shared_resolveRef, render_shared_Resolvers_KeypathExpressionResolver, render_shared_Resolvers_ExpressionResolver );

    var render_shared_Mustache_update = function( isEqual, get ) {

        var options = {
            evaluateWrapped: true
        };
        return function updateMustache() {
            var value = get( this.root, this.keypath, options );
            if ( !isEqual( value, this.value ) ) {
                this.render( value );
                this.value = value;
            }
        };
    }( utils_isEqual, shared_get__get );

    var render_shared_Mustache_resolve = function( types, registerDependant, unregisterDependant ) {

        return function resolveMustache( keypath ) {
            var i;
            // In some cases, we may resolve to the same keypath (if this is
            // an expression mustache that was reassigned due to an ancestor's
            // keypath) - in which case, this is a no-op
            if ( keypath === this.keypath ) {
                return;
            }
            // if we resolved previously, we need to unregister
            if ( this.registered ) {
                unregisterDependant( this );
                // is this a section? if so, we may have children that need
                // to be reassigned
                // TODO only DOM sections?
                if ( this.type === types.SECTION ) {
                    i = this.fragments.length;
                    while ( i-- ) {
                        this.fragments[ i ].reassign( null, null, this.keypath, keypath );
                    }
                }
            }
            this.keypath = keypath;
            registerDependant( this );
            this.update();
        };
    }( config_types, shared_registerDependant, shared_unregisterDependant );

    var render_shared_Mustache_reassign = function( getNewKeypath ) {

        return function reassignMustache( indexRef, newIndex, oldKeypath, newKeypath ) {
            var updated, i;
            // expression mustache?
            if ( this.resolver ) {
                this.resolver.reassign( indexRef, newIndex, oldKeypath, newKeypath );
            } else if ( this.keypath ) {
                updated = getNewKeypath( this.keypath, oldKeypath, newKeypath );
                // was a new keypath created?
                if ( updated ) {
                    // resolve it
                    this.resolve( updated );
                }
            } else if ( indexRef !== undefined && this.indexRef === indexRef ) {
                this.value = newIndex;
                this.render( newIndex );
            }
            // otherwise, it's an unresolved reference. the context stack has been updated
            // so it will take care of itself
            // if it's a section mustache, we need to go through any children
            if ( this.fragments ) {
                i = this.fragments.length;
                while ( i-- ) {
                    this.fragments[ i ].reassign( indexRef, newIndex, oldKeypath, newKeypath );
                }
            }
        };
    }( render_shared_utils_getNewKeypath );

    var render_shared_Mustache__Mustache = function( init, update, resolve, reassign ) {

        return {
            init: init,
            update: update,
            resolve: resolve,
            reassign: reassign
        };
    }( render_shared_Mustache_initialise, render_shared_Mustache_update, render_shared_Mustache_resolve, render_shared_Mustache_reassign );

    var render_DomFragment_Interpolator = function( types, teardown, Mustache, detach ) {

        var DomInterpolator, lessThan, greaterThan;
        lessThan = /</g;
        greaterThan = />/g;
        DomInterpolator = function( options, docFrag ) {
            this.type = types.INTERPOLATOR;
            if ( docFrag ) {
                this.node = document.createTextNode( '' );
                docFrag.appendChild( this.node );
            }
            // extend Mustache
            Mustache.init( this, options );
        };
        DomInterpolator.prototype = {
            update: Mustache.update,
            resolve: Mustache.resolve,
            reassign: Mustache.reassign,
            detach: detach,
            teardown: function( destroy ) {
                if ( destroy ) {
                    this.detach();
                }
                teardown( this );
            },
            render: function( value ) {
                if ( this.node ) {
                    this.node.data = value == undefined ? '' : value;
                }
            },
            firstNode: function() {
                return this.node;
            },
            toString: function() {
                var value = this.value != undefined ? '' + this.value : '';
                return value.replace( lessThan, '&lt;' ).replace( greaterThan, '&gt;' );
            }
        };
        return DomInterpolator;
    }( config_types, shared_teardown, render_shared_Mustache__Mustache, render_DomFragment_shared_detach );

    var render_DomFragment_Section_prototype_merge = function() {

        var toTeardown = [];
        return function sectionMerge( newIndices ) {
            var section = this,
                parentFragment, firstChange, i, newLength, reassignedFragments, fragmentOptions, fragment, nextNode;
            parentFragment = this.parentFragment;
            reassignedFragments = [];
            // first, reassign existing fragments
            newIndices.forEach( function reassignIfNecessary( newIndex, oldIndex ) {
                var fragment, by, oldKeypath, newKeypath;
                if ( newIndex === oldIndex ) {
                    reassignedFragments[ newIndex ] = section.fragments[ oldIndex ];
                    return;
                }
                if ( firstChange === undefined ) {
                    firstChange = oldIndex;
                }
                // does this fragment need to be torn down?
                if ( newIndex === -1 ) {
                    toTeardown.push( section.fragments[ oldIndex ] );
                    return;
                }
                // Otherwise, it needs to be reassigned to a new index
                fragment = section.fragments[ oldIndex ];
                by = newIndex - oldIndex;
                oldKeypath = section.keypath + '.' + oldIndex;
                newKeypath = section.keypath + '.' + newIndex;
                fragment.reassign( section.descriptor.i, oldIndex, newIndex, by, oldKeypath, newKeypath );
                reassignedFragments[ newIndex ] = fragment;
            } );
            while ( fragment = toTeardown.pop() ) {
                fragment.teardown( true );
            }
            // If nothing changed with the existing fragments, then we start adding
            // new fragments at the end...
            if ( firstChange === undefined ) {
                firstChange = this.length;
            }
            this.length = newLength = this.root.get( this.keypath ).length;
            if ( newLength === firstChange ) {
                // ...unless there are no new fragments to add
                return;
            }
            // Prepare new fragment options
            fragmentOptions = {
                descriptor: this.descriptor.f,
                root: this.root,
                pNode: parentFragment.pNode,
                owner: this
            };
            if ( this.descriptor.i ) {
                fragmentOptions.indexRef = this.descriptor.i;
            }
            // Add as many new fragments as we need to, or add back existing
            // (detached) fragments
            for ( i = firstChange; i < newLength; i += 1 ) {
                // is this an existing fragment?
                if ( fragment = reassignedFragments[ i ] ) {
                    this.docFrag.appendChild( fragment.detach( false ) );
                } else {
                    fragmentOptions.context = this.keypath + '.' + i;
                    fragmentOptions.index = i;
                    fragment = this.createFragment( fragmentOptions );
                }
                this.fragments[ i ] = fragment;
            }
            // reinsert fragment
            nextNode = parentFragment.findNextNode( this );
            parentFragment.pNode.insertBefore( this.docFrag, nextNode );
        };
    }();

    var render_shared_updateSection = function( isArray, isObject ) {

        return function updateSection( section, value ) {
            var fragmentOptions = {
                descriptor: section.descriptor.f,
                root: section.root,
                pNode: section.parentFragment.pNode,
                pElement: section.parentFragment.pElement,
                owner: section
            };
            // if section is inverted, only check for truthiness/falsiness
            if ( section.descriptor.n ) {
                updateConditionalSection( section, value, true, fragmentOptions );
                return;
            }
            // otherwise we need to work out what sort of section we're dealing with
            // if value is an array, or an object with an index reference, iterate through
            if ( isArray( value ) ) {
                updateListSection( section, value, fragmentOptions );
            } else if ( isObject( value ) || typeof value === 'function' ) {
                if ( section.descriptor.i ) {
                    updateListObjectSection( section, value, fragmentOptions );
                } else {
                    updateContextSection( section, fragmentOptions );
                }
            } else {
                updateConditionalSection( section, value, false, fragmentOptions );
            }
        };

        function updateListSection( section, value, fragmentOptions ) {
            var i, length, fragmentsToRemove;
            length = value.length;
            // if the array is shorter than it was previously, remove items
            if ( length < section.length ) {
                fragmentsToRemove = section.fragments.splice( length, section.length - length );
                while ( fragmentsToRemove.length ) {
                    fragmentsToRemove.pop().teardown( true );
                }
            } else {
                if ( length > section.length ) {
                    // add any new ones
                    for ( i = section.length; i < length; i += 1 ) {
                        // append list item to context stack
                        fragmentOptions.context = section.keypath + '.' + i;
                        fragmentOptions.index = i;
                        if ( section.descriptor.i ) {
                            fragmentOptions.indexRef = section.descriptor.i;
                        }
                        section.fragments[ i ] = section.createFragment( fragmentOptions );
                    }
                }
            }
            section.length = length;
        }

        function updateListObjectSection( section, value, fragmentOptions ) {
            var id, i, hasKey, fragment;
            hasKey = section.hasKey || ( section.hasKey = {} );
            // remove any fragments that should no longer exist
            i = section.fragments.length;
            while ( i-- ) {
                fragment = section.fragments[ i ];
                if ( !( fragment.index in value ) ) {
                    section.fragments[ i ].teardown( true );
                    section.fragments.splice( i, 1 );
                    hasKey[ fragment.index ] = false;
                }
            }
            // add any that haven't been created yet
            for ( id in value ) {
                if ( !hasKey[ id ] ) {
                    fragmentOptions.context = section.keypath + '.' + id;
                    fragmentOptions.index = id;
                    if ( section.descriptor.i ) {
                        fragmentOptions.indexRef = section.descriptor.i;
                    }
                    section.fragments.push( section.createFragment( fragmentOptions ) );
                    hasKey[ id ] = true;
                }
            }
            section.length = section.fragments.length;
        }

        function updateContextSection( section, fragmentOptions ) {
            // ...then if it isn't rendered, render it, adding section.keypath to the context stack
            // (if it is already rendered, then any children dependent on the context stack
            // will update themselves without any prompting)
            if ( !section.length ) {
                // append this section to the context stack
                fragmentOptions.context = section.keypath;
                fragmentOptions.index = 0;
                section.fragments[ 0 ] = section.createFragment( fragmentOptions );
                section.length = 1;
            }
        }

        function updateConditionalSection( section, value, inverted, fragmentOptions ) {
            var doRender, emptyArray, fragmentsToRemove, fragment;
            emptyArray = isArray( value ) && value.length === 0;
            if ( inverted ) {
                doRender = emptyArray || !value;
            } else {
                doRender = value && !emptyArray;
            }
            if ( doRender ) {
                if ( !section.length ) {
                    // no change to context stack
                    fragmentOptions.index = 0;
                    section.fragments[ 0 ] = section.createFragment( fragmentOptions );
                    section.length = 1;
                }
                if ( section.length > 1 ) {
                    fragmentsToRemove = section.fragments.splice( 1 );
                    while ( fragment = fragmentsToRemove.pop() ) {
                        fragment.teardown( true );
                    }
                }
            } else if ( section.length ) {
                section.teardownFragments( true );
                section.length = 0;
            }
        }
    }( utils_isArray, utils_isObject );

    var render_DomFragment_Section_prototype_render = function( isClient, updateSection ) {

        return function DomSection_prototype_render( value ) {
            var nextNode, wrapped;
            // with sections, we need to get the fake value if we have a wrapped object
            if ( wrapped = this.root._wrapped[ this.keypath ] ) {
                value = wrapped.get();
            }
            // prevent sections from rendering multiple times (happens if
            // evaluators evaluate while update is happening)
            if ( this.rendering ) {
                return;
            }
            this.rendering = true;
            updateSection( this, value );
            this.rendering = false;
            // if we have no new nodes to insert (i.e. the section length stayed the
            // same, or shrank), we don't need to go any further
            if ( this.docFrag && !this.docFrag.childNodes.length ) {
                return;
            }
            // if this isn't the initial render, we need to insert any new nodes in
            // the right place
            if ( !this.initialising && isClient ) {
                // Normally this is just a case of finding the next node, and inserting
                // items before it...
                nextNode = this.parentFragment.findNextNode( this );
                if ( nextNode && nextNode.parentNode === this.parentFragment.pNode ) {
                    this.parentFragment.pNode.insertBefore( this.docFrag, nextNode );
                } else {
                    // TODO could there be a situation in which later nodes could have
                    // been attached to the parent node, i.e. we need to find a sibling
                    // to insert before?
                    this.parentFragment.pNode.appendChild( this.docFrag );
                }
            }
        };
    }( config_isClient, render_shared_updateSection );

    var render_DomFragment_Section_reassignFragments = function( section, start, end, by ) {
        var i, fragment, indexRef, oldKeypath, newKeypath;
        indexRef = section.descriptor.i;
        for ( i = start; i < end; i += 1 ) {
            fragment = section.fragments[ i ];
            oldKeypath = section.keypath + '.' + ( i - by );
            newKeypath = section.keypath + '.' + i;
            // change the fragment index
            fragment.index = i;
            fragment.reassign( indexRef, i, oldKeypath, newKeypath );
        }
    };

    var render_DomFragment_Section_prototype_splice = function( reassignFragments ) {

        return function( spliceSummary ) {
            var section = this,
                balance, start, insertStart, insertEnd, spliceArgs;
            balance = spliceSummary.balance;
            if ( !balance ) {
                // The array length hasn't changed - we don't need to add or remove anything
                return;
            }
            start = spliceSummary.start;
            section.length += balance;
            // If more items were removed from the array than added, we tear down
            // the excess fragments and remove them...
            if ( balance < 0 ) {
                section.fragments.splice( start, -balance ).forEach( teardown );
                // Reassign fragments after the ones we've just removed
                reassignFragments( section, start, section.length, balance );
                // Nothing more to do
                return;
            }
            // ...otherwise we need to add some things to the DOM.
            insertStart = start + spliceSummary.removed;
            insertEnd = start + spliceSummary.added;
            // Make room for the new fragments by doing a splice that simulates
            // what happened to the data array
            spliceArgs = [
                insertStart,
                0
            ];
            spliceArgs.length += balance;
            section.fragments.splice.apply( section.fragments, spliceArgs );
            // Reassign existing fragments at the end of the array
            reassignFragments( section, insertEnd, section.length, balance );
            // Create the new ones
            renderNewFragments( section, insertStart, insertEnd );
        };

        function teardown( fragment ) {
            fragment.teardown( true );
        }

        function renderNewFragments( section, start, end ) {
            var fragmentOptions, i, insertionPoint;
            section.rendering = true;
            fragmentOptions = {
                descriptor: section.descriptor.f,
                root: section.root,
                pNode: section.parentFragment.pNode,
                owner: section,
                indexRef: section.descriptor.i
            };
            for ( i = start; i < end; i += 1 ) {
                fragmentOptions.context = section.keypath + '.' + i;
                fragmentOptions.index = i;
                section.fragments[ i ] = section.createFragment( fragmentOptions );
            }
            // Figure out where these new nodes need to be inserted
            insertionPoint = section.fragments[ end ] ? section.fragments[ end ].firstNode() : section.parentFragment.findNextNode( section );
            // Append docfrag in front of insertion point
            section.parentFragment.pNode.insertBefore( section.docFrag, insertionPoint );
            section.rendering = false;
        }
    }( render_DomFragment_Section_reassignFragments );

    var render_DomFragment_Section__Section = function( types, Mustache, merge, render, splice, teardown, circular ) {

        var DomSection, DomFragment;
        circular.push( function() {
            DomFragment = circular.DomFragment;
        } );
        // Section
        DomSection = function( options, docFrag ) {
            this.type = types.SECTION;
            this.inverted = !! options.descriptor.n;
            this.fragments = [];
            this.length = 0;
            // number of times this section is rendered
            if ( docFrag ) {
                this.docFrag = document.createDocumentFragment();
            }
            this.initialising = true;
            Mustache.init( this, options );
            if ( docFrag ) {
                docFrag.appendChild( this.docFrag );
            }
            this.initialising = false;
        };
        DomSection.prototype = {
            update: Mustache.update,
            resolve: Mustache.resolve,
            reassign: Mustache.reassign,
            splice: splice,
            merge: merge,
            detach: function() {
                var i, len;
                if ( this.docFrag ) {
                    len = this.fragments.length;
                    for ( i = 0; i < len; i += 1 ) {
                        this.docFrag.appendChild( this.fragments[ i ].detach() );
                    }
                    return this.docFrag;
                }
            },
            teardown: function( destroy ) {
                this.teardownFragments( destroy );
                teardown( this );
            },
            firstNode: function() {
                if ( this.fragments[ 0 ] ) {
                    return this.fragments[ 0 ].firstNode();
                }
                return this.parentFragment.findNextNode( this );
            },
            findNextNode: function( fragment ) {
                if ( this.fragments[ fragment.index + 1 ] ) {
                    return this.fragments[ fragment.index + 1 ].firstNode();
                }
                return this.parentFragment.findNextNode( this );
            },
            teardownFragments: function( destroy ) {
                var fragment;
                while ( fragment = this.fragments.shift() ) {
                    fragment.teardown( destroy );
                }
            },
            render: render,
            createFragment: function( options ) {
                var fragment = new DomFragment( options );
                if ( this.docFrag ) {
                    this.docFrag.appendChild( fragment.docFrag );
                }
                return fragment;
            },
            toString: function() {
                var str, i, len;
                str = '';
                i = 0;
                len = this.length;
                for ( i = 0; i < len; i += 1 ) {
                    str += this.fragments[ i ].toString();
                }
                return str;
            },
            find: function( selector ) {
                var i, len, queryResult;
                len = this.fragments.length;
                for ( i = 0; i < len; i += 1 ) {
                    if ( queryResult = this.fragments[ i ].find( selector ) ) {
                        return queryResult;
                    }
                }
                return null;
            },
            findAll: function( selector, query ) {
                var i, len;
                len = this.fragments.length;
                for ( i = 0; i < len; i += 1 ) {
                    this.fragments[ i ].findAll( selector, query );
                }
            },
            findComponent: function( selector ) {
                var i, len, queryResult;
                len = this.fragments.length;
                for ( i = 0; i < len; i += 1 ) {
                    if ( queryResult = this.fragments[ i ].findComponent( selector ) ) {
                        return queryResult;
                    }
                }
                return null;
            },
            findAllComponents: function( selector, query ) {
                var i, len;
                len = this.fragments.length;
                for ( i = 0; i < len; i += 1 ) {
                    this.fragments[ i ].findAllComponents( selector, query );
                }
            }
        };
        return DomSection;
    }( config_types, render_shared_Mustache__Mustache, render_DomFragment_Section_prototype_merge, render_DomFragment_Section_prototype_render, render_DomFragment_Section_prototype_splice, shared_teardown, circular );

    var render_DomFragment_Triple = function( types, matches, Mustache, insertHtml, teardown ) {

        var DomTriple = function( options, docFrag ) {
            this.type = types.TRIPLE;
            if ( docFrag ) {
                this.nodes = [];
                this.docFrag = document.createDocumentFragment();
            }
            this.initialising = true;
            Mustache.init( this, options );
            if ( docFrag ) {
                docFrag.appendChild( this.docFrag );
            }
            this.initialising = false;
        };
        DomTriple.prototype = {
            update: Mustache.update,
            resolve: Mustache.resolve,
            reassign: Mustache.reassign,
            detach: function() {
                var len, i;
                if ( this.docFrag ) {
                    len = this.nodes.length;
                    for ( i = 0; i < len; i += 1 ) {
                        this.docFrag.appendChild( this.nodes[ i ] );
                    }
                    return this.docFrag;
                }
            },
            teardown: function( destroy ) {
                if ( destroy ) {
                    this.detach();
                    this.docFrag = this.nodes = null;
                }
                teardown( this );
            },
            firstNode: function() {
                if ( this.nodes[ 0 ] ) {
                    return this.nodes[ 0 ];
                }
                return this.parentFragment.findNextNode( this );
            },
            render: function( html ) {
                var node, pNode;
                if ( !this.nodes ) {
                    // looks like we're in a server environment...
                    // nothing to see here, move along
                    return;
                }
                // remove existing nodes
                while ( this.nodes.length ) {
                    node = this.nodes.pop();
                    node.parentNode.removeChild( node );
                }
                if ( !html ) {
                    this.nodes = [];
                    return;
                }
                // get new nodes
                pNode = this.parentFragment.pNode;
                this.nodes = insertHtml( html, pNode.tagName, pNode.namespaceURI, this.docFrag );
                if ( !this.initialising ) {
                    pNode.insertBefore( this.docFrag, this.parentFragment.findNextNode( this ) );
                }
                // Special case - we're inserting the contents of a <select>
                if ( pNode.tagName === 'SELECT' && pNode._ractive && pNode._ractive.binding ) {
                    pNode._ractive.binding.update();
                }
            },
            toString: function() {
                return this.value != undefined ? this.value : '';
            },
            find: function( selector ) {
                var i, len, node, queryResult;
                len = this.nodes.length;
                for ( i = 0; i < len; i += 1 ) {
                    node = this.nodes[ i ];
                    if ( node.nodeType !== 1 ) {
                        continue;
                    }
                    if ( matches( node, selector ) ) {
                        return node;
                    }
                    if ( queryResult = node.querySelector( selector ) ) {
                        return queryResult;
                    }
                }
                return null;
            },
            findAll: function( selector, queryResult ) {
                var i, len, node, queryAllResult, numNodes, j;
                len = this.nodes.length;
                for ( i = 0; i < len; i += 1 ) {
                    node = this.nodes[ i ];
                    if ( node.nodeType !== 1 ) {
                        continue;
                    }
                    if ( matches( node, selector ) ) {
                        queryResult.push( node );
                    }
                    if ( queryAllResult = node.querySelectorAll( selector ) ) {
                        numNodes = queryAllResult.length;
                        for ( j = 0; j < numNodes; j += 1 ) {
                            queryResult.push( queryAllResult[ j ] );
                        }
                    }
                }
            }
        };
        return DomTriple;
    }( config_types, utils_matches, render_shared_Mustache__Mustache, render_DomFragment_shared_insertHtml, shared_teardown );

    var render_DomFragment_Element_initialise_getElementNamespace = function( namespaces ) {

        return function( descriptor, parentNode ) {
            // if the element has an xmlns attribute, use that
            if ( descriptor.a && descriptor.a.xmlns ) {
                return descriptor.a.xmlns;
            }
            // otherwise, use the svg namespace if this is an svg element, or inherit namespace from parent
            return descriptor.e === 'svg' ? namespaces.svg : parentNode.namespaceURI || namespaces.html;
        };
    }( config_namespaces );

    var render_DomFragment_shared_enforceCase = function() {

        var svgCamelCaseElements, svgCamelCaseAttributes, createMap, map;
        svgCamelCaseElements = 'altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath vkern'.split( ' ' );
        svgCamelCaseAttributes = 'attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan'.split( ' ' );
        createMap = function( items ) {
            var map = {}, i = items.length;
            while ( i-- ) {
                map[ items[ i ].toLowerCase() ] = items[ i ];
            }
            return map;
        };
        map = createMap( svgCamelCaseElements.concat( svgCamelCaseAttributes ) );
        return function( elementName ) {
            var lowerCaseElementName = elementName.toLowerCase();
            return map[ lowerCaseElementName ] || lowerCaseElementName;
        };
    }();

    var render_DomFragment_Attribute_helpers_determineNameAndNamespace = function( namespaces, enforceCase ) {

        return function( attribute, name ) {
            var colonIndex, namespacePrefix;
            // are we dealing with a namespaced attribute, e.g. xlink:href?
            colonIndex = name.indexOf( ':' );
            if ( colonIndex !== -1 ) {
                // looks like we are, yes...
                namespacePrefix = name.substr( 0, colonIndex );
                // ...unless it's a namespace *declaration*, which we ignore (on the assumption
                // that only valid namespaces will be used)
                if ( namespacePrefix !== 'xmlns' ) {
                    name = name.substring( colonIndex + 1 );
                    attribute.name = enforceCase( name );
                    attribute.lcName = attribute.name.toLowerCase();
                    attribute.namespace = namespaces[ namespacePrefix.toLowerCase() ];
                    if ( !attribute.namespace ) {
                        throw 'Unknown namespace ("' + namespacePrefix + '")';
                    }
                    return;
                }
            }
            // SVG attribute names are case sensitive
            attribute.name = attribute.element.namespace !== namespaces.html ? enforceCase( name ) : name;
            attribute.lcName = attribute.name.toLowerCase();
        };
    }( config_namespaces, render_DomFragment_shared_enforceCase );

    var render_DomFragment_Attribute_helpers_setStaticAttribute = function( namespaces ) {

        return function setStaticAttribute( attribute, options ) {
            var node, value = options.value === null ? '' : options.value;
            if ( node = options.pNode ) {
                if ( attribute.namespace ) {
                    node.setAttributeNS( attribute.namespace, options.name, value );
                } else {
                    // is it a style attribute? and are we in a broken POS browser?
                    if ( options.name === 'style' && node.style.setAttribute ) {
                        node.style.setAttribute( 'cssText', value );
                    } else if ( options.name === 'class' && ( !node.namespaceURI || node.namespaceURI === namespaces.html ) ) {
                        node.className = value;
                    } else {
                        node.setAttribute( options.name, value );
                    }
                }
                if ( attribute.name === 'id' ) {
                    options.root.nodes[ options.value ] = node;
                }
                if ( attribute.name === 'value' ) {
                    node._ractive.value = options.value;
                }
            }
            attribute.value = options.value;
        };
    }( config_namespaces );

    var render_DomFragment_Attribute_helpers_determinePropertyName = function( namespaces ) {

        // the property name equivalents for element attributes, where they differ
        // from the lowercased attribute name
        var propertyNames = {
            'accept-charset': 'acceptCharset',
            accesskey: 'accessKey',
            bgcolor: 'bgColor',
            'class': 'className',
            codebase: 'codeBase',
            colspan: 'colSpan',
            contenteditable: 'contentEditable',
            datetime: 'dateTime',
            dirname: 'dirName',
            'for': 'htmlFor',
            'http-equiv': 'httpEquiv',
            ismap: 'isMap',
            maxlength: 'maxLength',
            novalidate: 'noValidate',
            pubdate: 'pubDate',
            readonly: 'readOnly',
            rowspan: 'rowSpan',
            tabindex: 'tabIndex',
            usemap: 'useMap'
        };
        return function( attribute, options ) {
            var propertyName;
            if ( attribute.pNode && !attribute.namespace && ( !options.pNode.namespaceURI || options.pNode.namespaceURI === namespaces.html ) ) {
                propertyName = propertyNames[ attribute.name ] || attribute.name;
                if ( options.pNode[ propertyName ] !== undefined ) {
                    attribute.propertyName = propertyName;
                }
                // is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
                // node.selected = true rather than node.setAttribute( 'selected', '' )
                if ( typeof options.pNode[ propertyName ] === 'boolean' || propertyName === 'value' ) {
                    attribute.useProperty = true;
                }
            }
        };
    }( config_namespaces );

    var render_DomFragment_Attribute_helpers_getInterpolator = function( types ) {

        return function getInterpolator( attribute ) {
            var items, item;
            items = attribute.fragment.items;
            if ( items.length !== 1 ) {
                return;
            }
            item = items[ 0 ];
            if ( item.type !== types.INTERPOLATOR || !item.keypath && !item.ref ) {
                return;
            }
            return item;
        };
    }( config_types );

    var utils_arrayContentsMatch = function( isArray ) {

        return function( a, b ) {
            var i;
            if ( !isArray( a ) || !isArray( b ) ) {
                return false;
            }
            if ( a.length !== b.length ) {
                return false;
            }
            i = a.length;
            while ( i-- ) {
                if ( a[ i ] !== b[ i ] ) {
                    return false;
                }
            }
            return true;
        };
    }( utils_isArray );

    var render_DomFragment_Attribute_prototype_bind = function( runloop, warn, arrayContentsMatch, getValueFromCheckboxes, get, set ) {

        var singleMustacheError = 'For two-way binding to work, attribute value must be a single interpolator (e.g. value="{{foo}}")',
            expressionError = 'You cannot set up two-way binding against an expression ',
            bindAttribute, updateModel, getOptions, update, getBinding, inheritProperties, MultipleSelectBinding, SelectBinding, RadioNameBinding, CheckboxNameBinding, CheckedBinding, FileListBinding, ContentEditableBinding, GenericBinding;
        bindAttribute = function() {
            var node = this.pNode,
                interpolator, binding, bindings;
            interpolator = this.interpolator;
            if ( !interpolator ) {
                warn( singleMustacheError );
                return false;
            }
            if ( interpolator.keypath && interpolator.keypath.substr === '${' ) {
                warn( expressionError + interpolator.keypath );
                return false;
            }
            // Hmmm. Not sure if this is the best way to handle this ambiguity...
            //
            // Let's say we were given `value="{{bar}}"`. If the context stack was
            // context stack was `["foo"]`, and `foo.bar` *wasn't* `undefined`, the
            // keypath would be `foo.bar`. Then, any user input would result in
            // `foo.bar` being updated.
            //
            // If, however, `foo.bar` *was* undefined, and so was `bar`, we would be
            // left with an unresolved partial keypath - so we are forced to make an
            // assumption. That assumption is that the input in question should
            // be forced to resolve to `bar`, and any user input would affect `bar`
            // and not `foo.bar`.
            //
            // Did that make any sense? No? Oh. Sorry. Well the moral of the story is
            // be explicit when using two-way data-binding about what keypath you're
            // updating. Using it in lists is probably a recipe for confusion...
            if ( !interpolator.keypath ) {
                interpolator.resolve( interpolator.descriptor.r );
            }
            this.keypath = interpolator.keypath;
            binding = getBinding( this );
            if ( !binding ) {
                return false;
            }
            node._ractive.binding = this.element.binding = binding;
            this.twoway = true;
            // register this with the root, so that we can force an update later
            bindings = this.root._twowayBindings[ this.keypath ] || ( this.root._twowayBindings[ this.keypath ] = [] );
            bindings.push( binding );
            return true;
        };
        // This is the handler for DOM events that would lead to a change in the model
        // (i.e. change, sometimes, input, and occasionally click and keyup)
        updateModel = function() {
            runloop.start( this._ractive.root );
            this._ractive.binding.update();
            runloop.end();
        };
        getOptions = {
            evaluateWrapped: true
        };
        update = function() {
            var value = get( this._ractive.root, this._ractive.binding.keypath, getOptions );
            this.value = value == undefined ? '' : value;
        };
        getBinding = function( attribute ) {
            var node = attribute.pNode;
            if ( node.tagName === 'SELECT' ) {
                return node.multiple ? new MultipleSelectBinding( attribute, node ) : new SelectBinding( attribute, node );
            }
            if ( node.type === 'checkbox' || node.type === 'radio' ) {
                if ( attribute.propertyName === 'name' ) {
                    if ( node.type === 'checkbox' ) {
                        return new CheckboxNameBinding( attribute, node );
                    }
                    if ( node.type === 'radio' ) {
                        return new RadioNameBinding( attribute, node );
                    }
                }
                if ( attribute.propertyName === 'checked' ) {
                    return new CheckedBinding( attribute, node );
                }
                return null;
            }
            if ( attribute.lcName !== 'value' ) {
                throw new Error( 'Attempted to set up an illegal two-way binding. This error is unexpected - if you can, please file an issue at https://github.com/RactiveJS/Ractive, or contact @RactiveJS on Twitter. Thanks!' );
            }
            if ( node.type === 'file' ) {
                return new FileListBinding( attribute, node );
            }
            if ( node.getAttribute( 'contenteditable' ) ) {
                return new ContentEditableBinding( attribute, node );
            }
            return new GenericBinding( attribute, node );
        };
        MultipleSelectBinding = function( attribute, node ) {
            var valueFromModel;
            inheritProperties( this, attribute, node );
            node.addEventListener( 'change', updateModel, false );
            valueFromModel = get( this.root, this.keypath );
            if ( valueFromModel === undefined ) {
                // get value from DOM, if possible
                this.update();
            }
        };
        MultipleSelectBinding.prototype = {
            value: function() {
                var selectedValues, options, i, len, option, optionValue;
                selectedValues = [];
                options = this.node.options;
                len = options.length;
                for ( i = 0; i < len; i += 1 ) {
                    option = options[ i ];
                    if ( option.selected ) {
                        optionValue = option._ractive ? option._ractive.value : option.value;
                        selectedValues.push( optionValue );
                    }
                }
                return selectedValues;
            },
            update: function() {
                var attribute, previousValue, value;
                attribute = this.attr;
                previousValue = attribute.value;
                value = this.value();
                if ( previousValue === undefined || !arrayContentsMatch( value, previousValue ) ) {
                    // either length or contents have changed, so we update the model
                    runloop.addBinding( attribute );
                    attribute.value = value;
                    set( this.root, this.keypath, value );
                    runloop.trigger();
                }
                return this;
            },
            deferUpdate: function() {
                if ( this.deferred === true ) {
                    return;
                }
                // TODO we're hijacking an existing bit of functionality here...
                // the whole deferred updates thing could use a spring clean
                runloop.addAttribute( this );
                this.deferred = true;
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
            }
        };
        SelectBinding = function( attribute, node ) {
            var valueFromModel;
            inheritProperties( this, attribute, node );
            node.addEventListener( 'change', updateModel, false );
            valueFromModel = get( this.root, this.keypath );
            if ( valueFromModel === undefined ) {
                // get value from DOM, if possible
                this.update();
            }
        };
        SelectBinding.prototype = {
            value: function() {
                var options, i, len, option, optionValue;
                options = this.node.options;
                len = options.length;
                for ( i = 0; i < len; i += 1 ) {
                    option = options[ i ];
                    if ( options[ i ].selected ) {
                        optionValue = option._ractive ? option._ractive.value : option.value;
                        return optionValue;
                    }
                }
            },
            update: function() {
                var value = this.value();
                runloop.addBinding( this.attr );
                this.attr.value = value;
                set( this.root, this.keypath, value );
                runloop.trigger();
                return this;
            },
            deferUpdate: function() {
                if ( this.deferred === true ) {
                    return;
                }
                // TODO we're hijacking an existing bit of functionality here...
                // the whole deferred updates thing could use a spring clean
                runloop.addAttribute( this );
                this.deferred = true;
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
            }
        };
        RadioNameBinding = function( attribute, node ) {
            var valueFromModel;
            this.radioName = true;
            // so that updateModel knows what to do with this
            inheritProperties( this, attribute, node );
            node.name = '{{' + attribute.keypath + '}}';
            node.addEventListener( 'change', updateModel, false );
            if ( node.attachEvent ) {
                node.addEventListener( 'click', updateModel, false );
            }
            valueFromModel = get( this.root, this.keypath );
            if ( valueFromModel !== undefined ) {
                node.checked = valueFromModel == node._ractive.value;
            } else {
                runloop.addRadio( this );
            }
        };
        RadioNameBinding.prototype = {
            value: function() {
                return this.node._ractive ? this.node._ractive.value : this.node.value;
            },
            update: function() {
                var node = this.node;
                if ( node.checked ) {
                    runloop.addBinding( this.attr );
                    set( this.root, this.keypath, this.value() );
                    runloop.trigger();
                }
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
                this.node.removeEventListener( 'click', updateModel, false );
            }
        };
        CheckboxNameBinding = function( attribute, node ) {
            var valueFromModel, checked;
            this.checkboxName = true;
            // so that updateModel knows what to do with this
            inheritProperties( this, attribute, node );
            node.name = '{{' + this.keypath + '}}';
            node.addEventListener( 'change', updateModel, false );
            // in case of IE emergency, bind to click event as well
            if ( node.attachEvent ) {
                node.addEventListener( 'click', updateModel, false );
            }
            valueFromModel = get( this.root, this.keypath );
            // if the model already specifies this value, check/uncheck accordingly
            if ( valueFromModel !== undefined ) {
                checked = valueFromModel.indexOf( node._ractive.value ) !== -1;
                node.checked = checked;
            } else {
                runloop.addCheckbox( this );
            }
        };
        CheckboxNameBinding.prototype = {
            changed: function() {
                return this.node.checked !== !! this.checked;
            },
            update: function() {
                this.checked = this.node.checked;
                runloop.addBinding( this.attr );
                set( this.root, this.keypath, getValueFromCheckboxes( this.root, this.keypath ) );
                runloop.trigger();
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
                this.node.removeEventListener( 'click', updateModel, false );
            }
        };
        CheckedBinding = function( attribute, node ) {
            inheritProperties( this, attribute, node );
            node.addEventListener( 'change', updateModel, false );
            if ( node.attachEvent ) {
                node.addEventListener( 'click', updateModel, false );
            }
        };
        CheckedBinding.prototype = {
            value: function() {
                return this.node.checked;
            },
            update: function() {
                runloop.addBinding( this.attr );
                set( this.root, this.keypath, this.value() );
                runloop.trigger();
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
                this.node.removeEventListener( 'click', updateModel, false );
            }
        };
        FileListBinding = function( attribute, node ) {
            inheritProperties( this, attribute, node );
            node.addEventListener( 'change', updateModel, false );
        };
        FileListBinding.prototype = {
            value: function() {
                return this.attr.pNode.files;
            },
            update: function() {
                set( this.attr.root, this.attr.keypath, this.value() );
                runloop.trigger();
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
            }
        };
        ContentEditableBinding = function( attribute, node ) {
            inheritProperties( this, attribute, node );
            node.addEventListener( 'change', updateModel, false );
            if ( !this.root.lazy ) {
                node.addEventListener( 'input', updateModel, false );
                if ( node.attachEvent ) {
                    node.addEventListener( 'keyup', updateModel, false );
                }
            }
        };
        ContentEditableBinding.prototype = {
            update: function() {
                runloop.addBinding( this.attr );
                set( this.root, this.keypath, this.node.innerHTML );
                runloop.trigger();
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
                this.node.removeEventListener( 'input', updateModel, false );
                this.node.removeEventListener( 'keyup', updateModel, false );
            }
        };
        GenericBinding = function( attribute, node ) {
            inheritProperties( this, attribute, node );
            node.addEventListener( 'change', updateModel, false );
            if ( !this.root.lazy ) {
                node.addEventListener( 'input', updateModel, false );
                if ( node.attachEvent ) {
                    node.addEventListener( 'keyup', updateModel, false );
                }
            }
            this.node.addEventListener( 'blur', update, false );
        };
        GenericBinding.prototype = {
            value: function() {
                var value = this.attr.pNode.value;
                // if the value is numeric, treat it as a number. otherwise don't
                if ( +value + '' === value && value.indexOf( 'e' ) === -1 ) {
                    value = +value;
                }
                return value;
            },
            update: function() {
                var attribute = this.attr,
                    value = this.value();
                runloop.addBinding( attribute );
                set( attribute.root, attribute.keypath, value );
                runloop.trigger();
            },
            teardown: function() {
                this.node.removeEventListener( 'change', updateModel, false );
                this.node.removeEventListener( 'input', updateModel, false );
                this.node.removeEventListener( 'keyup', updateModel, false );
                this.node.removeEventListener( 'blur', update, false );
            }
        };
        inheritProperties = function( binding, attribute, node ) {
            binding.attr = attribute;
            binding.node = node;
            binding.root = attribute.root;
            binding.keypath = attribute.keypath;
        };
        return bindAttribute;
    }( global_runloop, utils_warn, utils_arrayContentsMatch, shared_getValueFromCheckboxes, shared_get__get, shared_set );

    var render_DomFragment_Attribute_prototype_update = function( runloop, namespaces, isArray ) {

        var updateAttribute, updateFileInputValue, deferSelect, initSelect, updateSelect, updateMultipleSelect, updateRadioName, updateCheckboxName, updateIEStyleAttribute, updateClassName, updateContentEditableValue, updateEverythingElse;
        // There are a few special cases when it comes to updating attributes. For this reason,
        // the prototype .update() method points to updateAttribute, which waits until the
        // attribute has finished initialising, then replaces the prototype method with a more
        // suitable one. That way, we save ourselves doing a bunch of tests on each call
        updateAttribute = function() {
            var node;
            if ( !this.ready ) {
                return this;
            }
            node = this.pNode;
            // special case - selects
            if ( node.tagName === 'SELECT' && this.lcName === 'value' ) {
                this.update = deferSelect;
                this.deferredUpdate = initSelect;
                // we don't know yet if it's a select-one or select-multiple
                return this.update();
            }
            // special case - <input type='file' value='{{fileList}}'>
            if ( this.isFileInputValue ) {
                this.update = updateFileInputValue;
                // save ourselves the trouble next time
                return this;
            }
            // special case - <input type='radio' name='{{twoway}}' value='foo'>
            if ( this.twoway && this.lcName === 'name' ) {
                if ( node.type === 'radio' ) {
                    this.update = updateRadioName;
                    return this.update();
                }
                if ( node.type === 'checkbox' ) {
                    this.update = updateCheckboxName;
                    return this.update();
                }
            }
            // special case - style attributes in Internet Exploder
            if ( this.lcName === 'style' && node.style.setAttribute ) {
                this.update = updateIEStyleAttribute;
                return this.update();
            }
            // special case - class names. IE fucks things up, again
            if ( this.lcName === 'class' && ( !node.namespaceURI || node.namespaceURI === namespaces.html ) ) {
                this.update = updateClassName;
                return this.update();
            }
            // special case - contenteditable
            if ( node.getAttribute( 'contenteditable' ) && this.lcName === 'value' ) {
                this.update = updateContentEditableValue;
                return this.update();
            }
            this.update = updateEverythingElse;
            return this.update();
        };
        updateFileInputValue = function() {
            return this;
        };
        initSelect = function() {
            // we're now in a position to decide whether this is a select-one or select-multiple
            this.deferredUpdate = this.pNode.multiple ? updateMultipleSelect : updateSelect;
            this.deferredUpdate();
        };
        deferSelect = function() {
            // because select values depend partly on the values of their children, and their
            // children may be entering and leaving the DOM, we wait until updates are
            // complete before updating
            runloop.addSelectValue( this );
            return this;
        };
        updateSelect = function() {
            var value = this.fragment.getValue(),
                options, option, optionValue, i;
            this.value = this.pNode._ractive.value = value;
            options = this.pNode.options;
            i = options.length;
            while ( i-- ) {
                option = options[ i ];
                optionValue = option._ractive ? option._ractive.value : option.value;
                // options inserted via a triple don't have _ractive
                if ( optionValue == value ) {
                    // double equals as we may be comparing numbers with strings
                    option.selected = true;
                    return this;
                }
            }
            // if we're still here, it means the new value didn't match any of the options...
            // TODO figure out what to do in this situation
            return this;
        };
        updateMultipleSelect = function() {
            var value = this.fragment.getValue(),
                options, i, option, optionValue;
            if ( !isArray( value ) ) {
                value = [ value ];
            }
            options = this.pNode.options;
            i = options.length;
            while ( i-- ) {
                option = options[ i ];
                optionValue = option._ractive ? option._ractive.value : option.value;
                // options inserted via a triple don't have _ractive
                option.selected = value.indexOf( optionValue ) !== -1;
            }
            this.value = value;
            return this;
        };
        updateRadioName = function() {
            var node, value;
            node = this.pNode;
            value = this.fragment.getValue();
            node.checked = value == node._ractive.value;
            return this;
        };
        updateCheckboxName = function() {
            var node, value;
            node = this.pNode;
            value = this.fragment.getValue();
            if ( !isArray( value ) ) {
                node.checked = value == node._ractive.value;
                return this;
            }
            node.checked = value.indexOf( node._ractive.value ) !== -1;
            return this;
        };
        updateIEStyleAttribute = function() {
            var node, value;
            node = this.pNode;
            value = this.fragment.getValue();
            if ( value === undefined ) {
                value = '';
            }
            if ( value !== this.value ) {
                node.style.setAttribute( 'cssText', value );
                this.value = value;
            }
            return this;
        };
        updateClassName = function() {
            var node, value;
            node = this.pNode;
            value = this.fragment.getValue();
            if ( value === undefined ) {
                value = '';
            }
            if ( value !== this.value ) {
                node.className = value;
                this.value = value;
            }
            return this;
        };
        updateContentEditableValue = function() {
            var node, value;
            node = this.pNode;
            value = this.fragment.getValue();
            if ( value === undefined ) {
                value = '';
            }
            if ( value !== this.value ) {
                if ( !this.active ) {
                    node.innerHTML = value;
                }
                this.value = value;
            }
            return this;
        };
        updateEverythingElse = function() {
            var node, value, binding;
            node = this.pNode;
            value = this.fragment.getValue();
            // store actual value, so it doesn't get coerced to a string
            if ( this.isValueAttribute ) {
                node._ractive.value = value;
            }
            if ( value == undefined ) {
                value = '';
            }
            if ( value !== this.value ) {
                if ( this.useProperty ) {
                    // with two-way binding, only update if the change wasn't initiated by the user
                    // otherwise the cursor will often be sent to the wrong place
                    if ( !this.active ) {
                        node[ this.propertyName ] = value;
                    }
                    // special case - a selected option whose select element has two-way binding
                    if ( node.tagName === 'OPTION' && node.selected && ( binding = this.element.select.binding ) ) {
                        binding.update();
                    }
                    this.value = value;
                    return this;
                }
                if ( this.namespace ) {
                    node.setAttributeNS( this.namespace, this.name, value );
                    this.value = value;
                    return this;
                }
                if ( this.lcName === 'id' ) {
                    if ( this.value !== undefined ) {
                        this.root.nodes[ this.value ] = undefined;
                    }
                    this.root.nodes[ value ] = node;
                }
                node.setAttribute( this.name, value );
                this.value = value;
            }
            return this;
        };
        return updateAttribute;
    }( global_runloop, config_namespaces, utils_isArray );

    var parse_Tokenizer_utils_getStringMatch = function( string ) {
        var substr;
        substr = this.str.substr( this.pos, string.length );
        if ( substr === string ) {
            this.pos += string.length;
            return string;
        }
        return null;
    };

    var parse_Tokenizer_utils_allowWhitespace = function() {

        var leadingWhitespace = /^\s+/;
        return function() {
            var match = leadingWhitespace.exec( this.remaining() );
            if ( !match ) {
                return null;
            }
            this.pos += match[ 0 ].length;
            return match[ 0 ];
        };
    }();

    var parse_Tokenizer_utils_makeRegexMatcher = function( regex ) {
        return function( tokenizer ) {
            var match = regex.exec( tokenizer.str.substring( tokenizer.pos ) );
            if ( !match ) {
                return null;
            }
            tokenizer.pos += match[ 0 ].length;
            return match[ 1 ] || match[ 0 ];
        };
    };

    var parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral_makeQuotedStringMatcher = function( makeRegexMatcher ) {

        var getStringMiddle, getEscapeSequence, getLineContinuation;
        // Match one or more characters until: ", ', \, or EOL/EOF.
        // EOL/EOF is written as (?!.) (meaning there's no non-newline char next).
        getStringMiddle = makeRegexMatcher( /^(?=.)[^"'\\]+?(?:(?!.)|(?=["'\\]))/ );
        // Match one escape sequence, including the backslash.
        getEscapeSequence = makeRegexMatcher( /^\\(?:['"\\bfnrt]|0(?![0-9])|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|(?=.)[^ux0-9])/ );
        // Match one ES5 line continuation (backslash + line terminator).
        getLineContinuation = makeRegexMatcher( /^\\(?:\r\n|[\u000A\u000D\u2028\u2029])/ );
        // Helper for defining getDoubleQuotedString and getSingleQuotedString.
        return function( okQuote ) {
            return function( tokenizer ) {
                var start, literal, done, next;
                start = tokenizer.pos;
                literal = '"';
                done = false;
                while ( !done ) {
                    next = getStringMiddle( tokenizer ) || getEscapeSequence( tokenizer ) || tokenizer.getStringMatch( okQuote );
                    if ( next ) {
                        if ( next === '"' ) {
                            literal += '\\"';
                        } else if ( next === '\\\'' ) {
                            literal += '\'';
                        } else {
                            literal += next;
                        }
                    } else {
                        next = getLineContinuation( tokenizer );
                        if ( next ) {
                            // convert \(newline-like) into a \u escape, which is allowed in JSON
                            literal += '\\u' + ( '000' + next.charCodeAt( 1 ).toString( 16 ) ).slice( -4 );
                        } else {
                            done = true;
                        }
                    }
                }
                literal += '"';
                // use JSON.parse to interpret escapes
                return JSON.parse( literal );
            };
        };
    }( parse_Tokenizer_utils_makeRegexMatcher );

    var parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral_getSingleQuotedString = function( makeQuotedStringMatcher ) {

        return makeQuotedStringMatcher( '"' );
    }( parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral_makeQuotedStringMatcher );

    var parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral_getDoubleQuotedString = function( makeQuotedStringMatcher ) {

        return makeQuotedStringMatcher( '\'' );
    }( parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral_makeQuotedStringMatcher );

    var parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral__getStringLiteral = function( types, getSingleQuotedString, getDoubleQuotedString ) {

        return function( tokenizer ) {
            var start, string;
            start = tokenizer.pos;
            if ( tokenizer.getStringMatch( '"' ) ) {
                string = getDoubleQuotedString( tokenizer );
                if ( !tokenizer.getStringMatch( '"' ) ) {
                    tokenizer.pos = start;
                    return null;
                }
                return {
                    t: types.STRING_LITERAL,
                    v: string
                };
            }
            if ( tokenizer.getStringMatch( '\'' ) ) {
                string = getSingleQuotedString( tokenizer );
                if ( !tokenizer.getStringMatch( '\'' ) ) {
                    tokenizer.pos = start;
                    return null;
                }
                return {
                    t: types.STRING_LITERAL,
                    v: string
                };
            }
            return null;
        };
    }( config_types, parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral_getSingleQuotedString, parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral_getDoubleQuotedString );

    var parse_Tokenizer_getExpression_getPrimary_getLiteral_getNumberLiteral = function( types, makeRegexMatcher ) {

        // bulletproof number regex from https://gist.github.com/Rich-Harris/7544330
        var getNumber = makeRegexMatcher( /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/ );
        return function( tokenizer ) {
            var result;
            if ( result = getNumber( tokenizer ) ) {
                return {
                    t: types.NUMBER_LITERAL,
                    v: result
                };
            }
            return null;
        };
    }( config_types, parse_Tokenizer_utils_makeRegexMatcher );

    var parse_Tokenizer_getExpression_shared_getName = function( makeRegexMatcher ) {

        return makeRegexMatcher( /^[a-zA-Z_$][a-zA-Z_$0-9]*/ );
    }( parse_Tokenizer_utils_makeRegexMatcher );

    var parse_Tokenizer_getExpression_shared_getKey = function( getStringLiteral, getNumberLiteral, getName ) {

        var identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
        // http://mathiasbynens.be/notes/javascript-properties
        // can be any name, string literal, or number literal
        return function( tokenizer ) {
            var token;
            if ( token = getStringLiteral( tokenizer ) ) {
                return identifier.test( token.v ) ? token.v : '"' + token.v.replace( /"/g, '\\"' ) + '"';
            }
            if ( token = getNumberLiteral( tokenizer ) ) {
                return token.v;
            }
            if ( token = getName( tokenizer ) ) {
                return token;
            }
        };
    }( parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral__getStringLiteral, parse_Tokenizer_getExpression_getPrimary_getLiteral_getNumberLiteral, parse_Tokenizer_getExpression_shared_getName );

    var utils_parseJSON = function( getStringMatch, allowWhitespace, getStringLiteral, getKey ) {

        // simple JSON parser, without the restrictions of JSON parse
        // (i.e. having to double-quote keys).
        //
        // This re-uses logic from the main template parser, albeit
        // messily. Could probably use a cleanup at some point.
        //
        // If passed a hash of values as the second argument, ${placeholders}
        // will be replaced with those values
        var Tokenizer, specials, specialsPattern, numberPattern, placeholderPattern, placeholderAtStartPattern;
        specials = {
            'true': true,
            'false': false,
            'undefined': undefined,
            'null': null
        };
        specialsPattern = new RegExp( '^(?:' + Object.keys( specials ).join( '|' ) + ')' );
        numberPattern = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
        placeholderPattern = /\$\{([^\}]+)\}/g;
        placeholderAtStartPattern = /^\$\{([^\}]+)\}/;
        Tokenizer = function( str, values ) {
            this.str = str;
            this.values = values;
            this.pos = 0;
            this.result = this.getToken();
        };
        Tokenizer.prototype = {
            remaining: function() {
                return this.str.substring( this.pos );
            },
            getStringMatch: getStringMatch,
            getToken: function() {
                this.allowWhitespace();
                return this.getPlaceholder() || this.getSpecial() || this.getNumber() || this.getString() || this.getObject() || this.getArray();
            },
            getPlaceholder: function() {
                var match;
                if ( !this.values ) {
                    return null;
                }
                if ( ( match = placeholderAtStartPattern.exec( this.remaining() ) ) && this.values.hasOwnProperty( match[ 1 ] ) ) {
                    this.pos += match[ 0 ].length;
                    return {
                        v: this.values[ match[ 1 ] ]
                    };
                }
            },
            getSpecial: function() {
                var match;
                if ( match = specialsPattern.exec( this.remaining() ) ) {
                    this.pos += match[ 0 ].length;
                    return {
                        v: specials[ match[ 0 ] ]
                    };
                }
            },
            getNumber: function() {
                var match;
                if ( match = numberPattern.exec( this.remaining() ) ) {
                    this.pos += match[ 0 ].length;
                    return {
                        v: +match[ 0 ]
                    };
                }
            },
            getString: function() {
                var stringLiteral = getStringLiteral( this ),
                    values;
                if ( stringLiteral && ( values = this.values ) ) {
                    return {
                        v: stringLiteral.v.replace( placeholderPattern, function( match, $1 ) {
                            return values[ $1 ] || $1;
                        } )
                    };
                }
                return stringLiteral;
            },
            getObject: function() {
                var result, pair;
                if ( !this.getStringMatch( '{' ) ) {
                    return null;
                }
                result = {};
                while ( pair = getKeyValuePair( this ) ) {
                    result[ pair.key ] = pair.value;
                    this.allowWhitespace();
                    if ( this.getStringMatch( '}' ) ) {
                        return {
                            v: result
                        };
                    }
                    if ( !this.getStringMatch( ',' ) ) {
                        return null;
                    }
                }
                return null;
            },
            getArray: function() {
                var result, valueToken;
                if ( !this.getStringMatch( '[' ) ) {
                    return null;
                }
                result = [];
                while ( valueToken = this.getToken() ) {
                    result.push( valueToken.v );
                    if ( this.getStringMatch( ']' ) ) {
                        return {
                            v: result
                        };
                    }
                    if ( !this.getStringMatch( ',' ) ) {
                        return null;
                    }
                }
                return null;
            },
            allowWhitespace: allowWhitespace
        };

        function getKeyValuePair( tokenizer ) {
            var key, valueToken, pair;
            tokenizer.allowWhitespace();
            key = getKey( tokenizer );
            if ( !key ) {
                return null;
            }
            pair = {
                key: key
            };
            tokenizer.allowWhitespace();
            if ( !tokenizer.getStringMatch( ':' ) ) {
                return null;
            }
            tokenizer.allowWhitespace();
            valueToken = tokenizer.getToken();
            if ( !valueToken ) {
                return null;
            }
            pair.value = valueToken.v;
            return pair;
        }
        return function( str, values ) {
            var tokenizer = new Tokenizer( str, values );
            if ( tokenizer.result ) {
                return {
                    value: tokenizer.result.v,
                    remaining: tokenizer.remaining()
                };
            }
            return null;
        };
    }( parse_Tokenizer_utils_getStringMatch, parse_Tokenizer_utils_allowWhitespace, parse_Tokenizer_getExpression_getPrimary_getLiteral_getStringLiteral__getStringLiteral, parse_Tokenizer_getExpression_shared_getKey );

    var render_StringFragment_Interpolator = function( types, teardown, Mustache ) {

        var StringInterpolator = function( options ) {
            this.type = types.INTERPOLATOR;
            Mustache.init( this, options );
        };
        StringInterpolator.prototype = {
            update: Mustache.update,
            resolve: Mustache.resolve,
            reassign: Mustache.reassign,
            render: function( value ) {
                this.value = value;
                this.parentFragment.bubble();
            },
            teardown: function() {
                teardown( this );
            },
            toString: function() {
                if ( this.value == undefined ) {
                    return '';
                }
                return stringify( this.value );
            }
        };
        return StringInterpolator;

        function stringify( value ) {
            if ( typeof value === 'string' ) {
                return value;
            }
            return JSON.stringify( value );
        }
    }( config_types, shared_teardown, render_shared_Mustache__Mustache );

    var render_StringFragment_Section = function( types, Mustache, updateSection, teardown, circular ) {

        var StringSection, StringFragment;
        circular.push( function() {
            StringFragment = circular.StringFragment;
        } );
        StringSection = function( options ) {
            this.type = types.SECTION;
            this.fragments = [];
            this.length = 0;
            Mustache.init( this, options );
        };
        StringSection.prototype = {
            update: Mustache.update,
            resolve: Mustache.resolve,
            reassign: Mustache.reassign,
            teardown: function() {
                this.teardownFragments();
                teardown( this );
            },
            teardownFragments: function() {
                while ( this.fragments.length ) {
                    this.fragments.shift().teardown();
                }
                this.length = 0;
            },
            bubble: function() {
                this.value = this.fragments.join( '' );
                this.parentFragment.bubble();
            },
            render: function( value ) {
                var wrapped;
                // with sections, we need to get the fake value if we have a wrapped object
                if ( wrapped = this.root._wrapped[ this.keypath ] ) {
                    value = wrapped.get();
                }
                updateSection( this, value );
                this.parentFragment.bubble();
            },
            createFragment: function( options ) {
                return new StringFragment( options );
            },
            toString: function() {
                return this.fragments.join( '' );
            }
        };
        return StringSection;
    }( config_types, render_shared_Mustache__Mustache, render_shared_updateSection, shared_teardown, circular );

    var render_StringFragment_Text = function( types ) {

        var StringText = function( text ) {
            this.type = types.TEXT;
            this.text = text;
        };
        StringText.prototype = {
            toString: function() {
                return this.text;
            },
            reassign: function() {},
            //no-op
            teardown: function() {}
        };
        return StringText;
    }( config_types );

    var render_StringFragment_prototype_toArgsList = function( warn, parseJSON ) {

        return function() {
            var values, counter, jsonesque, guid, errorMessage, parsed, processItems;
            if ( !this.argsList || this.dirty ) {
                values = {};
                counter = 0;
                guid = this.root._guid;
                processItems = function( items ) {
                    return items.map( function( item ) {
                        var placeholderId, wrapped, value;
                        if ( item.text ) {
                            return item.text;
                        }
                        if ( item.fragments ) {
                            return item.fragments.map( function( fragment ) {
                                return processItems( fragment.items );
                            } ).join( '' );
                        }
                        placeholderId = guid + '-' + counter++;
                        if ( wrapped = item.root._wrapped[ item.keypath ] ) {
                            value = wrapped.value;
                        } else {
                            value = item.value;
                        }
                        values[ placeholderId ] = value;
                        return '${' + placeholderId + '}';
                    } ).join( '' );
                };
                jsonesque = processItems( this.items );
                parsed = parseJSON( '[' + jsonesque + ']', values );
                if ( !parsed ) {
                    errorMessage = 'Could not parse directive arguments (' + this.toString() + '). If you think this is a bug, please file an issue at http://github.com/RactiveJS/Ractive/issues';
                    if ( this.root.debug ) {
                        throw new Error( errorMessage );
                    } else {
                        warn( errorMessage );
                        this.argsList = [ jsonesque ];
                    }
                } else {
                    this.argsList = parsed.value;
                }
                this.dirty = false;
            }
            return this.argsList;
        };
    }( utils_warn, utils_parseJSON );

    var render_StringFragment__StringFragment = function( types, parseJSON, Fragment, Interpolator, Section, Text, toArgsList, circular ) {

        var StringFragment = function( options ) {
            Fragment.init( this, options );
        };
        StringFragment.prototype = {
            reassign: Fragment.reassign,
            createItem: function( options ) {
                if ( typeof options.descriptor === 'string' ) {
                    return new Text( options.descriptor );
                }
                switch ( options.descriptor.t ) {
                    case types.INTERPOLATOR:
                        return new Interpolator( options );
                    case types.TRIPLE:
                        return new Interpolator( options );
                    case types.SECTION:
                        return new Section( options );
                    default:
                        throw 'Something went wrong in a rather interesting way';
                }
            },
            bubble: function() {
                this.dirty = true;
                this.owner.bubble();
            },
            teardown: function() {
                var numItems, i;
                numItems = this.items.length;
                for ( i = 0; i < numItems; i += 1 ) {
                    this.items[ i ].teardown();
                }
            },
            getValue: function() {
                var value;
                // Accommodate boolean attributes
                if ( this.items.length === 1 && this.items[ 0 ].type === types.INTERPOLATOR ) {
                    value = this.items[ 0 ].value;
                    if ( value !== undefined ) {
                        return value;
                    }
                }
                return this.toString();
            },
            isSimple: function() {
                var i, item, containsInterpolator;
                if ( this.simple !== undefined ) {
                    return this.simple;
                }
                i = this.items.length;
                while ( i-- ) {
                    item = this.items[ i ];
                    if ( item.type === types.TEXT ) {
                        continue;
                    }
                    // we can only have one interpolator and still be self-updating
                    if ( item.type === types.INTERPOLATOR ) {
                        if ( containsInterpolator ) {
                            return false;
                        } else {
                            containsInterpolator = true;
                            continue;
                        }
                    }
                    // anything that isn't text or an interpolator (i.e. a section)
                    // and we can't self-update
                    return this.simple = false;
                }
                return this.simple = true;
            },
            toString: function() {
                return this.items.join( '' );
            },
            toJSON: function() {
                var value = this.getValue(),
                    parsed;
                if ( typeof value === 'string' ) {
                    parsed = parseJSON( value );
                    value = parsed ? parsed.value : value;
                }
                return value;
            },
            toArgsList: toArgsList
        };
        circular.StringFragment = StringFragment;
        return StringFragment;
    }( config_types, utils_parseJSON, render_shared_Fragment__Fragment, render_StringFragment_Interpolator, render_StringFragment_Section, render_StringFragment_Text, render_StringFragment_prototype_toArgsList, circular );

    var render_DomFragment_Attribute__Attribute = function( runloop, types, determineNameAndNamespace, setStaticAttribute, determinePropertyName, getInterpolator, bind, update, StringFragment ) {

        var DomAttribute = function( options ) {
            this.type = types.ATTRIBUTE;
            this.element = options.element;
            determineNameAndNamespace( this, options.name );
            // if it's an empty attribute, or just a straight key-value pair, with no
            // mustache shenanigans, set the attribute accordingly and go home
            if ( options.value === null || typeof options.value === 'string' ) {
                setStaticAttribute( this, options );
                return;
            }
            // otherwise we need to do some work
            this.root = options.root;
            this.pNode = options.pNode;
            // share parentFragment with parent element
            this.parentFragment = this.element.parentFragment;
            this.fragment = new StringFragment( {
                descriptor: options.value,
                root: this.root,
                owner: this
            } );
            // Store a reference to this attribute's interpolator, if its fragment
            // takes the form `{{foo}}`. This is necessary for two-way binding and
            // for correctly rendering HTML later
            this.interpolator = getInterpolator( this );
            // if we're not rendering (i.e. we're just stringifying), we can stop here
            if ( !this.pNode ) {
                return;
            }
            // special cases
            if ( this.name === 'value' ) {
                this.isValueAttribute = true;
                // TODO need to wait until afterwards to determine type, in case we
                // haven't initialised that attribute yet
                // <input type='file' value='{{value}}'>
                if ( this.pNode.tagName === 'INPUT' && this.pNode.type === 'file' ) {
                    this.isFileInputValue = true;
                }
            }
            // can we establish this attribute's property name equivalent?
            determinePropertyName( this, options );
            // determine whether this attribute can be marked as self-updating
            this.selfUpdating = this.fragment.isSimple();
            // mark as ready
            this.ready = true;
        };
        DomAttribute.prototype = {
            bind: bind,
            update: update,
            updateBindings: function() {
                // if the fragment this attribute belongs to gets reassigned (as a result of
                // as section being updated via an array shift, unshift or splice), this
                // attribute needs to recognise that its keypath has changed
                this.keypath = this.interpolator.keypath || this.interpolator.ref;
                // if we encounter the special case described above, update the name attribute
                if ( this.propertyName === 'name' ) {
                    // replace actual name attribute
                    this.pNode.name = '{{' + this.keypath + '}}';
                }
            },
            reassign: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                if ( this.fragment ) {
                    this.fragment.reassign( indexRef, newIndex, oldKeypath, newKeypath );
                    if ( this.twoway ) {
                        this.updateBindings();
                    }
                }
            },
            teardown: function() {
                var i;
                if ( this.boundEvents ) {
                    i = this.boundEvents.length;
                    while ( i-- ) {
                        this.pNode.removeEventListener( this.boundEvents[ i ], this.updateModel, false );
                    }
                }
                // ignore non-dynamic attributes
                if ( this.fragment ) {
                    this.fragment.teardown();
                }
            },
            bubble: function() {
                // If an attribute's text fragment contains a single item, we can
                // update the DOM immediately...
                if ( this.selfUpdating ) {
                    this.update();
                } else if ( !this.deferred && this.ready ) {
                    runloop.addAttribute( this );
                    this.deferred = true;
                }
            },
            toString: function() {
                var str, interpolator;
                if ( this.value === null ) {
                    return this.name;
                }
                // Special case - select values (should not be stringified)
                if ( this.name === 'value' && this.element.lcName === 'select' ) {
                    return;
                }
                // Special case - radio names
                if ( this.name === 'name' && this.element.lcName === 'input' && ( interpolator = this.interpolator ) ) {
                    return 'name={{' + ( interpolator.keypath || interpolator.ref ) + '}}';
                }
                // TODO don't use JSON.stringify?
                if ( !this.fragment ) {
                    return this.name + '=' + JSON.stringify( this.value );
                }
                // TODO deal with boolean attributes correctly
                str = this.fragment.toString();
                return this.name + '=' + JSON.stringify( str );
            }
        };
        return DomAttribute;
    }( global_runloop, config_types, render_DomFragment_Attribute_helpers_determineNameAndNamespace, render_DomFragment_Attribute_helpers_setStaticAttribute, render_DomFragment_Attribute_helpers_determinePropertyName, render_DomFragment_Attribute_helpers_getInterpolator, render_DomFragment_Attribute_prototype_bind, render_DomFragment_Attribute_prototype_update, render_StringFragment__StringFragment );

    var render_DomFragment_Element_initialise_createElementAttribute = function( Attribute ) {

        return function createElementAttribute( element, name, fragment ) {
            var attr = new Attribute( {
                element: element,
                name: name,
                value: fragment,
                root: element.root,
                pNode: element.node
            } );
            // store against both index and name, for fast iteration and lookup
            element.attributes.push( element.attributes[ name ] = attr );
            // The name attribute is a special case - it is the only two-way attribute that updates
            // the viewmodel based on the value of another attribute. For that reason it must wait
            // until the node has been initialised, and the viewmodel has had its first two-way
            // update, before updating itself (otherwise it may disable a checkbox or radio that
            // was enabled in the template)
            if ( name !== 'name' ) {
                attr.update();
            }
        };
    }( render_DomFragment_Attribute__Attribute );

    var render_DomFragment_Element_initialise_createElementAttributes = function( createElementAttribute ) {

        return function( element, attributes ) {
            var attrName;
            element.attributes = [];
            for ( attrName in attributes ) {
                if ( attributes.hasOwnProperty( attrName ) ) {
                    createElementAttribute( element, attrName, attributes[ attrName ] );
                }
            }
            return element.attributes;
        };
    }( render_DomFragment_Element_initialise_createElementAttribute );

    var utils_toArray = function toArray( arrayLike ) {
        var array = [],
            i = arrayLike.length;
        while ( i-- ) {
            array[ i ] = arrayLike[ i ];
        }
        return array;
    };

    var render_DomFragment_Element_shared_getMatchingStaticNodes = function( toArray ) {

        return function getMatchingStaticNodes( element, selector ) {
            if ( !element.matchingStaticNodes[ selector ] ) {
                element.matchingStaticNodes[ selector ] = toArray( element.node.querySelectorAll( selector ) );
            }
            return element.matchingStaticNodes[ selector ];
        };
    }( utils_toArray );

    var render_DomFragment_Element_initialise_appendElementChildren = function( warn, namespaces, StringFragment, getMatchingStaticNodes, circular ) {

        var DomFragment, updateCss, updateScript;
        circular.push( function() {
            DomFragment = circular.DomFragment;
        } );
        updateCss = function() {
            var node = this.node,
                content = this.fragment.toString();
            if ( node.styleSheet ) {
                node.styleSheet.cssText = content;
            } else {
                node.innerHTML = content;
            }
        };
        updateScript = function() {
            if ( !this.node.type || this.node.type === 'text/javascript' ) {
                warn( 'Script tag was updated. This does not cause the code to be re-evaluated!' );
            }
            this.node.text = this.fragment.toString();
        };
        return function appendElementChildren( element, node, descriptor, docFrag ) {
            // Special case - script and style tags
            if ( element.lcName === 'script' || element.lcName === 'style' ) {
                element.fragment = new StringFragment( {
                    descriptor: descriptor.f,
                    root: element.root,
                    owner: element
                } );
                if ( docFrag ) {
                    if ( element.lcName === 'script' ) {
                        element.bubble = updateScript;
                        element.node.text = element.fragment.toString();
                    } else {
                        element.bubble = updateCss;
                        element.bubble();
                    }
                }
                return;
            }
            if ( typeof descriptor.f === 'string' && ( !node || ( !node.namespaceURI || node.namespaceURI === namespaces.html ) ) ) {
                // great! we can use innerHTML
                element.html = descriptor.f;
                if ( docFrag ) {
                    node.innerHTML = element.html;
                    // Update live queries, if applicable
                    element.matchingStaticNodes = {};
                    // so we can remove matches made with querySelectorAll at teardown time
                    updateLiveQueries( element );
                }
            } else {
                element.fragment = new DomFragment( {
                    descriptor: descriptor.f,
                    root: element.root,
                    pNode: node,
                    owner: element,
                    pElement: element
                } );
                if ( docFrag ) {
                    node.appendChild( element.fragment.docFrag );
                }
            }
        };

        function updateLiveQueries( element ) {
            var instance, liveQueries, node, selector, query, matchingStaticNodes, i;
            node = element.node;
            instance = element.root;
            do {
                liveQueries = instance._liveQueries;
                i = liveQueries.length;
                while ( i-- ) {
                    selector = liveQueries[ i ];
                    query = liveQueries[ selector ];
                    matchingStaticNodes = getMatchingStaticNodes( element, selector );
                    query.push.apply( query, matchingStaticNodes );
                }
            } while ( instance = instance._parent );
        }
    }( utils_warn, config_namespaces, render_StringFragment__StringFragment, render_DomFragment_Element_shared_getMatchingStaticNodes, circular );

    var render_DomFragment_Element_initialise_decorate_Decorator = function( warn, StringFragment ) {

        var Decorator = function( descriptor, ractive, owner ) {
            var decorator = this,
                name, fragment, errorMessage;
            decorator.root = ractive;
            decorator.node = owner.node;
            name = descriptor.n || descriptor;
            if ( typeof name !== 'string' ) {
                fragment = new StringFragment( {
                    descriptor: name,
                    root: ractive,
                    owner: owner
                } );
                name = fragment.toString();
                fragment.teardown();
            }
            if ( descriptor.a ) {
                decorator.params = descriptor.a;
            } else if ( descriptor.d ) {
                decorator.fragment = new StringFragment( {
                    descriptor: descriptor.d,
                    root: ractive,
                    owner: owner
                } );
                decorator.params = decorator.fragment.toArgsList();
                decorator.fragment.bubble = function() {
                    this.dirty = true;
                    decorator.params = this.toArgsList();
                    if ( decorator.ready ) {
                        decorator.update();
                    }
                };
            }
            decorator.fn = ractive.decorators[ name ];
            if ( !decorator.fn ) {
                errorMessage = 'Missing "' + name + '" decorator. You may need to download a plugin via http://docs.ractivejs.org/latest/plugins#decorators';
                if ( ractive.debug ) {
                    throw new Error( errorMessage );
                } else {
                    warn( errorMessage );
                }
            }
        };
        Decorator.prototype = {
            init: function() {
                var result, args;
                if ( this.params ) {
                    args = [ this.node ].concat( this.params );
                    result = this.fn.apply( this.root, args );
                } else {
                    result = this.fn.call( this.root, this.node );
                }
                if ( !result || !result.teardown ) {
                    throw new Error( 'Decorator definition must return an object with a teardown method' );
                }
                // TODO does this make sense?
                this.actual = result;
                this.ready = true;
            },
            update: function() {
                if ( this.actual.update ) {
                    this.actual.update.apply( this.root, this.params );
                } else {
                    this.actual.teardown( true );
                    this.init();
                }
            },
            teardown: function( updating ) {
                this.actual.teardown();
                if ( !updating && this.fragment ) {
                    this.fragment.teardown();
                }
            }
        };
        return Decorator;
    }( utils_warn, render_StringFragment__StringFragment );

    var render_DomFragment_Element_initialise_decorate__decorate = function( runloop, Decorator ) {

        return function( descriptor, root, owner ) {
            var decorator = new Decorator( descriptor, root, owner );
            if ( decorator.fn ) {
                owner.decorator = decorator;
                runloop.addDecorator( owner.decorator );
            }
        };
    }( global_runloop, render_DomFragment_Element_initialise_decorate_Decorator );

    var render_DomFragment_Element_initialise_addEventProxies_addEventProxy = function( warn, StringFragment ) {

        var addEventProxy,
            // helpers
            MasterEventHandler, ProxyEvent, firePlainEvent, fireEventWithArgs, fireEventWithDynamicArgs, customHandlers, genericHandler, getCustomHandler;
        addEventProxy = function( element, triggerEventName, proxyDescriptor, indexRefs ) {
            var events, master;
            events = element.node._ractive.events;
            master = events[ triggerEventName ] || ( events[ triggerEventName ] = new MasterEventHandler( element, triggerEventName, indexRefs ) );
            master.add( proxyDescriptor );
        };
        MasterEventHandler = function( element, eventName ) {
            var definition;
            this.element = element;
            this.root = element.root;
            this.node = element.node;
            this.name = eventName;
            this.proxies = [];
            if ( definition = this.root.events[ eventName ] ) {
                this.custom = definition( this.node, getCustomHandler( eventName ) );
            } else {
                // Looks like we're dealing with a standard DOM event... but let's check
                if ( !( 'on' + eventName in this.node ) ) {
                    warn( 'Missing "' + this.name + '" event. You may need to download a plugin via http://docs.ractivejs.org/latest/plugins#events' );
                }
                this.node.addEventListener( eventName, genericHandler, false );
            }
        };
        MasterEventHandler.prototype = {
            add: function( proxy ) {
                this.proxies.push( new ProxyEvent( this.element, this.root, proxy ) );
            },
            // TODO teardown when element torn down
            teardown: function() {
                var i;
                if ( this.custom ) {
                    this.custom.teardown();
                } else {
                    this.node.removeEventListener( this.name, genericHandler, false );
                }
                i = this.proxies.length;
                while ( i-- ) {
                    this.proxies[ i ].teardown();
                }
            },
            fire: function( event ) {
                var i = this.proxies.length;
                while ( i-- ) {
                    this.proxies[ i ].fire( event );
                }
            }
        };
        ProxyEvent = function( element, ractive, descriptor ) {
            var name;
            this.root = ractive;
            name = descriptor.n || descriptor;
            if ( typeof name === 'string' ) {
                this.n = name;
            } else {
                this.n = new StringFragment( {
                    descriptor: descriptor.n,
                    root: this.root,
                    owner: element
                } );
            }
            if ( descriptor.a ) {
                this.a = descriptor.a;
                this.fire = fireEventWithArgs;
                return;
            }
            if ( descriptor.d ) {
                this.d = new StringFragment( {
                    descriptor: descriptor.d,
                    root: this.root,
                    owner: element
                } );
                this.fire = fireEventWithDynamicArgs;
                return;
            }
            this.fire = firePlainEvent;
        };
        ProxyEvent.prototype = {
            teardown: function() {
                if ( this.n.teardown ) {
                    this.n.teardown();
                }
                if ( this.d ) {
                    this.d.teardown();
                }
            },
            bubble: function() {}
        };
        // the ProxyEvent instance fire method could be any of these
        firePlainEvent = function( event ) {
            this.root.fire( this.n.toString(), event );
        };
        fireEventWithArgs = function( event ) {
            this.root.fire.apply( this.root, [
                this.n.toString(),
                event
            ].concat( this.a ) );
        };
        fireEventWithDynamicArgs = function( event ) {
            var args = this.d.toArgsList();
            // need to strip [] from ends if a string!
            if ( typeof args === 'string' ) {
                args = args.substr( 1, args.length - 2 );
            }
            this.root.fire.apply( this.root, [
                this.n.toString(),
                event
            ].concat( args ) );
        };
        // all native DOM events dealt with by Ractive share a single handler
        genericHandler = function( event ) {
            var storage = this._ractive;
            storage.events[ event.type ].fire( {
                node: this,
                original: event,
                index: storage.index,
                keypath: storage.keypath,
                context: storage.root.get( storage.keypath )
            } );
        };
        customHandlers = {};
        getCustomHandler = function( eventName ) {
            if ( customHandlers[ eventName ] ) {
                return customHandlers[ eventName ];
            }
            return customHandlers[ eventName ] = function( event ) {
                var storage = event.node._ractive;
                event.index = storage.index;
                event.keypath = storage.keypath;
                event.context = storage.root.get( storage.keypath );
                storage.events[ eventName ].fire( event );
            };
        };
        return addEventProxy;
    }( utils_warn, render_StringFragment__StringFragment );

    var render_DomFragment_Element_initialise_addEventProxies__addEventProxies = function( addEventProxy ) {

        return function( element, proxies ) {
            var i, eventName, eventNames;
            for ( eventName in proxies ) {
                if ( proxies.hasOwnProperty( eventName ) ) {
                    eventNames = eventName.split( '-' );
                    i = eventNames.length;
                    while ( i-- ) {
                        addEventProxy( element, eventNames[ i ], proxies[ eventName ] );
                    }
                }
            }
        };
    }( render_DomFragment_Element_initialise_addEventProxies_addEventProxy );

    var render_DomFragment_Element_initialise_updateLiveQueries = function( element ) {
        var instance, liveQueries, i, selector, query;
        // Does this need to be added to any live queries?
        instance = element.root;
        do {
            liveQueries = instance._liveQueries;
            i = liveQueries.length;
            while ( i-- ) {
                selector = liveQueries[ i ];
                query = liveQueries[ selector ];
                if ( query._test( element ) ) {
                    // keep register of applicable selectors, for when we teardown
                    ( element.liveQueries || ( element.liveQueries = [] ) ).push( query );
                }
            }
        } while ( instance = instance._parent );
    };

    var render_DomFragment_Element_shared_executeTransition_Transition_prototype_init = function() {
        if ( this._inited ) {
            throw new Error( 'Cannot initialize a transition more than once' );
        }
        this._inited = true;
        this._fn.apply( this.root, [ this ].concat( this.params ) );
    };

    var render_DomFragment_Element_shared_executeTransition_Transition_helpers_prefix = function( isClient, vendors, createElement ) {

        var prefixCache, testStyle;
        if ( !isClient ) {
            return;
        }
        prefixCache = {};
        testStyle = createElement( 'div' ).style;
        return function( prop ) {
            var i, vendor, capped;
            if ( !prefixCache[ prop ] ) {
                if ( testStyle[ prop ] !== undefined ) {
                    prefixCache[ prop ] = prop;
                } else {
                    // test vendors...
                    capped = prop.charAt( 0 ).toUpperCase() + prop.substring( 1 );
                    i = vendors.length;
                    while ( i-- ) {
                        vendor = vendors[ i ];
                        if ( testStyle[ vendor + capped ] !== undefined ) {
                            prefixCache[ prop ] = vendor + capped;
                            break;
                        }
                    }
                }
            }
            return prefixCache[ prop ];
        };
    }( config_isClient, config_vendors, utils_createElement );

    var render_DomFragment_Element_shared_executeTransition_Transition_prototype_getStyle = function( legacy, isClient, isArray, prefix ) {

        var getComputedStyle;
        if ( !isClient ) {
            return;
        }
        getComputedStyle = window.getComputedStyle || legacy.getComputedStyle;
        return function( props ) {
            var computedStyle, styles, i, prop, value;
            computedStyle = window.getComputedStyle( this.node );
            if ( typeof props === 'string' ) {
                value = computedStyle[ prefix( props ) ];
                if ( value === '0px' ) {
                    value = 0;
                }
                return value;
            }
            if ( !isArray( props ) ) {
                throw new Error( 'Transition#getStyle must be passed a string, or an array of strings representing CSS properties' );
            }
            styles = {};
            i = props.length;
            while ( i-- ) {
                prop = props[ i ];
                value = computedStyle[ prefix( prop ) ];
                if ( value === '0px' ) {
                    value = 0;
                }
                styles[ prop ] = value;
            }
            return styles;
        };
    }( legacy, config_isClient, utils_isArray, render_DomFragment_Element_shared_executeTransition_Transition_helpers_prefix );

    var render_DomFragment_Element_shared_executeTransition_Transition_prototype_setStyle = function( prefix ) {

        return function( style, value ) {
            var prop;
            if ( typeof style === 'string' ) {
                this.node.style[ prefix( style ) ] = value;
            } else {
                for ( prop in style ) {
                    if ( style.hasOwnProperty( prop ) ) {
                        this.node.style[ prefix( prop ) ] = style[ prop ];
                    }
                }
            }
            return this;
        };
    }( render_DomFragment_Element_shared_executeTransition_Transition_helpers_prefix );

    var utils_camelCase = function( hyphenatedStr ) {
        return hyphenatedStr.replace( /-([a-zA-Z])/g, function( match, $1 ) {
            return $1.toUpperCase();
        } );
    };

    var shared_Ticker = function( warn, getTime, animations ) {

        // TODO what happens if a transition is aborted?
        // TODO use this with Animation to dedupe some code?
        var Ticker = function( options ) {
            var easing;
            this.duration = options.duration;
            this.step = options.step;
            this.complete = options.complete;
            // easing
            if ( typeof options.easing === 'string' ) {
                easing = options.root.easing[ options.easing ];
                if ( !easing ) {
                    warn( 'Missing easing function ("' + options.easing + '"). You may need to download a plugin from [TODO]' );
                    easing = linear;
                }
            } else if ( typeof options.easing === 'function' ) {
                easing = options.easing;
            } else {
                easing = linear;
            }
            this.easing = easing;
            this.start = getTime();
            this.end = this.start + this.duration;
            this.running = true;
            animations.add( this );
        };
        Ticker.prototype = {
            tick: function( now ) {
                var elapsed, eased;
                if ( !this.running ) {
                    return false;
                }
                if ( now > this.end ) {
                    if ( this.step ) {
                        this.step( 1 );
                    }
                    if ( this.complete ) {
                        this.complete( 1 );
                    }
                    return false;
                }
                elapsed = now - this.start;
                eased = this.easing( elapsed / this.duration );
                if ( this.step ) {
                    this.step( eased );
                }
                return true;
            },
            stop: function() {
                if ( this.abort ) {
                    this.abort();
                }
                this.running = false;
            }
        };
        return Ticker;

        function linear( t ) {
            return t;
        }
    }( utils_warn, utils_getTime, shared_animations );

    var render_DomFragment_Element_shared_executeTransition_Transition_helpers_unprefix = function( vendors ) {

        var unprefixPattern = new RegExp( '^-(?:' + vendors.join( '|' ) + ')-' );
        return function( prop ) {
            return prop.replace( unprefixPattern, '' );
        };
    }( config_vendors );

    var render_DomFragment_Element_shared_executeTransition_Transition_helpers_hyphenate = function( vendors ) {

        var vendorPattern = new RegExp( '^(?:' + vendors.join( '|' ) + ')([A-Z])' );
        return function( str ) {
            var hyphenated;
            if ( !str ) {
                return '';
            }
            if ( vendorPattern.test( str ) ) {
                str = '-' + str;
            }
            hyphenated = str.replace( /[A-Z]/g, function( match ) {
                return '-' + match.toLowerCase();
            } );
            return hyphenated;
        };
    }( config_vendors );

    var render_DomFragment_Element_shared_executeTransition_Transition_prototype_animateStyle_createTransitions = function( isClient, warn, createElement, camelCase, interpolate, Ticker, prefix, unprefix, hyphenate ) {

        var testStyle, TRANSITION, TRANSITIONEND, CSS_TRANSITIONS_ENABLED, TRANSITION_DURATION, TRANSITION_PROPERTY, TRANSITION_TIMING_FUNCTION, canUseCssTransitions = {}, cannotUseCssTransitions = {};
        if ( !isClient ) {
            return;
        }
        testStyle = createElement( 'div' ).style;
        // determine some facts about our environment
        ( function() {
            if ( testStyle.transition !== undefined ) {
                TRANSITION = 'transition';
                TRANSITIONEND = 'transitionend';
                CSS_TRANSITIONS_ENABLED = true;
            } else if ( testStyle.webkitTransition !== undefined ) {
                TRANSITION = 'webkitTransition';
                TRANSITIONEND = 'webkitTransitionEnd';
                CSS_TRANSITIONS_ENABLED = true;
            } else {
                CSS_TRANSITIONS_ENABLED = false;
            }
        }() );
        if ( TRANSITION ) {
            TRANSITION_DURATION = TRANSITION + 'Duration';
            TRANSITION_PROPERTY = TRANSITION + 'Property';
            TRANSITION_TIMING_FUNCTION = TRANSITION + 'TimingFunction';
        }
        return function( t, to, options, changedProperties, transitionEndHandler, resolve ) {
            // Wait a beat (otherwise the target styles will be applied immediately)
            // TODO use a fastdom-style mechanism?
            setTimeout( function() {
                var hashPrefix, jsTransitionsComplete, cssTransitionsComplete, checkComplete;
                checkComplete = function() {
                    if ( jsTransitionsComplete && cssTransitionsComplete ) {
                        resolve();
                    }
                };
                // this is used to keep track of which elements can use CSS to animate
                // which properties
                hashPrefix = t.node.namespaceURI + t.node.tagName;
                t.node.style[ TRANSITION_PROPERTY ] = changedProperties.map( prefix ).map( hyphenate ).join( ',' );
                t.node.style[ TRANSITION_TIMING_FUNCTION ] = hyphenate( options.easing || 'linear' );
                t.node.style[ TRANSITION_DURATION ] = options.duration / 1000 + 's';
                transitionEndHandler = function( event ) {
                    var index;
                    index = changedProperties.indexOf( camelCase( unprefix( event.propertyName ) ) );
                    if ( index !== -1 ) {
                        changedProperties.splice( index, 1 );
                    }
                    if ( changedProperties.length ) {
                        // still transitioning...
                        return;
                    }
                    t.root.fire( t.name + ':end' );
                    t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
                    cssTransitionsComplete = true;
                    checkComplete();
                };
                t.node.addEventListener( TRANSITIONEND, transitionEndHandler, false );
                setTimeout( function() {
                    var i = changedProperties.length,
                        hash, originalValue, index, propertiesToTransitionInJs = [],
                        prop;
                    while ( i-- ) {
                        prop = changedProperties[ i ];
                        hash = hashPrefix + prop;
                        if ( canUseCssTransitions[ hash ] ) {
                            // We can definitely use CSS transitions, because
                            // we've already tried it and it worked
                            t.node.style[ prefix( prop ) ] = to[ prop ];
                        } else {
                            // one way or another, we'll need this
                            originalValue = t.getStyle( prop );
                        }
                        if ( canUseCssTransitions[ hash ] === undefined ) {
                            // We're not yet sure if we can use CSS transitions -
                            // let's find out
                            t.node.style[ prefix( prop ) ] = to[ prop ];
                            // if this property is transitionable in this browser,
                            // the current style will be different from the target style
                            canUseCssTransitions[ hash ] = t.getStyle( prop ) != to[ prop ];
                            cannotUseCssTransitions[ hash ] = !canUseCssTransitions[ hash ];
                        }
                        if ( cannotUseCssTransitions[ hash ] ) {
                            // we need to fall back to timer-based stuff
                            // need to remove this from changedProperties, otherwise transitionEndHandler
                            // will get confused
                            index = changedProperties.indexOf( prop );
                            if ( index === -1 ) {
                                warn( 'Something very strange happened with transitions. If you see this message, please let @RactiveJS know. Thanks!' );
                            } else {
                                changedProperties.splice( index, 1 );
                            }
                            // TODO Determine whether this property is animatable at all
                            // for now assume it is. First, we need to set the value to what it was...
                            t.node.style[ prefix( prop ) ] = originalValue;
                            // ...then kick off a timer-based transition
                            propertiesToTransitionInJs.push( {
                                name: prefix( prop ),
                                interpolator: interpolate( originalValue, to[ prop ] )
                            } );
                        }
                    }
                    // javascript transitions
                    if ( propertiesToTransitionInJs.length ) {
                        new Ticker( {
                            root: t.root,
                            duration: options.duration,
                            easing: camelCase( options.easing ),
                            step: function( pos ) {
                                var prop, i;
                                i = propertiesToTransitionInJs.length;
                                while ( i-- ) {
                                    prop = propertiesToTransitionInJs[ i ];
                                    t.node.style[ prop.name ] = prop.interpolator( pos );
                                }
                            },
                            complete: function() {
                                jsTransitionsComplete = true;
                                checkComplete();
                            }
                        } );
                    } else {
                        jsTransitionsComplete = true;
                    }
                    if ( !changedProperties.length ) {
                        // We need to cancel the transitionEndHandler, and deal with
                        // the fact that it will never fire
                        t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
                        cssTransitionsComplete = true;
                        checkComplete();
                    }
                }, 0 );
            }, options.delay || 0 );
        };
    }( config_isClient, utils_warn, utils_createElement, utils_camelCase, shared_interpolate, shared_Ticker, render_DomFragment_Element_shared_executeTransition_Transition_helpers_prefix, render_DomFragment_Element_shared_executeTransition_Transition_helpers_unprefix, render_DomFragment_Element_shared_executeTransition_Transition_helpers_hyphenate );

    var render_DomFragment_Element_shared_executeTransition_Transition_prototype_animateStyle__animateStyle = function( legacy, isClient, warn, Promise, prefix, createTransitions ) {

        var getComputedStyle;
        if ( !isClient ) {
            return;
        }
        getComputedStyle = window.getComputedStyle || legacy.getComputedStyle;
        return function( style, value, options, complete ) {
            var t = this,
                to;
            if ( typeof style === 'string' ) {
                to = {};
                to[ style ] = value;
            } else {
                to = style;
                // shuffle arguments
                complete = options;
                options = value;
            }
            // As of 0.3.9, transition authors should supply an `option` object with
            // `duration` and `easing` properties (and optional `delay`), plus a
            // callback function that gets called after the animation completes
            // TODO remove this check in a future version
            if ( !options ) {
                warn( 'The "' + t.name + '" transition does not supply an options object to `t.animateStyle()`. This will break in a future version of Ractive. For more info see https://github.com/RactiveJS/Ractive/issues/340' );
                options = t;
                complete = t.complete;
            }
            var promise = new Promise( function( resolve ) {
                var propertyNames, changedProperties, computedStyle, current, from, transitionEndHandler, i, prop;
                // Edge case - if duration is zero, set style synchronously and complete
                if ( !options.duration ) {
                    t.setStyle( to );
                    resolve();
                    return;
                }
                // Get a list of the properties we're animating
                propertyNames = Object.keys( to );
                changedProperties = [];
                // Store the current styles
                computedStyle = window.getComputedStyle( t.node );
                from = {};
                i = propertyNames.length;
                while ( i-- ) {
                    prop = propertyNames[ i ];
                    current = computedStyle[ prefix( prop ) ];
                    if ( current === '0px' ) {
                        current = 0;
                    }
                    // we need to know if we're actually changing anything
                    if ( current != to[ prop ] ) {
                        // use != instead of !==, so we can compare strings with numbers
                        changedProperties.push( prop );
                        // make the computed style explicit, so we can animate where
                        // e.g. height='auto'
                        t.node.style[ prefix( prop ) ] = current;
                    }
                }
                // If we're not actually changing anything, the transitionend event
                // will never fire! So we complete early
                if ( !changedProperties.length ) {
                    resolve();
                    return;
                }
                createTransitions( t, to, options, changedProperties, transitionEndHandler, resolve );
            } );
            // If a callback was supplied, do the honours
            // TODO remove this check in future
            if ( complete ) {
                warn( 't.animateStyle returns a Promise as of 0.4.0. Transition authors should do t.animateStyle(...).then(callback)' );
                promise.then( complete );
            }
            return promise;
        };
    }( legacy, config_isClient, utils_warn, utils_Promise, render_DomFragment_Element_shared_executeTransition_Transition_helpers_prefix, render_DomFragment_Element_shared_executeTransition_Transition_prototype_animateStyle_createTransitions );

    var utils_fillGaps = function( target, source ) {
        var key;
        for ( key in source ) {
            if ( source.hasOwnProperty( key ) && !( key in target ) ) {
                target[ key ] = source[ key ];
            }
        }
        return target;
    };

    var render_DomFragment_Element_shared_executeTransition_Transition_prototype_processParams = function( fillGaps ) {

        return function( params, defaults ) {
            if ( typeof params === 'number' ) {
                params = {
                    duration: params
                };
            } else if ( typeof params === 'string' ) {
                if ( params === 'slow' ) {
                    params = {
                        duration: 600
                    };
                } else if ( params === 'fast' ) {
                    params = {
                        duration: 200
                    };
                } else {
                    params = {
                        duration: 400
                    };
                }
            } else if ( !params ) {
                params = {};
            }
            return fillGaps( params, defaults );
        };
    }( utils_fillGaps );

    var render_DomFragment_Element_shared_executeTransition_Transition_prototype_resetStyle = function() {
        if ( this.originalStyle ) {
            this.node.setAttribute( 'style', this.originalStyle );
        } else {
            // Next line is necessary, to remove empty style attribute!
            // See http://stackoverflow.com/a/7167553
            this.node.getAttribute( 'style' );
            this.node.removeAttribute( 'style' );
        }
    };

    var render_DomFragment_Element_shared_executeTransition_Transition__Transition = function( warn, StringFragment, init, getStyle, setStyle, animateStyle, processParams, resetStyle ) {

        var Transition;
        Transition = function( descriptor, root, owner, isIntro ) {
            var t = this,
                name, fragment, errorMessage;
            this.root = root;
            this.node = owner.node;
            this.isIntro = isIntro;
            // store original style attribute
            this.originalStyle = this.node.getAttribute( 'style' );
            // create t.complete() - we don't want this on the prototype,
            // because we don't want `this` silliness when passing it as
            // an argument
            t.complete = function( noReset ) {
                if ( !noReset && t.isIntro ) {
                    t.resetStyle();
                }
                t.node._ractive.transition = null;
                t._manager.remove( t );
            };
            name = descriptor.n || descriptor;
            if ( typeof name !== 'string' ) {
                fragment = new StringFragment( {
                    descriptor: name,
                    root: this.root,
                    owner: owner
                } );
                name = fragment.toString();
                fragment.teardown();
            }
            this.name = name;
            if ( descriptor.a ) {
                this.params = descriptor.a;
            } else if ( descriptor.d ) {
                // TODO is there a way to interpret dynamic arguments without all the
                // 'dependency thrashing'?
                fragment = new StringFragment( {
                    descriptor: descriptor.d,
                    root: this.root,
                    owner: owner
                } );
                this.params = fragment.toArgsList();
                fragment.teardown();
            }
            this._fn = root.transitions[ name ];
            if ( !this._fn ) {
                errorMessage = 'Missing "' + name + '" transition. You may need to download a plugin via http://docs.ractivejs.org/latest/plugins#transitions';
                if ( root.debug ) {
                    throw new Error( errorMessage );
                } else {
                    warn( errorMessage );
                }
                return;
            }
        };
        Transition.prototype = {
            init: init,
            getStyle: getStyle,
            setStyle: setStyle,
            animateStyle: animateStyle,
            processParams: processParams,
            resetStyle: resetStyle
        };
        return Transition;
    }( utils_warn, render_StringFragment__StringFragment, render_DomFragment_Element_shared_executeTransition_Transition_prototype_init, render_DomFragment_Element_shared_executeTransition_Transition_prototype_getStyle, render_DomFragment_Element_shared_executeTransition_Transition_prototype_setStyle, render_DomFragment_Element_shared_executeTransition_Transition_prototype_animateStyle__animateStyle, render_DomFragment_Element_shared_executeTransition_Transition_prototype_processParams, render_DomFragment_Element_shared_executeTransition_Transition_prototype_resetStyle );

    var render_DomFragment_Element_shared_executeTransition__executeTransition = function( runloop, Transition ) {

        return function( descriptor, ractive, owner, isIntro ) {
            var transition, node, oldTransition;
            // TODO this can't be right!
            if ( !ractive.transitionsEnabled || ractive._parent && !ractive._parent.transitionsEnabled ) {
                return;
            }
            // get transition name, args and function
            transition = new Transition( descriptor, ractive, owner, isIntro );
            if ( transition._fn ) {
                node = transition.node;
                // Existing transition (i.e. we're outroing before intro is complete)?
                // End it prematurely
                if ( oldTransition = node._ractive.transition ) {
                    oldTransition.complete();
                }
                node._ractive.transition = transition;
                runloop.addTransition( transition );
            }
        };
    }( global_runloop, render_DomFragment_Element_shared_executeTransition_Transition__Transition );

    var render_DomFragment_Element_initialise__initialise = function( runloop, types, namespaces, create, defineProperty, warn, createElement, getInnerContext, getElementNamespace, createElementAttribute, createElementAttributes, appendElementChildren, decorate, addEventProxies, updateLiveQueries, executeTransition, enforceCase ) {

        return function initialiseElement( element, options, docFrag ) {
            var parentFragment, pNode, descriptor, namespace, name, attributes, width, height, loadHandler, root, selectBinding, errorMessage;
            element.type = types.ELEMENT;
            // stuff we'll need later
            parentFragment = element.parentFragment = options.parentFragment;
            pNode = parentFragment.pNode;
            descriptor = element.descriptor = options.descriptor;
            element.parent = options.pElement;
            element.root = root = parentFragment.root;
            element.index = options.index;
            element.lcName = descriptor.e.toLowerCase();
            element.eventListeners = [];
            element.customEventListeners = [];
            element.cssDetachQueue = [];
            // get namespace, if we're actually rendering (not server-side stringifying)
            if ( pNode ) {
                namespace = element.namespace = getElementNamespace( descriptor, pNode );
                // non-HTML elements (i.e. SVG) are case-sensitive
                name = namespace !== namespaces.html ? enforceCase( descriptor.e ) : descriptor.e;
                // create the DOM node
                element.node = createElement( name, namespace );
                // Is this a top-level node of a component? If so, we may need to add
                // a data-rvcguid attribute, for CSS encapsulation
                if ( root.css && pNode === root.el ) {
                    element.node.setAttribute( 'data-rvcguid', root.constructor._guid || root._guid );
                }
                // Add _ractive property to the node - we use this object to store stuff
                // related to proxy events, two-way bindings etc
                defineProperty( element.node, '_ractive', {
                    value: {
                        proxy: element,
                        keypath: getInnerContext( parentFragment ),
                        index: parentFragment.indexRefs,
                        events: create( null ),
                        root: root
                    }
                } );
            }
            // set attributes
            attributes = createElementAttributes( element, descriptor.a );
            // append children, if there are any
            if ( descriptor.f ) {
                // Special case - contenteditable
                if ( element.node && element.node.getAttribute( 'contenteditable' ) ) {
                    if ( element.node.innerHTML ) {
                        // This is illegal. You can't have content inside a contenteditable
                        // element that's already populated
                        errorMessage = 'A pre-populated contenteditable element should not have children';
                        if ( root.debug ) {
                            throw new Error( errorMessage );
                        } else {
                            warn( errorMessage );
                        }
                    }
                }
                appendElementChildren( element, element.node, descriptor, docFrag );
            }
            // create event proxies
            if ( docFrag && descriptor.v ) {
                addEventProxies( element, descriptor.v );
            }
            // if we're actually rendering (i.e. not server-side stringifying), proceed
            if ( docFrag ) {
                // deal with two-way bindings
                if ( root.twoway ) {
                    element.bind();
                    // Special case - contenteditable
                    if ( element.node.getAttribute( 'contenteditable' ) && element.node._ractive.binding ) {
                        // We need to update the model
                        element.node._ractive.binding.update();
                    }
                }
                // name attributes are deferred, because they're a special case - if two-way
                // binding is involved they need to update later. But if it turns out they're
                // not two-way we can update them now
                if ( attributes.name && !attributes.name.twoway ) {
                    attributes.name.update();
                }
                // if this is an <img>, and we're in a crap browser, we may need to prevent it
                // from overriding width and height when it loads the src
                if ( element.node.tagName === 'IMG' && ( ( width = element.attributes.width ) || ( height = element.attributes.height ) ) ) {
                    element.node.addEventListener( 'load', loadHandler = function() {
                        if ( width ) {
                            element.node.width = width.value;
                        }
                        if ( height ) {
                            element.node.height = height.value;
                        }
                        element.node.removeEventListener( 'load', loadHandler, false );
                    }, false );
                }
                docFrag.appendChild( element.node );
                // apply decorator(s)
                if ( descriptor.o ) {
                    decorate( descriptor.o, root, element );
                }
                // trigger intro transition
                if ( descriptor.t1 ) {
                    executeTransition( descriptor.t1, root, element, true );
                }
                if ( element.node.tagName === 'OPTION' ) {
                    // Special case... if this option's parent select was previously
                    // empty, it's possible that it should initialise to the value of
                    // this option.
                    if ( pNode.tagName === 'SELECT' && ( selectBinding = pNode._ractive.binding ) ) {
                        // it should be!
                        selectBinding.deferUpdate();
                    }
                    // If a value attribute was not given, we need to create one based on
                    // the content of the node, so that `<option>foo</option>` behaves the
                    // same as `<option value='foo'>foo</option>` with two-way binding
                    if ( !attributes.value ) {
                        createElementAttribute( element, 'value', descriptor.f );
                    }
                    // Special case... a select may have had its value set before a matching
                    // option was rendered. This might be that option element
                    if ( element.node._ractive.value == pNode._ractive.value ) {
                        element.node.selected = true;
                    }
                }
                if ( element.node.autofocus ) {
                    // Special case. Some browsers (*cough* Firefix *cough*) have a problem
                    // with dynamically-generated elements having autofocus, and they won't
                    // allow you to programmatically focus the element until it's in the DOM
                    runloop.focus( element.node );
                }
            }
            // If this is an option element, we need to store a reference to its select
            if ( element.lcName === 'option' ) {
                element.select = findParentSelect( element.parent );
            }
            updateLiveQueries( element );
        };

        function findParentSelect( element ) {
            do {
                if ( element.lcName === 'select' ) {
                    return element;
                }
            } while ( element = element.parent );
        }
    }( global_runloop, config_types, config_namespaces, utils_create, utils_defineProperty, utils_warn, utils_createElement, shared_getInnerContext, render_DomFragment_Element_initialise_getElementNamespace, render_DomFragment_Element_initialise_createElementAttribute, render_DomFragment_Element_initialise_createElementAttributes, render_DomFragment_Element_initialise_appendElementChildren, render_DomFragment_Element_initialise_decorate__decorate, render_DomFragment_Element_initialise_addEventProxies__addEventProxies, render_DomFragment_Element_initialise_updateLiveQueries, render_DomFragment_Element_shared_executeTransition__executeTransition, render_DomFragment_shared_enforceCase );

    var render_DomFragment_Element_prototype_teardown = function( runloop, executeTransition ) {

        return function Element_prototype_teardown( destroy ) {
            var eventName, binding, bindings;
            // Detach as soon as we can
            if ( destroy ) {
                this.willDetach = true;
                runloop.detachWhenReady( this );
            }
            // Children first. that way, any transitions on child elements will be
            // handled by the current transitionManager
            if ( this.fragment ) {
                this.fragment.teardown( false );
            }
            while ( this.attributes.length ) {
                this.attributes.pop().teardown();
            }
            if ( this.node ) {
                for ( eventName in this.node._ractive.events ) {
                    this.node._ractive.events[ eventName ].teardown();
                }
                // tear down two-way binding, if such there be
                if ( binding = this.node._ractive.binding ) {
                    binding.teardown();
                    bindings = this.root._twowayBindings[ binding.attr.keypath ];
                    bindings.splice( bindings.indexOf( binding ), 1 );
                }
            }
            if ( this.decorator ) {
                this.decorator.teardown();
            }
            // Outro, if necessary
            if ( this.descriptor.t2 ) {
                executeTransition( this.descriptor.t2, this.root, this, false );
            }
            // Remove this node from any live queries
            if ( this.liveQueries ) {
                removeFromLiveQueries( this );
            }
        };

        function removeFromLiveQueries( element ) {
            var query, selector, matchingStaticNodes, i, j;
            i = element.liveQueries.length;
            while ( i-- ) {
                query = element.liveQueries[ i ];
                selector = query.selector;
                query._remove( element.node );
                if ( element.matchingStaticNodes && ( matchingStaticNodes = element.matchingStaticNodes[ selector ] ) ) {
                    j = matchingStaticNodes.length;
                    while ( j-- ) {
                        query.remove( matchingStaticNodes[ j ] );
                    }
                }
            }
        }
    }( global_runloop, render_DomFragment_Element_shared_executeTransition__executeTransition );

    var render_DomFragment_Element_prototype_reassign = function( assignNewKeypath ) {

        return function reassignElement( indexRef, newIndex, oldKeypath, newKeypath ) {
            var i, storage, masterEventName, proxies, proxy, binding, bindings, liveQueries, ractive;
            i = this.attributes.length;
            while ( i-- ) {
                this.attributes[ i ].reassign( indexRef, newIndex, oldKeypath, newKeypath );
            }
            if ( storage = this.node._ractive ) {
                //adjust keypath if needed
                assignNewKeypath( storage, 'keypath', oldKeypath, newKeypath );
                if ( indexRef != undefined ) {
                    storage.index[ indexRef ] = newIndex;
                }
                for ( masterEventName in storage.events ) {
                    proxies = storage.events[ masterEventName ].proxies;
                    i = proxies.length;
                    while ( i-- ) {
                        proxy = proxies[ i ];
                        if ( typeof proxy.n === 'object' ) {
                            proxy.a.reassign( indexRef, newIndex, oldKeypath, newKeypath );
                        }
                        if ( proxy.d ) {
                            proxy.d.reassign( indexRef, newIndex, oldKeypath, newKeypath );
                        }
                    }
                }
                if ( binding = storage.binding ) {
                    if ( binding.keypath.substr( 0, oldKeypath.length ) === oldKeypath ) {
                        bindings = storage.root._twowayBindings[ binding.keypath ];
                        // remove binding reference for old keypath
                        bindings.splice( bindings.indexOf( binding ), 1 );
                        // update keypath
                        binding.keypath = binding.keypath.replace( oldKeypath, newKeypath );
                        // add binding reference for new keypath
                        bindings = storage.root._twowayBindings[ binding.keypath ] || ( storage.root._twowayBindings[ binding.keypath ] = [] );
                        bindings.push( binding );
                    }
                }
            }
            // reassign children
            if ( this.fragment ) {
                this.fragment.reassign( indexRef, newIndex, oldKeypath, newKeypath );
            }
            // Update live queries, if necessary
            if ( liveQueries = this.liveQueries ) {
                ractive = this.root;
                i = liveQueries.length;
                while ( i-- ) {
                    liveQueries[ i ]._makeDirty();
                }
            }
        };
    }( render_shared_utils_assignNewKeypath );

    var config_voidElementNames = 'area base br col command doctype embed hr img input keygen link meta param source track wbr'.split( ' ' );

    var render_DomFragment_Element_prototype_toString = function( voidElementNames, isArray ) {

        return function() {
            var str, i, len, attrStr;
            str = '<' + ( this.descriptor.y ? '!doctype' : this.descriptor.e );
            len = this.attributes.length;
            for ( i = 0; i < len; i += 1 ) {
                if ( attrStr = this.attributes[ i ].toString() ) {
                    str += ' ' + attrStr;
                }
            }
            // Special case - selected options
            if ( this.lcName === 'option' && optionIsSelected( this ) ) {
                str += ' selected';
            }
            // Special case - two-way radio name bindings
            if ( this.lcName === 'input' && inputIsCheckedRadio( this ) ) {
                str += ' checked';
            }
            str += '>';
            if ( this.html ) {
                str += this.html;
            } else if ( this.fragment ) {
                str += this.fragment.toString();
            }
            // add a closing tag if this isn't a void element
            if ( voidElementNames.indexOf( this.descriptor.e ) === -1 ) {
                str += '</' + this.descriptor.e + '>';
            }
            this.stringifying = false;
            return str;
        };

        function optionIsSelected( element ) {
            var optionValue, selectValueAttribute, selectValueInterpolator, selectValue, i;
            optionValue = element.attributes.value.value;
            selectValueAttribute = element.select.attributes.value;
            selectValueInterpolator = selectValueAttribute.interpolator;
            if ( !selectValueInterpolator ) {
                return;
            }
            selectValue = element.root.get( selectValueInterpolator.keypath || selectValueInterpolator.ref );
            if ( selectValue == optionValue ) {
                return true;
            }
            if ( element.select.attributes.multiple && isArray( selectValue ) ) {
                i = selectValue.length;
                while ( i-- ) {
                    if ( selectValue[ i ] == optionValue ) {
                        return true;
                    }
                }
            }
        }

        function inputIsCheckedRadio( element ) {
            var attributes, typeAttribute, valueAttribute, nameAttribute;
            attributes = element.attributes;
            typeAttribute = attributes.type;
            valueAttribute = attributes.value;
            nameAttribute = attributes.name;
            if ( !typeAttribute || typeAttribute.value !== 'radio' || !valueAttribute || !nameAttribute.interpolator ) {
                return;
            }
            if ( valueAttribute.value === nameAttribute.interpolator.value ) {
                return true;
            }
        }
    }( config_voidElementNames, utils_isArray );

    var render_DomFragment_Element_prototype_find = function( matches ) {

        return function( selector ) {
            var queryResult;
            if ( matches( this.node, selector ) ) {
                return this.node;
            }
            if ( this.html && ( queryResult = this.node.querySelector( selector ) ) ) {
                return queryResult;
            }
            if ( this.fragment && this.fragment.find ) {
                return this.fragment.find( selector );
            }
        };
    }( utils_matches );

    var render_DomFragment_Element_prototype_findAll = function( getMatchingStaticNodes ) {

        return function( selector, query ) {
            var matchingStaticNodes, matchedSelf;
            // Add this node to the query, if applicable, and register the
            // query on this element
            if ( query._test( this, true ) && query.live ) {
                ( this.liveQueries || ( this.liveQueries = [] ) ).push( query );
            }
            if ( this.html ) {
                matchingStaticNodes = getMatchingStaticNodes( this, selector );
                query.push.apply( query, matchingStaticNodes );
                if ( query.live && !matchedSelf ) {
                    ( this.liveQueries || ( this.liveQueries = [] ) ).push( query );
                }
            }
            if ( this.fragment ) {
                this.fragment.findAll( selector, query );
            }
        };
    }( render_DomFragment_Element_shared_getMatchingStaticNodes );

    var render_DomFragment_Element_prototype_findComponent = function( selector ) {
        if ( this.fragment ) {
            return this.fragment.findComponent( selector );
        }
    };

    var render_DomFragment_Element_prototype_findAllComponents = function( selector, query ) {
        if ( this.fragment ) {
            this.fragment.findAllComponents( selector, query );
        }
    };

    var render_DomFragment_Element_prototype_bind = function() {
        var attributes = this.attributes;
        if ( !this.node ) {
            // we're not in a browser!
            return;
        }
        // if this is a late binding, and there's already one, it
        // needs to be torn down
        if ( this.binding ) {
            this.binding.teardown();
            this.binding = null;
        }
        // contenteditable
        if ( this.node.getAttribute( 'contenteditable' ) && attributes.value && attributes.value.bind() ) {
            return;
        }
        // an element can only have one two-way attribute
        switch ( this.descriptor.e ) {
            case 'select':
            case 'textarea':
                if ( attributes.value ) {
                    attributes.value.bind();
                }
                return;
            case 'input':
                if ( this.node.type === 'radio' || this.node.type === 'checkbox' ) {
                    // we can either bind the name attribute, or the checked attribute - not both
                    if ( attributes.name && attributes.name.bind() ) {
                        return;
                    }
                    if ( attributes.checked && attributes.checked.bind() ) {
                        return;
                    }
                }
                if ( attributes.value && attributes.value.bind() ) {
                    return;
                }
        }
    };

    var render_DomFragment_Element__Element = function( runloop, css, initialise, teardown, reassign, toString, find, findAll, findComponent, findAllComponents, bind ) {

        var DomElement = function( options, docFrag ) {
            initialise( this, options, docFrag );
        };
        DomElement.prototype = {
            detach: function() {
                var Component;
                if ( this.node ) {
                    // need to check for parent node - DOM may have been altered
                    // by something other than Ractive! e.g. jQuery UI...
                    if ( this.node.parentNode ) {
                        this.node.parentNode.removeChild( this.node );
                    }
                    return this.node;
                }
                // If this element has child components with their own CSS, that CSS needs to
                // be removed now
                // TODO optimise this
                if ( this.cssDetachQueue.length ) {
                    runloop.start();
                    while ( Component === this.cssDetachQueue.pop() ) {
                        css.remove( Component );
                    }
                    runloop.end();
                }
            },
            teardown: teardown,
            reassign: reassign,
            firstNode: function() {
                return this.node;
            },
            findNextNode: function() {
                return null;
            },
            // TODO can we get rid of this?
            bubble: function() {},
            // just so event proxy and transition fragments have something to call!
            toString: toString,
            find: find,
            findAll: findAll,
            findComponent: findComponent,
            findAllComponents: findAllComponents,
            bind: bind
        };
        return DomElement;
    }( global_runloop, global_css, render_DomFragment_Element_initialise__initialise, render_DomFragment_Element_prototype_teardown, render_DomFragment_Element_prototype_reassign, render_DomFragment_Element_prototype_toString, render_DomFragment_Element_prototype_find, render_DomFragment_Element_prototype_findAll, render_DomFragment_Element_prototype_findComponent, render_DomFragment_Element_prototype_findAllComponents, render_DomFragment_Element_prototype_bind );

    var config_errors = {
        missingParser: 'Missing Ractive.parse - cannot parse template. Either preparse or use the version that includes the parser'
    };

    var registries_partials = {};

    var parse__parse = undefined;

    var render_DomFragment_Partial_deIndent = function() {

        var empty = /^\s*$/,
            leadingWhitespace = /^\s*/;
        return function( str ) {
            var lines, firstLine, lastLine, minIndent;
            lines = str.split( '\n' );
            // remove first and last line, if they only contain whitespace
            firstLine = lines[ 0 ];
            if ( firstLine !== undefined && empty.test( firstLine ) ) {
                lines.shift();
            }
            lastLine = lines[ lines.length - 1 ];
            if ( lastLine !== undefined && empty.test( lastLine ) ) {
                lines.pop();
            }
            minIndent = lines.reduce( reducer, null );
            if ( minIndent ) {
                str = lines.map( function( line ) {
                    return line.replace( minIndent, '' );
                } ).join( '\n' );
            }
            return str;
        };

        function reducer( previous, line ) {
            var lineIndent = leadingWhitespace.exec( line )[ 0 ];
            if ( previous === null || lineIndent.length < previous.length ) {
                return lineIndent;
            }
            return previous;
        }
    }();

    var render_DomFragment_Partial_getPartialDescriptor = function( errors, isClient, warn, isObject, partials, parse, deIndent ) {

        var getPartialDescriptor, registerPartial, getPartialFromRegistry, unpack;
        getPartialDescriptor = function( root, name ) {
            var el, partial, errorMessage;
            // If the partial was specified on this instance, great
            if ( partial = getPartialFromRegistry( root, name ) ) {
                return partial;
            }
            // Does it exist on the page as a script tag?
            if ( isClient ) {
                el = document.getElementById( name );
                if ( el && el.tagName === 'SCRIPT' ) {
                    if ( !parse ) {
                        throw new Error( errors.missingParser );
                    }
                    registerPartial( parse( deIndent( el.text ), root.parseOptions ), name, partials );
                }
            }
            partial = partials[ name ];
            // No match? Return an empty array
            if ( !partial ) {
                errorMessage = 'Could not find descriptor for partial "' + name + '"';
                if ( root.debug ) {
                    throw new Error( errorMessage );
                } else {
                    warn( errorMessage );
                }
                return [];
            }
            return unpack( partial );
        };
        getPartialFromRegistry = function( ractive, name ) {
            var partial;
            if ( ractive.partials[ name ] ) {
                // If this was added manually to the registry, but hasn't been parsed,
                // parse it now
                if ( typeof ractive.partials[ name ] === 'string' ) {
                    if ( !parse ) {
                        throw new Error( errors.missingParser );
                    }
                    partial = parse( ractive.partials[ name ], ractive.parseOptions );
                    registerPartial( partial, name, ractive.partials );
                }
                return unpack( ractive.partials[ name ] );
            }
        };
        registerPartial = function( partial, name, registry ) {
            var key;
            if ( isObject( partial ) ) {
                registry[ name ] = partial.main;
                for ( key in partial.partials ) {
                    if ( partial.partials.hasOwnProperty( key ) ) {
                        registry[ key ] = partial.partials[ key ];
                    }
                }
            } else {
                registry[ name ] = partial;
            }
        };
        unpack = function( partial ) {
            // Unpack string, if necessary
            if ( partial.length === 1 && typeof partial[ 0 ] === 'string' ) {
                return partial[ 0 ];
            }
            return partial;
        };
        return getPartialDescriptor;
    }( config_errors, config_isClient, utils_warn, utils_isObject, registries_partials, parse__parse, render_DomFragment_Partial_deIndent );

    var render_DomFragment_Partial_applyIndent = function( string, indent ) {
        var indented;
        if ( !indent ) {
            return string;
        }
        indented = string.split( '\n' ).map( function( line, notFirstLine ) {
            return notFirstLine ? indent + line : line;
        } ).join( '\n' );
        return indented;
    };

    var render_DomFragment_Partial__Partial = function( types, getPartialDescriptor, applyIndent, circular ) {

        var DomPartial, DomFragment;
        circular.push( function() {
            DomFragment = circular.DomFragment;
        } );
        DomPartial = function( options, docFrag ) {
            var parentFragment = this.parentFragment = options.parentFragment,
                descriptor;
            this.type = types.PARTIAL;
            this.name = options.descriptor.r;
            this.index = options.index;
            if ( !options.descriptor.r ) {
                // TODO support dynamic partial switching
                throw new Error( 'Partials must have a static reference (no expressions). This may change in a future version of Ractive.' );
            }
            descriptor = getPartialDescriptor( parentFragment.root, options.descriptor.r );
            this.fragment = new DomFragment( {
                descriptor: descriptor,
                root: parentFragment.root,
                pNode: parentFragment.pNode,
                owner: this
            } );
            if ( docFrag ) {
                docFrag.appendChild( this.fragment.docFrag );
            }
        };
        DomPartial.prototype = {
            firstNode: function() {
                return this.fragment.firstNode();
            },
            findNextNode: function() {
                return this.parentFragment.findNextNode( this );
            },
            detach: function() {
                return this.fragment.detach();
            },
            reassign: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                return this.fragment.reassign( indexRef, newIndex, oldKeypath, newKeypath );
            },
            teardown: function( destroy ) {
                this.fragment.teardown( destroy );
            },
            toString: function() {
                var string, previousItem, lastLine, match;
                string = this.fragment.toString();
                previousItem = this.parentFragment.items[ this.index - 1 ];
                if ( !previousItem || previousItem.type !== types.TEXT ) {
                    return string;
                }
                lastLine = previousItem.descriptor.split( '\n' ).pop();
                if ( match = /^\s+$/.exec( lastLine ) ) {
                    return applyIndent( string, match[ 0 ] );
                }
                return string;
            },
            find: function( selector ) {
                return this.fragment.find( selector );
            },
            findAll: function( selector, query ) {
                return this.fragment.findAll( selector, query );
            },
            findComponent: function( selector ) {
                return this.fragment.findComponent( selector );
            },
            findAllComponents: function( selector, query ) {
                return this.fragment.findAllComponents( selector, query );
            }
        };
        return DomPartial;
    }( config_types, render_DomFragment_Partial_getPartialDescriptor, render_DomFragment_Partial_applyIndent, circular );

    var render_DomFragment_Component_initialise_createModel_ComponentParameter = function( runloop, StringFragment ) {

        var ComponentParameter = function( component, key, value ) {
            this.parentFragment = component.parentFragment;
            this.component = component;
            this.key = key;
            this.fragment = new StringFragment( {
                descriptor: value,
                root: component.root,
                owner: this
            } );
            this.selfUpdating = this.fragment.isSimple();
            this.value = this.fragment.getValue();
        };
        ComponentParameter.prototype = {
            bubble: function() {
                // If there's a single item, we can update the component immediately...
                if ( this.selfUpdating ) {
                    this.update();
                } else if ( !this.deferred && this.ready ) {
                    runloop.addAttribute( this );
                    this.deferred = true;
                }
            },
            update: function() {
                var value = this.fragment.getValue();
                this.component.instance.set( this.key, value );
                this.value = value;
            },
            teardown: function() {
                this.fragment.teardown();
            }
        };
        return ComponentParameter;
    }( global_runloop, render_StringFragment__StringFragment );

    var render_DomFragment_Component_initialise_createModel__createModel = function( types, parseJSON, resolveRef, get, ComponentParameter ) {

        return function( component, defaultData, attributes, toBind ) {
            var data, key, value;
            data = {};
            // some parameters, e.g. foo="The value is {{bar}}", are 'complex' - in
            // other words, we need to construct a string fragment to watch
            // when they change. We store these so they can be torn down later
            component.complexParameters = [];
            for ( key in attributes ) {
                if ( attributes.hasOwnProperty( key ) ) {
                    value = getValue( component, key, attributes[ key ], toBind );
                    if ( value !== undefined || defaultData[ key ] === undefined ) {
                        data[ key ] = value;
                    }
                }
            }
            return data;
        };

        function getValue( component, key, descriptor, toBind ) {
            var parameter, parsed, parentInstance, parentFragment, keypath, indexRef;
            parentInstance = component.root;
            parentFragment = component.parentFragment;
            // If this is a static value, great
            if ( typeof descriptor === 'string' ) {
                parsed = parseJSON( descriptor );
                return parsed ? parsed.value : descriptor;
            }
            // If null, we treat it as a boolean attribute (i.e. true)
            if ( descriptor === null ) {
                return true;
            }
            // If a regular interpolator, we bind to it
            if ( descriptor.length === 1 && descriptor[ 0 ].t === types.INTERPOLATOR && descriptor[ 0 ].r ) {
                // Is it an index reference?
                if ( parentFragment.indexRefs && parentFragment.indexRefs[ indexRef = descriptor[ 0 ].r ] !== undefined ) {
                    component.indexRefBindings[ indexRef ] = key;
                    return parentFragment.indexRefs[ indexRef ];
                }
                // TODO what about references that resolve late? Should these be considered?
                keypath = resolveRef( parentInstance, descriptor[ 0 ].r, parentFragment ) || descriptor[ 0 ].r;
                // We need to set up bindings between parent and child, but
                // we can't do it yet because the child instance doesn't exist
                // yet - so we make a note instead
                toBind.push( {
                    childKeypath: key,
                    parentKeypath: keypath
                } );
                return get( parentInstance, keypath );
            }
            // We have a 'complex parameter' - we need to create a full-blown string
            // fragment in order to evaluate and observe its value
            parameter = new ComponentParameter( component, key, descriptor );
            component.complexParameters.push( parameter );
            return parameter.value;
        }
    }( config_types, utils_parseJSON, shared_resolveRef, shared_get__get, render_DomFragment_Component_initialise_createModel_ComponentParameter );

    var render_DomFragment_Component_initialise_createInstance = function() {

        return function( component, Component, data, docFrag, contentDescriptor ) {
            var instance, parentFragment, partials, root, adapt;
            parentFragment = component.parentFragment;
            root = component.root;
            // Make contents available as a {{>content}} partial
            partials = {
                content: contentDescriptor || []
            };
            // Use component default adaptors AND inherit parent adaptors.
            adapt = combineAdaptors( root, Component.defaults.adapt, Component.adaptors );
            instance = new Component( {
                el: parentFragment.pNode,
                append: true,
                data: data,
                partials: partials,
                magic: root.magic || Component.defaults.magic,
                modifyArrays: root.modifyArrays,
                _parent: root,
                _component: component,
                adapt: adapt
            } );
            if ( docFrag ) {
                // The component may be in the wrong place! This is because we
                // are still populating the document fragment that will be appended
                // to its parent node. So even though the component is *already*
                // a child of the parent node, we need to detach it, then insert
                // it into said document fragment, so that order is maintained
                // (both figuratively and literally).
                instance.insert( docFrag );
                // (After inserting, we need to reset the node reference)
                instance.fragment.pNode = instance.el = parentFragment.pNode;
            }
            return instance;
        };

        function combineAdaptors( root, defaultAdapt ) {
            var adapt, len, i;
            // Parent adaptors should take precedence, so they go first
            if ( root.adapt.length ) {
                adapt = root.adapt.map( function( stringOrObject ) {
                    if ( typeof stringOrObject === 'object' ) {
                        return stringOrObject;
                    }
                    return root.adaptors[ stringOrObject ] || stringOrObject;
                } );
            } else {
                adapt = [];
            }
            // If the component has any adaptors that aren't already included,
            // include them now
            if ( len = defaultAdapt.length ) {
                for ( i = 0; i < len; i += 1 ) {
                    if ( adapt.indexOf( defaultAdapt[ i ] ) === -1 ) {
                        adapt.push( defaultAdapt[ i ] );
                    }
                }
            }
            return adapt;
        }
    }();

    var render_DomFragment_Component_initialise_createBindings = function( createComponentBinding, get, set ) {

        return function createInitialComponentBindings( component, toBind ) {
            toBind.forEach( function createInitialComponentBinding( pair ) {
                var childValue, parentValue;
                createComponentBinding( component, component.root, pair.parentKeypath, pair.childKeypath );
                childValue = get( component.instance, pair.childKeypath );
                parentValue = get( component.root, pair.parentKeypath );
                if ( childValue !== undefined && parentValue === undefined ) {
                    set( component.root, pair.parentKeypath, childValue );
                }
            } );
        };
    }( shared_createComponentBinding, shared_get__get, shared_set );

    var render_DomFragment_Component_initialise_propagateEvents = function( warn ) {

        // TODO how should event arguments be handled? e.g.
        // <widget on-foo='bar:1,2,3'/>
        // The event 'bar' will be fired on the parent instance
        // when 'foo' fires on the child, but the 1,2,3 arguments
        // will be lost
        var errorMessage = 'Components currently only support simple events - you cannot include arguments. Sorry!';
        return function( component, eventsDescriptor ) {
            var eventName;
            for ( eventName in eventsDescriptor ) {
                if ( eventsDescriptor.hasOwnProperty( eventName ) ) {
                    propagateEvent( component.instance, component.root, eventName, eventsDescriptor[ eventName ] );
                }
            }
        };

        function propagateEvent( childInstance, parentInstance, eventName, proxyEventName ) {
            if ( typeof proxyEventName !== 'string' ) {
                if ( parentInstance.debug ) {
                    throw new Error( errorMessage );
                } else {
                    warn( errorMessage );
                    return;
                }
            }
            childInstance.on( eventName, function() {
                var args = Array.prototype.slice.call( arguments );
                args.unshift( proxyEventName );
                parentInstance.fire.apply( parentInstance, args );
            } );
        }
    }( utils_warn );

    var render_DomFragment_Component_initialise_updateLiveQueries = function( component ) {
        var ancestor, query;
        // If there's a live query for this component type, add it
        ancestor = component.root;
        while ( ancestor ) {
            if ( query = ancestor._liveComponentQueries[ component.name ] ) {
                query.push( component.instance );
            }
            ancestor = ancestor._parent;
        }
    };

    var render_DomFragment_Component_initialise__initialise = function( types, warn, createModel, createInstance, createBindings, propagateEvents, updateLiveQueries ) {

        return function initialiseComponent( component, options, docFrag ) {
            var parentFragment, root, Component, data, toBind;
            parentFragment = component.parentFragment = options.parentFragment;
            root = parentFragment.root;
            component.root = root;
            component.type = types.COMPONENT;
            component.name = options.descriptor.e;
            component.index = options.index;
            component.indexRefBindings = {};
            component.bindings = [];
            // get the component constructor
            Component = root.components[ options.descriptor.e ];
            if ( !Component ) {
                throw new Error( 'Component "' + options.descriptor.e + '" not found' );
            }
            // First, we need to create a model for the component - e.g. if we
            // encounter <widget foo='bar'/> then we need to create a widget
            // with `data: { foo: 'bar' }`.
            //
            // This may involve setting up some bindings, but we can't do it
            // yet so we take some notes instead
            toBind = [];
            data = createModel( component, Component.data || {}, options.descriptor.a, toBind );
            createInstance( component, Component, data, docFrag, options.descriptor.f );
            createBindings( component, toBind );
            propagateEvents( component, options.descriptor.v );
            // intro, outro and decorator directives have no effect
            if ( options.descriptor.t1 || options.descriptor.t2 || options.descriptor.o ) {
                warn( 'The "intro", "outro" and "decorator" directives have no effect on components' );
            }
            updateLiveQueries( component );
        };
    }( config_types, utils_warn, render_DomFragment_Component_initialise_createModel__createModel, render_DomFragment_Component_initialise_createInstance, render_DomFragment_Component_initialise_createBindings, render_DomFragment_Component_initialise_propagateEvents, render_DomFragment_Component_initialise_updateLiveQueries );

    var render_DomFragment_Component__Component = function( initialise, getNewKeypath ) {

        var DomComponent = function( options, docFrag ) {
            initialise( this, options, docFrag );
        };
        DomComponent.prototype = {
            firstNode: function() {
                return this.instance.fragment.firstNode();
            },
            findNextNode: function() {
                return this.parentFragment.findNextNode( this );
            },
            detach: function() {
                return this.instance.fragment.detach();
            },
            teardown: function( destroy ) {
                while ( this.complexParameters.length ) {
                    this.complexParameters.pop().teardown();
                }
                while ( this.bindings.length ) {
                    this.bindings.pop().teardown();
                }
                removeFromLiveComponentQueries( this );
                // Add this flag so that we don't unnecessarily destroy the component's nodes
                this.shouldDestroy = destroy;
                this.instance.teardown();
            },
            reassign: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                var childInstance = this.instance,
                    parentInstance = childInstance._parent,
                    indexRefAlias, query;
                this.bindings.forEach( function( binding ) {
                    var updated;
                    if ( binding.root !== parentInstance ) {
                        return;
                    }
                    if ( binding.keypath === indexRef ) {
                        childInstance.set( binding.otherKeypath, newIndex );
                    }
                    if ( updated = getNewKeypath( binding.keypath, oldKeypath, newKeypath ) ) {
                        binding.reassign( updated );
                    }
                } );
                if ( indexRefAlias = this.indexRefBindings[ indexRef ] ) {
                    childInstance.set( indexRefAlias, newIndex );
                }
                if ( query = this.root._liveComponentQueries[ this.name ] ) {
                    query._makeDirty();
                }
            },
            toString: function() {
                return this.instance.fragment.toString();
            },
            find: function( selector ) {
                return this.instance.fragment.find( selector );
            },
            findAll: function( selector, query ) {
                return this.instance.fragment.findAll( selector, query );
            },
            findComponent: function( selector ) {
                if ( !selector || selector === this.name ) {
                    return this.instance;
                }
                if ( this.instance.fragment ) {
                    return this.instance.fragment.findComponent( selector );
                }
                return null;
            },
            findAllComponents: function( selector, query ) {
                query._test( this, true );
                if ( this.instance.fragment ) {
                    this.instance.fragment.findAllComponents( selector, query );
                }
            }
        };
        return DomComponent;

        function removeFromLiveComponentQueries( component ) {
            var instance, query;
            instance = component.root;
            do {
                if ( query = instance._liveComponentQueries[ component.name ] ) {
                    query._remove( component );
                }
            } while ( instance = instance._parent );
        }
    }( render_DomFragment_Component_initialise__initialise, render_shared_utils_getNewKeypath );

    var render_DomFragment_Comment = function( types, detach ) {

        var DomComment = function( options, docFrag ) {
            this.type = types.COMMENT;
            this.descriptor = options.descriptor;
            if ( docFrag ) {
                this.node = document.createComment( options.descriptor.f );
                docFrag.appendChild( this.node );
            }
        };
        DomComment.prototype = {
            detach: detach,
            teardown: function( destroy ) {
                if ( destroy ) {
                    this.detach();
                }
            },
            firstNode: function() {
                return this.node;
            },
            toString: function() {
                return '<!--' + this.descriptor.f + '-->';
            }
        };
        return DomComment;
    }( config_types, render_DomFragment_shared_detach );

    var render_DomFragment__DomFragment = function( types, matches, Fragment, insertHtml, Text, Interpolator, Section, Triple, Element, Partial, Component, Comment, circular ) {

        var DomFragment = function( options ) {
            if ( options.pNode ) {
                this.docFrag = document.createDocumentFragment();
            }
            // if we have an HTML string, our job is easy.
            if ( typeof options.descriptor === 'string' ) {
                this.html = options.descriptor;
                if ( this.docFrag ) {
                    this.nodes = insertHtml( this.html, options.pNode.tagName, options.pNode.namespaceURI, this.docFrag );
                }
            } else {
                // otherwise we need to make a proper fragment
                Fragment.init( this, options );
            }
        };
        DomFragment.prototype = {
            reassign: Fragment.reassign,
            detach: function() {
                var len, i;
                if ( this.docFrag ) {
                    // if this was built from HTML, we just need to remove the nodes
                    if ( this.nodes ) {
                        len = this.nodes.length;
                        for ( i = 0; i < len; i += 1 ) {
                            this.docFrag.appendChild( this.nodes[ i ] );
                        }
                    } else if ( this.items ) {
                        len = this.items.length;
                        for ( i = 0; i < len; i += 1 ) {
                            this.docFrag.appendChild( this.items[ i ].detach() );
                        }
                    }
                    return this.docFrag;
                }
            },
            createItem: function( options ) {
                if ( typeof options.descriptor === 'string' ) {
                    return new Text( options, this.docFrag );
                }
                switch ( options.descriptor.t ) {
                    case types.INTERPOLATOR:
                        return new Interpolator( options, this.docFrag );
                    case types.SECTION:
                        return new Section( options, this.docFrag );
                    case types.TRIPLE:
                        return new Triple( options, this.docFrag );
                    case types.ELEMENT:
                        if ( this.root.components[ options.descriptor.e ] ) {
                            return new Component( options, this.docFrag );
                        }
                        return new Element( options, this.docFrag );
                    case types.PARTIAL:
                        return new Partial( options, this.docFrag );
                    case types.COMMENT:
                        return new Comment( options, this.docFrag );
                    default:
                        throw new Error( 'Something very strange happened. Please file an issue at https://github.com/RactiveJS/Ractive/issues. Thanks!' );
                }
            },
            teardown: function( destroy ) {
                var node;
                // if this was built from HTML, we just need to remove the nodes
                if ( this.nodes && destroy ) {
                    while ( node = this.nodes.pop() ) {
                        node.parentNode.removeChild( node );
                    }
                } else if ( this.items ) {
                    while ( this.items.length ) {
                        this.items.pop().teardown( destroy );
                    }
                }
                this.nodes = this.items = this.docFrag = null;
            },
            firstNode: function() {
                if ( this.items && this.items[ 0 ] ) {
                    return this.items[ 0 ].firstNode();
                } else if ( this.nodes ) {
                    return this.nodes[ 0 ] || null;
                }
                return null;
            },
            findNextNode: function( item ) {
                var index = item.index;
                if ( this.items[ index + 1 ] ) {
                    return this.items[ index + 1 ].firstNode();
                }
                // if this is the root fragment, and there are no more items,
                // it means we're at the end...
                if ( this.owner === this.root ) {
                    if ( !this.owner.component ) {
                        return null;
                    }
                    // ...unless this is a component
                    return this.owner.component.findNextNode();
                }
                return this.owner.findNextNode( this );
            },
            toString: function() {
                var html, i, len, item;
                if ( this.html ) {
                    return this.html;
                }
                html = '';
                if ( !this.items ) {
                    return html;
                }
                len = this.items.length;
                for ( i = 0; i < len; i += 1 ) {
                    item = this.items[ i ];
                    html += item.toString();
                }
                return html;
            },
            find: function( selector ) {
                var i, len, item, node, queryResult;
                if ( this.nodes ) {
                    len = this.nodes.length;
                    for ( i = 0; i < len; i += 1 ) {
                        node = this.nodes[ i ];
                        // we only care about elements
                        if ( node.nodeType !== 1 ) {
                            continue;
                        }
                        if ( matches( node, selector ) ) {
                            return node;
                        }
                        if ( queryResult = node.querySelector( selector ) ) {
                            return queryResult;
                        }
                    }
                    return null;
                }
                if ( this.items ) {
                    len = this.items.length;
                    for ( i = 0; i < len; i += 1 ) {
                        item = this.items[ i ];
                        if ( item.find && ( queryResult = item.find( selector ) ) ) {
                            return queryResult;
                        }
                    }
                    return null;
                }
            },
            findAll: function( selector, query ) {
                var i, len, item, node, queryAllResult, numNodes, j;
                if ( this.nodes ) {
                    len = this.nodes.length;
                    for ( i = 0; i < len; i += 1 ) {
                        node = this.nodes[ i ];
                        // we only care about elements
                        if ( node.nodeType !== 1 ) {
                            continue;
                        }
                        if ( matches( node, selector ) ) {
                            query.push( node );
                        }
                        if ( queryAllResult = node.querySelectorAll( selector ) ) {
                            numNodes = queryAllResult.length;
                            for ( j = 0; j < numNodes; j += 1 ) {
                                query.push( queryAllResult[ j ] );
                            }
                        }
                    }
                } else if ( this.items ) {
                    len = this.items.length;
                    for ( i = 0; i < len; i += 1 ) {
                        item = this.items[ i ];
                        if ( item.findAll ) {
                            item.findAll( selector, query );
                        }
                    }
                }
                return query;
            },
            findComponent: function( selector ) {
                var len, i, item, queryResult;
                if ( this.items ) {
                    len = this.items.length;
                    for ( i = 0; i < len; i += 1 ) {
                        item = this.items[ i ];
                        if ( item.findComponent && ( queryResult = item.findComponent( selector ) ) ) {
                            return queryResult;
                        }
                    }
                    return null;
                }
            },
            findAllComponents: function( selector, query ) {
                var i, len, item;
                if ( this.items ) {
                    len = this.items.length;
                    for ( i = 0; i < len; i += 1 ) {
                        item = this.items[ i ];
                        if ( item.findAllComponents ) {
                            item.findAllComponents( selector, query );
                        }
                    }
                }
                return query;
            }
        };
        circular.DomFragment = DomFragment;
        return DomFragment;
    }( config_types, utils_matches, render_shared_Fragment__Fragment, render_DomFragment_shared_insertHtml, render_DomFragment_Text, render_DomFragment_Interpolator, render_DomFragment_Section__Section, render_DomFragment_Triple, render_DomFragment_Element__Element, render_DomFragment_Partial__Partial, render_DomFragment_Component__Component, render_DomFragment_Comment, circular );

    var Ractive_prototype_render = function( runloop, css, DomFragment ) {

        return function Ractive_prototype_render( target, callback ) {
            this._rendering = true;
            runloop.start( this, callback );
            // This method is part of the API for one reason only - so that it can be
            // overwritten by components that don't want to use the templating system
            // (e.g. canvas-based components). It shouldn't be called outside of the
            // initialisation sequence!
            if ( !this._initing ) {
                throw new Error( 'You cannot call ractive.render() directly!' );
            }
            // Add CSS, if applicable
            if ( this.constructor.css ) {
                css.add( this.constructor );
            }
            // Render our *root fragment*
            this.fragment = new DomFragment( {
                descriptor: this.template,
                root: this,
                owner: this,
                // saves doing `if ( this.parent ) { /*...*/ }` later on
                pNode: target
            } );
            if ( target ) {
                target.appendChild( this.fragment.docFrag );
            }
            // If this is *isn't* a child of a component that's in the process of rendering,
            // it should call any `init()` methods at this point
            if ( !this._parent || !this._parent._rendering ) {
                initChildren( this );
            }
            delete this._rendering;
            runloop.end();
        };

        function initChildren( instance ) {
            var child;
            while ( child = instance._childInitQueue.pop() ) {
                if ( child.instance.init ) {
                    child.instance.init( child.options );
                }
                // now do the same for grandchildren, etc
                initChildren( child.instance );
            }
        }
    }( global_runloop, global_css, render_DomFragment__DomFragment );

    var Ractive_prototype_renderHTML = function( warn ) {

        return function() {
            // TODO remove this method in a future version!
            warn( 'renderHTML() has been deprecated and will be removed in a future version. Please use toHTML() instead' );
            return this.toHTML();
        };
    }( utils_warn );

    var Ractive_prototype_reset = function( Promise, runloop, clearCache, notifyDependants ) {

        return function( data, callback ) {
            var promise, fulfilPromise, wrapper;
            if ( typeof data === 'function' ) {
                callback = data;
                data = {};
            } else {
                data = data || {};
            }
            if ( typeof data !== 'object' ) {
                throw new Error( 'The reset method takes either no arguments, or an object containing new data' );
            }
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            if ( callback ) {
                promise.then( callback );
            }
            runloop.start( this, fulfilPromise );
            // If the root object is wrapped, try and use the wrapper's reset value
            if ( ( wrapper = this._wrapped[ '' ] ) && wrapper.reset ) {
                if ( wrapper.reset( data ) === false ) {
                    // reset was rejected, we need to replace the object
                    this.data = data;
                }
            } else {
                this.data = data;
            }
            clearCache( this, '' );
            notifyDependants( this, '' );
            runloop.end();
            this.fire( 'reset', data );
            return promise;
        };
    }( utils_Promise, global_runloop, shared_clearCache, shared_notifyDependants );

    var Ractive_prototype_set = function( runloop, isObject, normaliseKeypath, Promise, set ) {

        return function Ractive_prototype_set( keypath, value, callback ) {
            var map, promise, fulfilPromise;
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            runloop.start( this, fulfilPromise );
            // Set multiple keypaths in one go
            if ( isObject( keypath ) ) {
                map = keypath;
                callback = value;
                for ( keypath in map ) {
                    if ( map.hasOwnProperty( keypath ) ) {
                        value = map[ keypath ];
                        keypath = normaliseKeypath( keypath );
                        set( this, keypath, value );
                    }
                }
            } else {
                keypath = normaliseKeypath( keypath );
                set( this, keypath, value );
            }
            runloop.end();
            if ( callback ) {
                promise.then( callback.bind( this ) );
            }
            return promise;
        };
    }( global_runloop, utils_isObject, utils_normaliseKeypath, utils_Promise, shared_set );

    var Ractive_prototype_subtract = function( add ) {

        return function( keypath, d ) {
            return add( this, keypath, d === undefined ? -1 : -d );
        };
    }( Ractive_prototype_shared_add );

    // Teardown. This goes through the root fragment and all its children, removing observers
    // and generally cleaning up after itself
    var Ractive_prototype_teardown = function( types, css, runloop, Promise, clearCache ) {

        return function( callback ) {
            var keypath, promise, fulfilPromise, shouldDestroy, originalCallback, fragment, nearestDetachingElement, unresolvedImplicitDependency;
            this.fire( 'teardown' );
            // If this is a component, and the component isn't marked for destruction,
            // don't detach nodes from the DOM unnecessarily
            shouldDestroy = !this.component || this.component.shouldDestroy;
            if ( this.constructor.css ) {
                // We need to find the nearest detaching element. When it gets removed
                // from the DOM, it's safe to remove our CSS
                if ( shouldDestroy ) {
                    originalCallback = callback;
                    callback = function() {
                        if ( originalCallback ) {
                            originalCallback.call( this );
                        }
                        css.remove( this.constructor );
                    };
                } else {
                    fragment = this.component.parentFragment;
                    do {
                        if ( fragment.owner.type !== types.ELEMENT ) {
                            continue;
                        }
                        if ( fragment.owner.willDetach ) {
                            nearestDetachingElement = fragment.owner;
                        }
                    } while ( !nearestDetachingElement && ( fragment = fragment.parent ) );
                    if ( !nearestDetachingElement ) {
                        throw new Error( 'A component is being torn down but doesn\'t have a nearest detaching element... this shouldn\'t happen!' );
                    }
                    nearestDetachingElement.cssDetachQueue.push( this.constructor );
                }
            }
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            runloop.start( this, fulfilPromise );
            this.fragment.teardown( shouldDestroy );
            // Cancel any animations in progress
            while ( this._animations[ 0 ] ) {
                this._animations[ 0 ].stop();
            }
            // Clear cache - this has the side-effect of unregistering keypaths from modified arrays.
            for ( keypath in this._cache ) {
                clearCache( this, keypath );
            }
            // Teardown any failed lookups - we don't need them to resolve any more
            while ( unresolvedImplicitDependency = this._unresolvedImplicitDependencies.pop() ) {
                unresolvedImplicitDependency.teardown();
            }
            runloop.end();
            if ( callback ) {
                promise.then( callback.bind( this ) );
            }
            return promise;
        };
    }( config_types, global_css, global_runloop, utils_Promise, shared_clearCache );

    var Ractive_prototype_toHTML = function() {
        return this.fragment.toString();
    };

    var Ractive_prototype_toggle = function( keypath, callback ) {
        var value;
        if ( typeof keypath !== 'string' ) {
            if ( this.debug ) {
                throw new Error( 'Bad arguments' );
            }
            return;
        }
        value = this.get( keypath );
        return this.set( keypath, !value, callback );
    };

    var Ractive_prototype_update = function( runloop, Promise, clearCache, notifyDependants ) {

        return function( keypath, callback ) {
            var promise, fulfilPromise;
            if ( typeof keypath === 'function' ) {
                callback = keypath;
                keypath = '';
            } else {
                keypath = keypath || '';
            }
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            runloop.start( this, fulfilPromise );
            clearCache( this, keypath );
            notifyDependants( this, keypath );
            runloop.end();
            this.fire( 'update', keypath );
            if ( callback ) {
                promise.then( callback.bind( this ) );
            }
            return promise;
        };
    }( global_runloop, utils_Promise, shared_clearCache, shared_notifyDependants );

    var Ractive_prototype_updateModel = function( getValueFromCheckboxes, arrayContentsMatch, isEqual ) {

        return function Ractive_prototype_updateModel( keypath, cascade ) {
            var values, deferredCheckboxes, i;
            if ( typeof keypath !== 'string' ) {
                keypath = '';
                cascade = true;
            }
            consolidateChangedValues( this, keypath, values = {}, deferredCheckboxes = [], cascade );
            if ( i = deferredCheckboxes.length ) {
                while ( i-- ) {
                    keypath = deferredCheckboxes[ i ];
                    values[ keypath ] = getValueFromCheckboxes( this, keypath );
                }
            }
            this.set( values );
        };

        function consolidateChangedValues( ractive, keypath, values, deferredCheckboxes, cascade ) {
            var bindings, childDeps, i, binding, oldValue, newValue;
            bindings = ractive._twowayBindings[ keypath ];
            if ( bindings ) {
                i = bindings.length;
                while ( i-- ) {
                    binding = bindings[ i ];
                    // special case - radio name bindings
                    if ( binding.radioName && !binding.node.checked ) {
                        continue;
                    }
                    // special case - checkbox name bindings
                    if ( binding.checkboxName ) {
                        if ( binding.changed() && deferredCheckboxes[ keypath ] !== true ) {
                            // we will need to see which checkboxes with the same name are checked,
                            // but we only want to do so once
                            deferredCheckboxes[ keypath ] = true;
                            // for quick lookup without indexOf
                            deferredCheckboxes.push( keypath );
                        }
                        continue;
                    }
                    oldValue = binding.attr.value;
                    newValue = binding.value();
                    if ( arrayContentsMatch( oldValue, newValue ) ) {
                        continue;
                    }
                    if ( !isEqual( oldValue, newValue ) ) {
                        values[ keypath ] = newValue;
                    }
                }
            }
            if ( !cascade ) {
                return;
            }
            // cascade
            childDeps = ractive._depsMap[ keypath ];
            if ( childDeps ) {
                i = childDeps.length;
                while ( i-- ) {
                    consolidateChangedValues( ractive, childDeps[ i ], values, deferredCheckboxes, cascade );
                }
            }
        }
    }( shared_getValueFromCheckboxes, utils_arrayContentsMatch, utils_isEqual );

    var Ractive_prototype__prototype = function( add, animate, detach, find, findAll, findAllComponents, findComponent, fire, get, insert, merge, observe, off, on, render, renderHTML, reset, set, subtract, teardown, toHTML, toggle, update, updateModel ) {

        return {
            add: add,
            animate: animate,
            detach: detach,
            find: find,
            findAll: findAll,
            findAllComponents: findAllComponents,
            findComponent: findComponent,
            fire: fire,
            get: get,
            insert: insert,
            merge: merge,
            observe: observe,
            off: off,
            on: on,
            render: render,
            renderHTML: renderHTML,
            reset: reset,
            set: set,
            subtract: subtract,
            teardown: teardown,
            toHTML: toHTML,
            toggle: toggle,
            update: update,
            updateModel: updateModel
        };
    }( Ractive_prototype_add, Ractive_prototype_animate__animate, Ractive_prototype_detach, Ractive_prototype_find, Ractive_prototype_findAll, Ractive_prototype_findAllComponents, Ractive_prototype_findComponent, Ractive_prototype_fire, Ractive_prototype_get, Ractive_prototype_insert, Ractive_prototype_merge__merge, Ractive_prototype_observe__observe, Ractive_prototype_off, Ractive_prototype_on, Ractive_prototype_render, Ractive_prototype_renderHTML, Ractive_prototype_reset, Ractive_prototype_set, Ractive_prototype_subtract, Ractive_prototype_teardown, Ractive_prototype_toHTML, Ractive_prototype_toggle, Ractive_prototype_update, Ractive_prototype_updateModel );

    var registries_components = {};

    // These are a subset of the easing equations found at
    // https://raw.github.com/danro/easing-js - license info
    // follows:
    // --------------------------------------------------
    // easing.js v0.5.4
    // Generic set of easing functions with AMD support
    // https://github.com/danro/easing-js
    // This code may be freely distributed under the MIT license
    // http://danro.mit-license.org/
    // --------------------------------------------------
    // All functions adapted from Thomas Fuchs & Jeremy Kahn
    // Easing Equations (c) 2003 Robert Penner, BSD license
    // https://raw.github.com/danro/easing-js/master/LICENSE
    // --------------------------------------------------
    // In that library, the functions named easeIn, easeOut, and
    // easeInOut below are named easeInCubic, easeOutCubic, and
    // (you guessed it) easeInOutCubic.
    //
    // You can add additional easing functions to this list, and they
    // will be globally available.
    var registries_easing = {
        linear: function( pos ) {
            return pos;
        },
        easeIn: function( pos ) {
            return Math.pow( pos, 3 );
        },
        easeOut: function( pos ) {
            return Math.pow( pos - 1, 3 ) + 1;
        },
        easeInOut: function( pos ) {
            if ( ( pos /= 0.5 ) < 1 ) {
                return 0.5 * Math.pow( pos, 3 );
            }
            return 0.5 * ( Math.pow( pos - 2, 3 ) + 2 );
        }
    };

    var utils_getGuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
            var r, v;
            r = Math.random() * 16 | 0;
            v = c == 'x' ? r : r & 3 | 8;
            return v.toString( 16 );
        } );
    };

    var utils_extend = function( target ) {
        var prop, source, sources = Array.prototype.slice.call( arguments, 1 );
        while ( source = sources.shift() ) {
            for ( prop in source ) {
                if ( source.hasOwnProperty( prop ) ) {
                    target[ prop ] = source[ prop ];
                }
            }
        }
        return target;
    };

    var config_registries = [
        'adaptors',
        'components',
        'decorators',
        'easing',
        'events',
        'interpolators',
        'partials',
        'transitions',
        'data'
    ];

    var extend_utils_transformCss = function() {

        var selectorsPattern = /(?:^|\})?\s*([^\{\}]+)\s*\{/g,
            commentsPattern = /\/\*.*?\*\//g,
            selectorUnitPattern = /((?:(?:\[[^\]+]\])|(?:[^\s\+\>\~:]))+)((?::[^\s\+\>\~]+)?\s*[\s\+\>\~]?)\s*/g;
        return function transformCss( css, guid ) {
            var transformed, addGuid;
            addGuid = function( selector ) {
                var selectorUnits, match, unit, dataAttr, base, prepended, appended, i, transformed = [];
                selectorUnits = [];
                while ( match = selectorUnitPattern.exec( selector ) ) {
                    selectorUnits.push( {
                        str: match[ 0 ],
                        base: match[ 1 ],
                        modifiers: match[ 2 ]
                    } );
                }
                // For each simple selector within the selector, we need to create a version
                // that a) combines with the guid, and b) is inside the guid
                dataAttr = '[data-rvcguid="' + guid + '"]';
                base = selectorUnits.map( extractString );
                i = selectorUnits.length;
                while ( i-- ) {
                    appended = base.slice();
                    // Pseudo-selectors should go after the attribute selector
                    unit = selectorUnits[ i ];
                    appended[ i ] = unit.base + dataAttr + unit.modifiers || '';
                    prepended = base.slice();
                    prepended[ i ] = dataAttr + ' ' + prepended[ i ];
                    transformed.push( appended.join( ' ' ), prepended.join( ' ' ) );
                }
                return transformed.join( ', ' );
            };
            transformed = css.replace( commentsPattern, '' ).replace( selectorsPattern, function( match, $1 ) {
                var selectors, transformed;
                selectors = $1.split( ',' ).map( trim );
                transformed = selectors.map( addGuid ).join( ', ' ) + ' ';
                return match.replace( $1, transformed );
            } );
            return transformed;
        };

        function trim( str ) {
            if ( str.trim ) {
                return str.trim();
            }
            return str.replace( /^\s+/, '' ).replace( /\s+$/, '' );
        }

        function extractString( unit ) {
            return unit.str;
        }
    }();

    var extend_inheritFromParent = function( registries, create, defineProperty, transformCss ) {

        // This is where we inherit class-level options, such as `modifyArrays`
        // or `append` or `twoway`, and registries such as `partials`
        return function( Child, Parent ) {
            registries.forEach( function( property ) {
                if ( Parent[ property ] ) {
                    Child[ property ] = create( Parent[ property ] );
                }
            } );
            defineProperty( Child, 'defaults', {
                value: create( Parent.defaults )
            } );
            // Special case - CSS
            if ( Parent.css ) {
                defineProperty( Child, 'css', {
                    value: Parent.defaults.noCssTransform ? Parent.css : transformCss( Parent.css, Child._guid )
                } );
            }
        };
    }( config_registries, utils_create, utils_defineProperty, extend_utils_transformCss );

    var extend_wrapMethod = function( method, superMethod ) {
        if ( /_super/.test( method ) ) {
            return function() {
                var _super = this._super,
                    result;
                this._super = superMethod;
                result = method.apply( this, arguments );
                this._super = _super;
                return result;
            };
        } else {
            return method;
        }
    };

    var extend_utils_augment = function( target, source ) {
        var key;
        for ( key in source ) {
            if ( source.hasOwnProperty( key ) ) {
                target[ key ] = source[ key ];
            }
        }
        return target;
    };

    var extend_inheritFromChildProps = function( initOptions, registries, defineProperty, wrapMethod, augment, transformCss ) {

        var blacklisted = {};
        registries.concat( initOptions.keys ).forEach( function( property ) {
            blacklisted[ property ] = true;
        } );
        // This is where we augment the class-level options (inherited from
        // Parent) with the values passed to Parent.extend()
        return function( Child, childProps ) {
            var key, member;
            registries.forEach( function( property ) {
                var value = childProps[ property ];
                if ( value ) {
                    if ( Child[ property ] ) {
                        augment( Child[ property ], value );
                    } else {
                        Child[ property ] = value;
                    }
                }
            } );
            initOptions.keys.forEach( function( key ) {
                var value = childProps[ key ];
                if ( value !== undefined ) {
                    // we may need to wrap a function (e.g. the `complete` option)
                    if ( typeof value === 'function' && typeof Child[ key ] === 'function' ) {
                        Child.defaults[ key ] = wrapMethod( value, Child[ key ] );
                    } else {
                        Child.defaults[ key ] = childProps[ key ];
                    }
                }
            } );
            for ( key in childProps ) {
                if ( !blacklisted[ key ] && childProps.hasOwnProperty( key ) ) {
                    member = childProps[ key ];
                    // if this is a method that overwrites a prototype method, we may need
                    // to wrap it
                    if ( typeof member === 'function' && typeof Child.prototype[ key ] === 'function' ) {
                        Child.prototype[ key ] = wrapMethod( member, Child.prototype[ key ] );
                    } else {
                        Child.prototype[ key ] = member;
                    }
                }
            }
            // Special case - CSS
            if ( childProps.css ) {
                defineProperty( Child, 'css', {
                    value: Child.defaults.noCssTransform ? childProps.css : transformCss( childProps.css, Child._guid )
                } );
            }
        };
    }( config_initOptions, config_registries, utils_defineProperty, extend_wrapMethod, extend_utils_augment, extend_utils_transformCss );

    var extend_extractInlinePartials = function( isObject, augment ) {

        return function( Child, childProps ) {
            // does our template contain inline partials?
            if ( isObject( Child.defaults.template ) ) {
                if ( !Child.partials ) {
                    Child.partials = {};
                }
                // get those inline partials
                augment( Child.partials, Child.defaults.template.partials );
                // but we also need to ensure that any explicit partials override inline ones
                if ( childProps.partials ) {
                    augment( Child.partials, childProps.partials );
                }
                // move template to where it belongs
                Child.defaults.template = Child.defaults.template.main;
            }
        };
    }( utils_isObject, extend_utils_augment );

    var extend_conditionallyParseTemplate = function( errors, isClient, parse ) {

        return function( Child ) {
            var templateEl;
            if ( typeof Child.defaults.template === 'string' ) {
                if ( !parse ) {
                    throw new Error( errors.missingParser );
                }
                if ( Child.defaults.template.charAt( 0 ) === '#' && isClient ) {
                    templateEl = document.getElementById( Child.defaults.template.substring( 1 ) );
                    if ( templateEl && templateEl.tagName === 'SCRIPT' ) {
                        Child.defaults.template = parse( templateEl.innerHTML, Child );
                    } else {
                        throw new Error( 'Could not find template element (' + Child.defaults.template + ')' );
                    }
                } else {
                    Child.defaults.template = parse( Child.defaults.template, Child.defaults );
                }
            }
        };
    }( config_errors, config_isClient, parse__parse );

    var extend_conditionallyParsePartials = function( errors, parse ) {

        return function( Child ) {
            var key;
            // Parse partials, if necessary
            if ( Child.partials ) {
                for ( key in Child.partials ) {
                    if ( Child.partials.hasOwnProperty( key ) && typeof Child.partials[ key ] === 'string' ) {
                        if ( !parse ) {
                            throw new Error( errors.missingParser );
                        }
                        Child.partials[ key ] = parse( Child.partials[ key ], Child );
                    }
                }
            }
        };
    }( config_errors, parse__parse );

    var Ractive_initialise_computations_getComputationSignature = function() {

        var pattern = /\$\{([^\}]+)\}/g;
        return function( signature ) {
            if ( typeof signature === 'function' ) {
                return {
                    get: signature
                };
            }
            if ( typeof signature === 'string' ) {
                return {
                    get: createFunctionFromString( signature )
                };
            }
            if ( typeof signature === 'object' && typeof signature.get === 'string' ) {
                signature = {
                    get: createFunctionFromString( signature.get ),
                    set: signature.set
                };
            }
            return signature;
        };

        function createFunctionFromString( signature ) {
            var functionBody = 'var __ractive=this;return(' + signature.replace( pattern, function( match, keypath ) {
                return '__ractive.get("' + keypath + '")';
            } ) + ')';
            return new Function( functionBody );
        }
    }();

    var Ractive_initialise_computations_Watcher = function( isEqual, registerDependant, unregisterDependant ) {

        var Watcher = function( computation, keypath ) {
            this.root = computation.ractive;
            this.keypath = keypath;
            this.priority = 0;
            this.computation = computation;
            registerDependant( this );
        };
        Watcher.prototype = {
            update: function() {
                var value;
                value = this.root.get( this.keypath );
                if ( !isEqual( value, this.value ) ) {
                    this.computation.bubble();
                }
            },
            teardown: function() {
                unregisterDependant( this );
            }
        };
        return Watcher;
    }( utils_isEqual, shared_registerDependant, shared_unregisterDependant );

    var Ractive_initialise_computations_Computation = function( warn, runloop, set, Watcher ) {

        var Computation = function( ractive, key, signature ) {
            this.ractive = ractive;
            this.key = key;
            this.getter = signature.get;
            this.setter = signature.set;
            this.watchers = [];
            this.update();
        };
        Computation.prototype = {
            set: function( value ) {
                if ( this.setting ) {
                    this.value = value;
                    return;
                }
                if ( !this.setter ) {
                    throw new Error( 'Computed properties without setters are read-only in the current version' );
                }
                this.setter.call( this.ractive, value );
            },
            update: function() {
                var ractive, originalCaptured, result, errored;
                ractive = this.ractive;
                originalCaptured = ractive._captured;
                if ( !originalCaptured ) {
                    ractive._captured = [];
                }
                try {
                    result = this.getter.call( ractive );
                } catch ( err ) {
                    if ( ractive.debug ) {
                        warn( 'Failed to compute "' + this.key + '": ' + err.message || err );
                    }
                    errored = true;
                }
                diff( this, this.watchers, ractive._captured );
                // reset
                ractive._captured = originalCaptured;
                if ( !errored ) {
                    this.setting = true;
                    this.value = result;
                    set( ractive, this.key, result );
                    this.setting = false;
                }
                this.deferred = false;
            },
            bubble: function() {
                if ( this.watchers.length <= 1 ) {
                    this.update();
                } else if ( !this.deferred ) {
                    runloop.addComputation( this );
                    this.deferred = true;
                }
            }
        };

        function diff( computation, watchers, newDependencies ) {
            var i, watcher, keypath;
            // remove dependencies that are no longer used
            i = watchers.length;
            while ( i-- ) {
                watcher = watchers[ i ];
                if ( !newDependencies[ watcher.keypath ] ) {
                    watchers.splice( i, 1 );
                    watchers[ watcher.keypath ] = null;
                    watcher.teardown();
                }
            }
            // create references for any new dependencies
            i = newDependencies.length;
            while ( i-- ) {
                keypath = newDependencies[ i ];
                if ( !watchers[ keypath ] ) {
                    watcher = new Watcher( computation, keypath );
                    watchers.push( watchers[ keypath ] = watcher );
                }
            }
        }
        return Computation;
    }( utils_warn, global_runloop, shared_set, Ractive_initialise_computations_Watcher );

    var Ractive_initialise_computations_createComputations = function( getComputationSignature, Computation ) {

        return function createComputations( ractive, computed ) {
            var key, signature;
            for ( key in computed ) {
                signature = getComputationSignature( computed[ key ] );
                ractive._computations[ key ] = new Computation( ractive, key, signature );
            }
        };
    }( Ractive_initialise_computations_getComputationSignature, Ractive_initialise_computations_Computation );

    var Ractive_initialise = function( isClient, errors, initOptions, registries, warn, create, extend, fillGaps, defineProperties, getElement, isObject, isArray, getGuid, Promise, magicAdaptor, parse, createComputations ) {

        var flags = [
            'adapt',
            'modifyArrays',
            'magic',
            'twoway',
            'lazy',
            'debug',
            'isolated'
        ];
        return function initialiseRactiveInstance( ractive, options ) {
            var defaults, template, templateEl, parsedTemplate, promise, fulfilPromise, computed;
            if ( isArray( options.adaptors ) ) {
                warn( 'The `adaptors` option, to indicate which adaptors should be used with a given Ractive instance, has been deprecated in favour of `adapt`. See [TODO] for more information' );
                options.adapt = options.adaptors;
                delete options.adaptors;
            }
            // Options
            // -------
            defaults = ractive.constructor.defaults;
            initOptions.keys.forEach( function( key ) {
                if ( options[ key ] === undefined ) {
                    options[ key ] = defaults[ key ];
                }
            } );
            // options
            flags.forEach( function( flag ) {
                ractive[ flag ] = options[ flag ];
            } );
            // special cases
            if ( typeof ractive.adapt === 'string' ) {
                ractive.adapt = [ ractive.adapt ];
            }
            if ( ractive.magic && !magicAdaptor ) {
                throw new Error( 'Getters and setters (magic mode) are not supported in this browser' );
            }
            // Initialisation
            // --------------
            // We use Object.defineProperties (where possible) as these should be read-only
            defineProperties( ractive, {
                _initing: {
                    value: true,
                    writable: true
                },
                // Generate a unique identifier, for places where you'd use a weak map if it
                // existed
                _guid: {
                    value: getGuid()
                },
                // events
                _subs: {
                    value: create( null ),
                    configurable: true
                },
                // cache
                _cache: {
                    value: {}
                },
                // we need to be able to use hasOwnProperty, so can't inherit from null
                _cacheMap: {
                    value: create( null )
                },
                // dependency graph
                _deps: {
                    value: []
                },
                _depsMap: {
                    value: create( null )
                },
                _patternObservers: {
                    value: []
                },
                // Keep a list of used evaluators, so we don't duplicate them
                _evaluators: {
                    value: create( null )
                },
                // Computed properties
                _computations: {
                    value: create( null )
                },
                // two-way bindings
                _twowayBindings: {
                    value: {}
                },
                // animations (so we can stop any in progress at teardown)
                _animations: {
                    value: []
                },
                // nodes registry
                nodes: {
                    value: {}
                },
                // property wrappers
                _wrapped: {
                    value: create( null )
                },
                // live queries
                _liveQueries: {
                    value: []
                },
                _liveComponentQueries: {
                    value: []
                },
                // components to init at the end of a mutation
                _childInitQueue: {
                    value: []
                },
                // data changes
                _changes: {
                    value: []
                },
                // failed lookups, when we try to access data from ancestor scopes
                _unresolvedImplicitDependencies: {
                    value: []
                }
            } );
            // If this is a component, store a reference to the parent
            if ( options._parent && options._component ) {
                defineProperties( ractive, {
                    _parent: {
                        value: options._parent
                    },
                    component: {
                        value: options._component
                    }
                } );
                // And store a reference to the instance on the component
                options._component.instance = ractive;
            }
            if ( options.el ) {
                ractive.el = getElement( options.el );
                if ( !ractive.el && ractive.debug ) {
                    throw new Error( 'Could not find container element' );
                }
            }
            // Create local registry objects, with the global registries as prototypes
            if ( options.eventDefinitions ) {
                // TODO remove support
                warn( 'ractive.eventDefinitions has been deprecated in favour of ractive.events. Support will be removed in future versions' );
                options.events = options.eventDefinitions;
            }
            registries.forEach( function( registry ) {
                if ( ractive.constructor[ registry ] ) {
                    ractive[ registry ] = extend( create( ractive.constructor[ registry ] ), options[ registry ] );
                } else if ( options[ registry ] ) {
                    ractive[ registry ] = options[ registry ];
                }
            } );
            // Special case
            if ( !ractive.data ) {
                ractive.data = {};
            }
            // Set up any computed values
            computed = defaults.computed ? extend( create( defaults.computed ), options.computed ) : options.computed;
            if ( computed ) {
                createComputations( ractive, computed );
            }
            // Parse template, if necessary
            template = options.template;
            if ( typeof template === 'string' ) {
                if ( !parse ) {
                    throw new Error( errors.missingParser );
                }
                if ( template.charAt( 0 ) === '#' && isClient ) {
                    // assume this is an ID of a <script type='text/ractive'> tag
                    templateEl = document.getElementById( template.substring( 1 ) );
                    if ( templateEl ) {
                        parsedTemplate = parse( templateEl.innerHTML, options );
                    } else {
                        throw new Error( 'Could not find template element (' + template + ')' );
                    }
                } else {
                    parsedTemplate = parse( template, options );
                }
            } else {
                parsedTemplate = template;
            }
            // deal with compound template
            if ( isObject( parsedTemplate ) ) {
                fillGaps( ractive.partials, parsedTemplate.partials );
                parsedTemplate = parsedTemplate.main;
            }
            // If the template was an array with a single string member, that means
            // we can use innerHTML - we just need to unpack it
            if ( parsedTemplate && parsedTemplate.length === 1 && typeof parsedTemplate[ 0 ] === 'string' ) {
                parsedTemplate = parsedTemplate[ 0 ];
            }
            ractive.template = parsedTemplate;
            // Add partials to our registry
            extend( ractive.partials, options.partials );
            ractive.parseOptions = {
                preserveWhitespace: options.preserveWhitespace,
                sanitize: options.sanitize,
                stripComments: options.stripComments
            };
            // Temporarily disable transitions, if noIntro flag is set
            ractive.transitionsEnabled = options.noIntro ? false : options.transitionsEnabled;
            // If we're in a browser, and no element has been specified, create
            // a document fragment to use instead
            if ( isClient && !ractive.el ) {
                ractive.el = document.createDocumentFragment();
            }
            // If the target contains content, and `append` is falsy, clear it
            if ( ractive.el && !options.append ) {
                ractive.el.innerHTML = '';
            }
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            ractive.render( ractive.el, fulfilPromise );
            if ( options.complete ) {
                promise.then( options.complete.bind( ractive ) );
            }
            // reset transitionsEnabled
            ractive.transitionsEnabled = options.transitionsEnabled;
            // end init sequence
            ractive._initing = false;
        };
    }( config_isClient, config_errors, config_initOptions, config_registries, utils_warn, utils_create, utils_extend, utils_fillGaps, utils_defineProperties, utils_getElement, utils_isObject, utils_isArray, utils_getGuid, utils_Promise, shared_get_magicAdaptor, parse__parse, Ractive_initialise_computations_createComputations );

    var extend_initChildInstance = function( initOptions, wrapMethod, initialise ) {

        // The Child constructor contains the default init options for this class
        return function initChildInstance( child, Child, options ) {
            initOptions.keys.forEach( function( key ) {
                var value = options[ key ],
                    defaultValue = Child.defaults[ key ];
                if ( typeof value === 'function' && typeof defaultValue === 'function' ) {
                    options[ key ] = wrapMethod( value, defaultValue );
                }
            } );
            if ( child.beforeInit ) {
                child.beforeInit( options );
            }
            initialise( child, options );
            // If this is an inline component (i.e. NOT created with `var widget = new Widget()`,
            // but rather `<widget/>` or similar), we don't want to call the `init` method until
            // the component is in the DOM. That makes it easier for component authors to do stuff
            // like `this.width = this.find('*').clientWidth` or whatever without using
            // ugly setTimeout hacks.
            if ( options._parent && options._parent._rendering ) {
                options._parent._childInitQueue.push( {
                    instance: child,
                    options: options
                } );
            } else if ( child.init ) {
                child.init( options );
            }
        };
    }( config_initOptions, extend_wrapMethod, Ractive_initialise );

    var extend__extend = function( create, defineProperties, getGuid, extendObject, inheritFromParent, inheritFromChildProps, extractInlinePartials, conditionallyParseTemplate, conditionallyParsePartials, initChildInstance, circular ) {

        var Ractive;
        circular.push( function() {
            Ractive = circular.Ractive;
        } );
        return function extend( childProps ) {
            var Parent = this,
                Child, adaptor, i;
            // if we're extending with another Ractive instance, inherit its
            // prototype methods and default options as well
            if ( childProps.prototype instanceof Ractive ) {
                childProps = extendObject( {}, childProps, childProps.prototype, childProps.defaults );
            }
            // create Child constructor
            Child = function( options ) {
                initChildInstance( this, Child, options || {} );
            };
            Child.prototype = create( Parent.prototype );
            Child.prototype.constructor = Child;
            defineProperties( Child, {
                extend: {
                    value: Parent.extend
                },
                // each component needs a guid, for managing CSS etc
                _guid: {
                    value: getGuid()
                }
            } );
            // Inherit options from parent
            inheritFromParent( Child, Parent );
            // Add new prototype methods and init options
            inheritFromChildProps( Child, childProps );
            // Special case - adaptors. Convert to function if possible
            if ( Child.adaptors && ( i = Child.defaults.adapt.length ) ) {
                while ( i-- ) {
                    adaptor = Child.defaults.adapt[ i ];
                    if ( typeof adaptor === 'string' ) {
                        Child.defaults.adapt[ i ] = Child.adaptors[ adaptor ] || adaptor;
                    }
                }
            }
            // Parse template and any partials that need it
            if ( childProps.template ) {
                // ignore inherited templates!
                conditionallyParseTemplate( Child );
                extractInlinePartials( Child, childProps );
                conditionallyParsePartials( Child );
            }
            return Child;
        };
    }( utils_create, utils_defineProperties, utils_getGuid, utils_extend, extend_inheritFromParent, extend_inheritFromChildProps, extend_extractInlinePartials, extend_conditionallyParseTemplate, extend_conditionallyParsePartials, extend_initChildInstance, circular );

    var Ractive__Ractive = function( initOptions, svg, defineProperties, proto, partialRegistry, adaptorRegistry, componentsRegistry, easingRegistry, interpolatorsRegistry, Promise, extend, parse, initialise, circular ) {

        var Ractive = function( options ) {
            initialise( this, options );
        };
        Ractive.prototype = proto;
        // Read-only properties
        defineProperties( Ractive, {
            // Shared properties
            partials: {
                value: partialRegistry
            },
            // Plugins
            adaptors: {
                value: adaptorRegistry
            },
            easing: {
                value: easingRegistry
            },
            transitions: {
                value: {}
            },
            events: {
                value: {}
            },
            components: {
                value: componentsRegistry
            },
            decorators: {
                value: {}
            },
            interpolators: {
                value: interpolatorsRegistry
            },
            // Default options
            defaults: {
                value: initOptions.defaults
            },
            // Support
            svg: {
                value: svg
            },
            VERSION: {
                value: '0.4.0'
            }
        } );
        // TODO deprecated
        Ractive.eventDefinitions = Ractive.events;
        Ractive.prototype.constructor = Ractive;
        // Namespaced constructors
        Ractive.Promise = Promise;
        // Static methods
        Ractive.extend = extend;
        Ractive.parse = parse;
        circular.Ractive = Ractive;
        return Ractive;
    }( config_initOptions, config_svg, utils_defineProperties, Ractive_prototype__prototype, registries_partials, registries_adaptors, registries_components, registries_easing, registries_interpolators, utils_Promise, extend__extend, parse__parse, Ractive_initialise, circular );

    var Ractive = function( Ractive, circular ) {

        var FUNCTION = 'function';
        // Certain modules have circular dependencies. If we were bundling a
        // module loader, e.g. almond.js, this wouldn't be a problem, but we're
        // not - we're using amdclean as part of the build process. Because of
        // this, we need to wait until all modules have loaded before those
        // circular dependencies can be required.
        while ( circular.length ) {
            circular.pop()();
        }
        // Ractive.js makes liberal use of things like Array.prototype.indexOf. In
        // older browsers, these are made available via a shim - here, we do a quick
        // pre-flight check to make sure that either a) we're not in a shit browser,
        // or b) we're using a Ractive-legacy.js build
        if ( typeof Date.now !== FUNCTION || typeof String.prototype.trim !== FUNCTION || typeof Object.keys !== FUNCTION || typeof Array.prototype.indexOf !== FUNCTION || typeof Array.prototype.forEach !== FUNCTION || typeof Array.prototype.map !== FUNCTION || typeof Array.prototype.filter !== FUNCTION || typeof window !== 'undefined' && typeof window.addEventListener !== FUNCTION ) {
            throw new Error( 'It looks like you\'re attempting to use Ractive.js in an older browser. You\'ll need to use one of the \'legacy builds\' in order to continue - see http://docs.ractivejs.org/latest/legacy-builds for more information.' );
        }
        // Internet Explorer derp. Methods that should be attached to Node.prototype
        // are instead attached to HTMLElement.prototype, which means SVG elements
        // can't use them. Remember kids, friends don't let friends use IE.
        //
        // This is here, rather than in legacy.js, because it affects IE9.
        if ( typeof window !== 'undefined' && window.Node && !window.Node.prototype.contains && window.HTMLElement && window.HTMLElement.prototype.contains ) {
            window.Node.prototype.contains = window.HTMLElement.prototype.contains;
        }
        return Ractive;
    }( Ractive__Ractive, circular, legacy );


    // export as Common JS module...
    if ( typeof module !== "undefined" && module.exports ) {
        module.exports = Ractive;
    }

    // ... or as AMD module
    else if ( typeof define === "function" && define.amd ) {
        define( function() {
            return Ractive;
        } );
    }

    // ... or as browser global
    global.Ractive = Ractive;

    Ractive.noConflict = function() {
        global.Ractive = noConflict;
        return Ractive;
    };

}( typeof window !== 'undefined' ? window : this ) );
/*
    ractive-legacy.runtime.js v0.5.3
    2014-07-05 - commit d41e9692 
 
    http://ractivejs.org
    http://twitter.com/RactiveJS
 
    Released under the MIT License.
*/
 
( function( global ) {
 
    'use strict';
 
    var noConflict = global.Ractive;
 
    /* config/defaults/options.js */
    var options = function() {
 
        // These are both the values for Ractive.defaults
        // as well as the determination for whether an option
        // value will be placed on Component.defaults
        // (versus directly on Component) during an extend operation
        var defaultOptions = {
            // render placement:
            el: void 0,
            append: false,
            // template:
            template: {
                v: 1,
                t: []
            },
            // parse:
            preserveWhitespace: false,
            sanitize: false,
            stripComments: true,
            delimiters: [
                '{{',
                '}}'
            ],
            tripleDelimiters: [
                '{{{',
                '}}}'
            ],
            // data & binding:
            data: {},
            computed: {},
            magic: false,
            modifyArrays: true,
            adapt: [],
            isolated: false,
            twoway: true,
            lazy: false,
            // transitions:
            noIntro: false,
            transitionsEnabled: true,
            complete: void 0,
            // css:
            noCssTransform: false,
            // debug:
            debug: false
        };
        return defaultOptions;
    }();
 
    /* config/defaults/easing.js */
    var easing = {
        linear: function( pos ) {
            return pos;
        },
        easeIn: function( pos ) {
            return Math.pow( pos, 3 );
        },
        easeOut: function( pos ) {
            return Math.pow( pos - 1, 3 ) + 1;
        },
        easeInOut: function( pos ) {
            if ( ( pos /= 0.5 ) < 1 ) {
                return 0.5 * Math.pow( pos, 3 );
            }
            return 0.5 * ( Math.pow( pos - 2, 3 ) + 2 );
        }
    };
 
    /* circular.js */
    var circular = [];
 
    /* utils/hasOwnProperty.js */
    var hasOwn = Object.prototype.hasOwnProperty;
 
    /* utils/isArray.js */
    var isArray = function() {
 
        var toString = Object.prototype.toString;
        // thanks, http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
        return function( thing ) {
            return toString.call( thing ) === '[object Array]';
        };
    }();
 
    /* utils/isObject.js */
    var isObject = function() {
 
        var toString = Object.prototype.toString;
        return function( thing ) {
            return thing && toString.call( thing ) === '[object Object]';
        };
    }();
 
    /* utils/isNumeric.js */
    var isNumeric = function( thing ) {
        return !isNaN( parseFloat( thing ) ) && isFinite( thing );
    };
 
    /* config/defaults/interpolators.js */
    var interpolators = function( circular, hasOwnProperty, isArray, isObject, isNumeric ) {
 
        var interpolators, interpolate, cssLengthPattern;
        circular.push( function() {
            interpolate = circular.interpolate;
        } );
        cssLengthPattern = /^([+-]?[0-9]+\.?(?:[0-9]+)?)(px|em|ex|%|in|cm|mm|pt|pc)$/;
        interpolators = {
            number: function( from, to ) {
                var delta;
                if ( !isNumeric( from ) || !isNumeric( to ) ) {
                    return null;
                }
                from = +from;
                to = +to;
                delta = to - from;
                if ( !delta ) {
                    return function() {
                        return from;
                    };
                }
                return function( t ) {
                    return from + t * delta;
                };
            },
            array: function( from, to ) {
                var intermediate, interpolators, len, i;
                if ( !isArray( from ) || !isArray( to ) ) {
                    return null;
                }
                intermediate = [];
                interpolators = [];
                i = len = Math.min( from.length, to.length );
                while ( i-- ) {
                    interpolators[ i ] = interpolate( from[ i ], to[ i ] );
                }
                // surplus values - don't interpolate, but don't exclude them either
                for ( i = len; i < from.length; i += 1 ) {
                    intermediate[ i ] = from[ i ];
                }
                for ( i = len; i < to.length; i += 1 ) {
                    intermediate[ i ] = to[ i ];
                }
                return function( t ) {
                    var i = len;
                    while ( i-- ) {
                        intermediate[ i ] = interpolators[ i ]( t );
                    }
                    return intermediate;
                };
            },
            object: function( from, to ) {
                var properties, len, interpolators, intermediate, prop;
                if ( !isObject( from ) || !isObject( to ) ) {
                    return null;
                }
                properties = [];
                intermediate = {};
                interpolators = {};
                for ( prop in from ) {
                    if ( hasOwnProperty.call( from, prop ) ) {
                        if ( hasOwnProperty.call( to, prop ) ) {
                            properties.push( prop );
                            interpolators[ prop ] = interpolate( from[ prop ], to[ prop ] );
                        } else {
                            intermediate[ prop ] = from[ prop ];
                        }
                    }
                }
                for ( prop in to ) {
                    if ( hasOwnProperty.call( to, prop ) && !hasOwnProperty.call( from, prop ) ) {
                        intermediate[ prop ] = to[ prop ];
                    }
                }
                len = properties.length;
                return function( t ) {
                    var i = len,
                        prop;
                    while ( i-- ) {
                        prop = properties[ i ];
                        intermediate[ prop ] = interpolators[ prop ]( t );
                    }
                    return intermediate;
                };
            },
            cssLength: function( from, to ) {
                var fromMatch, toMatch, fromUnit, toUnit, fromValue, toValue, unit, delta;
                if ( from !== 0 && typeof from !== 'string' || to !== 0 && typeof to !== 'string' ) {
                    return null;
                }
                fromMatch = cssLengthPattern.exec( from );
                toMatch = cssLengthPattern.exec( to );
                fromUnit = fromMatch ? fromMatch[ 2 ] : '';
                toUnit = toMatch ? toMatch[ 2 ] : '';
                if ( fromUnit && toUnit && fromUnit !== toUnit ) {
                    return null;
                }
                unit = fromUnit || toUnit;
                fromValue = fromMatch ? +fromMatch[ 1 ] : 0;
                toValue = toMatch ? +toMatch[ 1 ] : 0;
                delta = toValue - fromValue;
                if ( !delta ) {
                    return function() {
                        return fromValue + unit;
                    };
                }
                return function( t ) {
                    return fromValue + t * delta + unit;
                };
            }
        };
        return interpolators;
    }( circular, hasOwn, isArray, isObject, isNumeric );
 
    /* config/svg.js */
    var svg = function() {
 
        var svg;
        if ( typeof document === 'undefined' ) {
            svg = false;
        } else {
            svg = document && document.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1' );
        }
        return svg;
    }();
 
    /* utils/removeFromArray.js */
    var removeFromArray = function( array, member ) {
        var index = array.indexOf( member );
        if ( index !== -1 ) {
            array.splice( index, 1 );
        }
    };
 
    /* utils/Promise.js */
    var Promise = function() {
 
        var _Promise, PENDING = {},
            FULFILLED = {},
            REJECTED = {};
        if ( typeof Promise === 'function' ) {
            // use native Promise
            _Promise = Promise;
        } else {
            _Promise = function( callback ) {
                var fulfilledHandlers = [],
                    rejectedHandlers = [],
                    state = PENDING,
                    result, dispatchHandlers, makeResolver, fulfil, reject, promise;
                makeResolver = function( newState ) {
                    return function( value ) {
                        if ( state !== PENDING ) {
                            return;
                        }
                        result = value;
                        state = newState;
                        dispatchHandlers = makeDispatcher( state === FULFILLED ? fulfilledHandlers : rejectedHandlers, result );
                        // dispatch onFulfilled and onRejected handlers asynchronously
                        wait( dispatchHandlers );
                    };
                };
                fulfil = makeResolver( FULFILLED );
                reject = makeResolver( REJECTED );
                try {
                    callback( fulfil, reject );
                } catch ( err ) {
                    reject( err );
                }
                promise = {
                    // `then()` returns a Promise - 2.2.7
                    then: function( onFulfilled, onRejected ) {
                        var promise2 = new _Promise( function( fulfil, reject ) {
                            var processResolutionHandler = function( handler, handlers, forward ) {
                                // 2.2.1.1
                                if ( typeof handler === 'function' ) {
                                    handlers.push( function( p1result ) {
                                        var x;
                                        try {
                                            x = handler( p1result );
                                            resolve( promise2, x, fulfil, reject );
                                        } catch ( err ) {
                                            reject( err );
                                        }
                                    } );
                                } else {
                                    // Forward the result of promise1 to promise2, if resolution handlers
                                    // are not given
                                    handlers.push( forward );
                                }
                            };
                            // 2.2
                            processResolutionHandler( onFulfilled, fulfilledHandlers, fulfil );
                            processResolutionHandler( onRejected, rejectedHandlers, reject );
                            if ( state !== PENDING ) {
                                // If the promise has resolved already, dispatch the appropriate handlers asynchronously
                                wait( dispatchHandlers );
                            }
                        } );
                        return promise2;
                    }
                };
                promise[ 'catch' ] = function( onRejected ) {
                    return this.then( null, onRejected );
                };
                return promise;
            };
            _Promise.all = function( promises ) {
                return new _Promise( function( fulfil, reject ) {
                    var result = [],
                        pending, i, processPromise;
                    if ( !promises.length ) {
                        fulfil( result );
                        return;
                    }
                    processPromise = function( i ) {
                        promises[ i ].then( function( value ) {
                            result[ i ] = value;
                            if ( !--pending ) {
                                fulfil( result );
                            }
                        }, reject );
                    };
                    pending = i = promises.length;
                    while ( i-- ) {
                        processPromise( i );
                    }
                } );
            };
            _Promise.resolve = function( value ) {
                return new _Promise( function( fulfil ) {
                    fulfil( value );
                } );
            };
            _Promise.reject = function( reason ) {
                return new _Promise( function( fulfil, reject ) {
                    reject( reason );
                } );
            };
        }
        return _Promise;
        // TODO use MutationObservers or something to simulate setImmediate
        function wait( callback ) {
            setTimeout( callback, 0 );
        }
 
        function makeDispatcher( handlers, result ) {
            return function() {
                var handler;
                while ( handler = handlers.shift() ) {
                    handler( result );
                }
            };
        }
 
        function resolve( promise, x, fulfil, reject ) {
            // Promise Resolution Procedure
            var then;
            // 2.3.1
            if ( x === promise ) {
                throw new TypeError( 'A promise\'s fulfillment handler cannot return the same promise' );
            }
            // 2.3.2
            if ( x instanceof _Promise ) {
                x.then( fulfil, reject );
            } else if ( x && ( typeof x === 'object' || typeof x === 'function' ) ) {
                try {
                    then = x.then;
                } catch ( e ) {
                    reject( e );
                    // 2.3.3.2
                    return;
                }
                // 2.3.3.3
                if ( typeof then === 'function' ) {
                    var called, resolvePromise, rejectPromise;
                    resolvePromise = function( y ) {
                        if ( called ) {
                            return;
                        }
                        called = true;
                        resolve( promise, y, fulfil, reject );
                    };
                    rejectPromise = function( r ) {
                        if ( called ) {
                            return;
                        }
                        called = true;
                        reject( r );
                    };
                    try {
                        then.call( x, resolvePromise, rejectPromise );
                    } catch ( e ) {
                        if ( !called ) {
                            // 2.3.3.3.4.1
                            reject( e );
                            // 2.3.3.3.4.2
                            called = true;
                            return;
                        }
                    }
                } else {
                    fulfil( x );
                }
            } else {
                fulfil( x );
            }
        }
    }();
 
    /* utils/normaliseRef.js */
    var normaliseRef = function() {
 
        var regex = /\[\s*(\*|[0-9]|[1-9][0-9]+)\s*\]/g;
        return function normaliseRef( ref ) {
            return ( ref || '' ).replace( regex, '.$1' );
        };
    }();
 
    /* shared/getInnerContext.js */
    var getInnerContext = function( fragment ) {
        do {
            if ( fragment.context ) {
                return fragment.context;
            }
        } while ( fragment = fragment.parent );
        return '';
    };
 
    /* utils/isEqual.js */
    var isEqual = function( a, b ) {
        if ( a === null && b === null ) {
            return true;
        }
        if ( typeof a === 'object' || typeof b === 'object' ) {
            return false;
        }
        return a === b;
    };
 
    /* shared/createComponentBinding.js */
    var createComponentBinding = function( circular, isArray, isEqual ) {
 
        var runloop;
        circular.push( function() {
            return runloop = circular.runloop;
        } );
        var Binding = function( ractive, keypath, otherInstance, otherKeypath, priority ) {
            this.root = ractive;
            this.keypath = keypath;
            this.priority = priority;
            this.otherInstance = otherInstance;
            this.otherKeypath = otherKeypath;
            this.bind();
            this.value = this.root.viewmodel.get( this.keypath );
        };
        Binding.prototype = {
            setValue: function( value ) {
                var this$0 = this;
                // Only *you* can prevent infinite loops
                if ( this.updating || this.counterpart && this.counterpart.updating ) {
                    this.value = value;
                    return;
                }
                // Is this a smart array update? If so, it'll update on its
                // own, we shouldn't do anything
                if ( isArray( value ) && value._ractive && value._ractive.setting ) {
                    return;
                }
                if ( !isEqual( value, this.value ) ) {
                    this.updating = true;
                    // TODO maybe the case that `value === this.value` - should that result
                    // in an update rather than a set?
                    runloop.addViewmodel( this.otherInstance.viewmodel );
                    this.otherInstance.viewmodel.set( this.otherKeypath, value );
                    this.value = value;
                    // TODO will the counterpart update after this line, during
                    // the runloop end cycle? may be a problem...
                    runloop.scheduleTask( function() {
                        return this$0.updating = false;
                    } );
                }
            },
            bind: function() {
                this.root.viewmodel.register( this.keypath, this );
            },
            rebind: function( newKeypath ) {
                this.unbind();
                this.keypath = newKeypath;
                this.counterpart.otherKeypath = newKeypath;
                this.bind();
            },
            unbind: function() {
                this.root.viewmodel.unregister( this.keypath, this );
            }
        };
        return function createComponentBinding( component, parentInstance, parentKeypath, childKeypath ) {
            var hash, childInstance, bindings, priority, parentToChildBinding, childToParentBinding;
            hash = parentKeypath + '=' + childKeypath;
            bindings = component.bindings;
            if ( bindings[ hash ] ) {
                // TODO does this ever happen?
                return;
            }
            bindings[ hash ] = true;
            childInstance = component.instance;
            priority = component.parentFragment.priority;
            parentToChildBinding = new Binding( parentInstance, parentKeypath, childInstance, childKeypath, priority );
            bindings.push( parentToChildBinding );
            if ( childInstance.twoway ) {
                childToParentBinding = new Binding( childInstance, childKeypath, parentInstance, parentKeypath, 1 );
                bindings.push( childToParentBinding );
                parentToChildBinding.counterpart = childToParentBinding;
                childToParentBinding.counterpart = parentToChildBinding;
            }
        };
    }( circular, isArray, isEqual );
 
    /* shared/resolveRef.js */
    var resolveRef = function( normaliseRef, getInnerContext, createComponentBinding ) {
 
        var ancestorErrorMessage, getOptions;
        ancestorErrorMessage = 'Could not resolve reference - too many "../" prefixes';
        getOptions = {
            evaluateWrapped: true
        };
        return function resolveRef( ractive, ref, fragment ) {
            var context, key, index, keypath, parentValue, hasContextChain;
            ref = normaliseRef( ref );
            // If a reference begins '~/', it's a top-level reference
            if ( ref.substr( 0, 2 ) === '~/' ) {
                return ref.substring( 2 );
            }
            // If a reference begins with '.', it's either a restricted reference or
            // an ancestor reference...
            if ( ref.charAt( 0 ) === '.' ) {
                return resolveAncestorReference( getInnerContext( fragment ), ref );
            }
            // ...otherwise we need to find the keypath
            key = ref.split( '.' )[ 0 ];
            do {
                context = fragment.context;
                if ( !context ) {
                    continue;
                }
                hasContextChain = true;
                parentValue = ractive.viewmodel.get( context, getOptions );
                if ( parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' ) && key in parentValue ) {
                    return context + '.' + ref;
                }
            } while ( fragment = fragment.parent );
            // Root/computed property?
            if ( key in ractive.data || key in ractive.viewmodel.computations ) {
                return ref;
            }
            // If this is an inline component, and it's not isolated, we
            // can try going up the scope chain
            if ( ractive._parent && !ractive.isolated ) {
                fragment = ractive.component.parentFragment;
                // Special case - index refs
                if ( fragment.indexRefs && ( index = fragment.indexRefs[ ref ] ) !== undefined ) {
                    // Create an index ref binding, so that it can be rebound letter if necessary.
                    // It doesn't have an alias since it's an implicit binding, hence `...[ ref ] = ref`
                    ractive.component.indexRefBindings[ ref ] = ref;
                    ractive.viewmodel.set( ref, index, true );
                    return;
                }
                keypath = resolveRef( ractive._parent, ref, fragment );
                if ( keypath ) {
                    // Need to create an inter-component binding
                    ractive.viewmodel.set( ref, ractive._parent.viewmodel.get( keypath ), true );
                    createComponentBinding( ractive.component, ractive._parent, keypath, ref );
                }
            }
            // If there's no context chain, and the instance is either a) isolated or
            // b) an orphan, then we know that the keypath is identical to the reference
            if ( !hasContextChain ) {
                return ref;
            }
            if ( ractive.viewmodel.get( ref ) !== undefined ) {
                return ref;
            }
        };
 
        function resolveAncestorReference( baseContext, ref ) {
            var contextKeys;
            // {{.}} means 'current context'
            if ( ref === '.' )
                return baseContext;
            contextKeys = baseContext ? baseContext.split( '.' ) : [];
            // ancestor references (starting "../") go up the tree
            if ( ref.substr( 0, 3 ) === '../' ) {
                while ( ref.substr( 0, 3 ) === '../' ) {
                    if ( !contextKeys.length ) {
                        throw new Error( ancestorErrorMessage );
                    }
                    contextKeys.pop();
                    ref = ref.substring( 3 );
                }
                contextKeys.push( ref );
                return contextKeys.join( '.' );
            }
            // not an ancestor reference - must be a restricted reference (prepended with "." or "./")
            if ( !baseContext ) {
                return ref.replace( /^\.\/?/, '' );
            }
            return baseContext + ref.replace( /^\.\//, '.' );
        }
    }( normaliseRef, getInnerContext, createComponentBinding );
 
    /* global/TransitionManager.js */
    var TransitionManager = function( removeFromArray ) {
 
        var TransitionManager = function( callback, parent ) {
            this.callback = callback;
            this.parent = parent;
            this.intros = [];
            this.outros = [];
            this.children = [];
            this.totalChildren = this.outroChildren = 0;
            this.detachQueue = [];
            this.outrosComplete = false;
            if ( parent ) {
                parent.addChild( this );
            }
        };
        TransitionManager.prototype = {
            addChild: function( child ) {
                this.children.push( child );
                this.totalChildren += 1;
                this.outroChildren += 1;
            },
            decrementOutros: function() {
                this.outroChildren -= 1;
                check( this );
            },
            decrementTotal: function() {
                this.totalChildren -= 1;
                check( this );
            },
            add: function( transition ) {
                var list = transition.isIntro ? this.intros : this.outros;
                list.push( transition );
            },
            remove: function( transition ) {
                var list = transition.isIntro ? this.intros : this.outros;
                removeFromArray( list, transition );
                check( this );
            },
            init: function() {
                this.ready = true;
                check( this );
            },
            detachNodes: function() {
                this.detachQueue.forEach( detach );
                this.children.forEach( detachNodes );
            }
        };
 
        function detach( element ) {
            element.detach();
        }
 
        function detachNodes( tm ) {
            tm.detachNodes();
        }
 
        function check( tm ) {
            if ( !tm.ready || tm.outros.length || tm.outroChildren )
                return;
            // If all outros are complete, and we haven't already done this,
            // we notify the parent if there is one, otherwise
            // start detaching nodes
            if ( !tm.outrosComplete ) {
                if ( tm.parent ) {
                    tm.parent.decrementOutros( tm );
                } else {
                    tm.detachNodes();
                }
                tm.outrosComplete = true;
            }
            // Once everything is done, we can notify parent transition
            // manager and call the callback
            if ( !tm.intros.length && !tm.totalChildren ) {
                if ( typeof tm.callback === 'function' ) {
                    tm.callback();
                }
                if ( tm.parent ) {
                    tm.parent.decrementTotal();
                }
            }
        }
        return TransitionManager;
    }( removeFromArray );
 
    /* global/runloop.js */
    var runloop = function( circular, removeFromArray, Promise, resolveRef, TransitionManager ) {
 
        var batch, runloop, unresolved = [];
        runloop = {
            start: function( instance, returnPromise ) {
                var promise, fulfilPromise;
                if ( returnPromise ) {
                    promise = new Promise( function( f ) {
                        return fulfilPromise = f;
                    } );
                }
                batch = {
                    previousBatch: batch,
                    transitionManager: new TransitionManager( fulfilPromise, batch && batch.transitionManager ),
                    views: [],
                    tasks: [],
                    viewmodels: []
                };
                if ( instance ) {
                    batch.viewmodels.push( instance.viewmodel );
                }
                return promise;
            },
            end: function() {
                flushChanges();
                batch.transitionManager.init();
                batch = batch.previousBatch;
            },
            addViewmodel: function( viewmodel ) {
                if ( batch ) {
                    if ( batch.viewmodels.indexOf( viewmodel ) === -1 ) {
                        batch.viewmodels.push( viewmodel );
                    }
                } else {
                    viewmodel.applyChanges();
                }
            },
            registerTransition: function( transition ) {
                transition._manager = batch.transitionManager;
                batch.transitionManager.add( transition );
            },
            addView: function( view ) {
                batch.views.push( view );
            },
            addUnresolved: function( thing ) {
                unresolved.push( thing );
            },
            removeUnresolved: function( thing ) {
                removeFromArray( unresolved, thing );
            },
            // synchronise node detachments with transition ends
            detachWhenReady: function( thing ) {
                batch.transitionManager.detachQueue.push( thing );
            },
            scheduleTask: function( task ) {
                if ( !batch ) {
                    task();
                } else {
                    batch.tasks.push( task );
                }
            }
        };
        circular.runloop = runloop;
        return runloop;
 
        function flushChanges() {
            var i, thing, changeHash;
            for ( i = 0; i < batch.viewmodels.length; i += 1 ) {
                thing = batch.viewmodels[ i ];
                changeHash = thing.applyChanges();
                if ( changeHash ) {
                    thing.ractive.fire( 'change', changeHash );
                }
            }
            batch.viewmodels.length = 0;
            attemptKeypathResolution();
            // Now that changes have been fully propagated, we can update the DOM
            // and complete other tasks
            for ( i = 0; i < batch.views.length; i += 1 ) {
                batch.views[ i ].update();
            }
            batch.views.length = 0;
            for ( i = 0; i < batch.tasks.length; i += 1 ) {
                batch.tasks[ i ]();
            }
            batch.tasks.length = 0;
            // If updating the view caused some model blowback - e.g. a triple
            // containing <option> elements caused the binding on the <select>
            // to update - then we start over
            if ( batch.viewmodels.length )
                return flushChanges();
        }
 
        function attemptKeypathResolution() {
            var array, thing, keypath;
            if ( !unresolved.length ) {
                return;
            }
            // see if we can resolve any unresolved references
            array = unresolved.splice( 0, unresolved.length );
            while ( thing = array.pop() ) {
                if ( thing.keypath ) {
                    continue;
                }
                keypath = resolveRef( thing.root, thing.ref, thing.parentFragment );
                if ( keypath !== undefined ) {
                    // If we've resolved the keypath, we can initialise this item
                    thing.resolve( keypath );
                } else {
                    // If we can't resolve the reference, try again next time
                    unresolved.push( thing );
                }
            }
        }
    }( circular, removeFromArray, Promise, resolveRef, TransitionManager );
 
    /* utils/createBranch.js */
    var createBranch = function() {
 
        var numeric = /^\s*[0-9]+\s*$/;
        return function( key ) {
            return numeric.test( key ) ? [] : {};
        };
    }();
 
    /* viewmodel/prototype/get/magicAdaptor.js */
    var viewmodel$get_magicAdaptor = function( runloop, createBranch, isArray ) {
 
        var magicAdaptor, MagicWrapper;
        try {
            Object.defineProperty( {}, 'test', {
                value: 0
            } );
            magicAdaptor = {
                filter: function( object, keypath, ractive ) {
                    var keys, key, parentKeypath, parentWrapper, parentValue;
                    if ( !keypath ) {
                        return false;
                    }
                    keys = keypath.split( '.' );
                    key = keys.pop();
                    parentKeypath = keys.join( '.' );
                    // If the parent value is a wrapper, other than a magic wrapper,
                    // we shouldn't wrap this property
                    if ( ( parentWrapper = ractive.viewmodel.wrapped[ parentKeypath ] ) && !parentWrapper.magic ) {
                        return false;
                    }
                    parentValue = ractive.get( parentKeypath );
                    // if parentValue is an array that doesn't include this member,
                    // we should return false otherwise lengths will get messed up
                    if ( isArray( parentValue ) && /^[0-9]+$/.test( key ) ) {
                        return false;
                    }
                    return parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' );
                },
                wrap: function( ractive, property, keypath ) {
                    return new MagicWrapper( ractive, property, keypath );
                }
            };
            MagicWrapper = function( ractive, value, keypath ) {
                var keys, objKeypath, template, siblings;
                this.magic = true;
                this.ractive = ractive;
                this.keypath = keypath;
                this.value = value;
                keys = keypath.split( '.' );
                this.prop = keys.pop();
                objKeypath = keys.join( '.' );
                this.obj = objKeypath ? ractive.get( objKeypath ) : ractive.data;
                template = this.originalDescriptor = Object.getOwnPropertyDescriptor( this.obj, this.prop );
                // Has this property already been wrapped?
                if ( template && template.set && ( siblings = template.set._ractiveWrappers ) ) {
                    // Yes. Register this wrapper to this property, if it hasn't been already
                    if ( siblings.indexOf( this ) === -1 ) {
                        siblings.push( this );
                    }
                    return;
                }
                // No, it hasn't been wrapped
                createAccessors( this, value, template );
            };
            MagicWrapper.prototype = {
                get: function() {
                    return this.value;
                },
                reset: function( value ) {
                    if ( this.updating ) {
                        return;
                    }
                    this.updating = true;
                    this.obj[ this.prop ] = value;
                    // trigger set() accessor
                    runloop.addViewmodel( this.ractive.viewmodel );
                    this.ractive.viewmodel.mark( this.keypath );
                    this.updating = false;
                },
                set: function( key, value ) {
                    if ( this.updating ) {
                        return;
                    }
                    if ( !this.obj[ this.prop ] ) {
                        this.updating = true;
                        this.obj[ this.prop ] = createBranch( key );
                        this.updating = false;
                    }
                    this.obj[ this.prop ][ key ] = value;
                },
                teardown: function() {
                    var template, set, value, wrappers, index;
                    // If this method was called because the cache was being cleared as a
                    // result of a set()/update() call made by this wrapper, we return false
                    // so that it doesn't get torn down
                    if ( this.updating ) {
                        return false;
                    }
                    template = Object.getOwnPropertyDescriptor( this.obj, this.prop );
                    set = template && template.set;
                    if ( !set ) {
                        // most likely, this was an array member that was spliced out
                        return;
                    }
                    wrappers = set._ractiveWrappers;
                    index = wrappers.indexOf( this );
                    if ( index !== -1 ) {
                        wrappers.splice( index, 1 );
                    }
                    // Last one out, turn off the lights
                    if ( !wrappers.length ) {
                        value = this.obj[ this.prop ];
                        Object.defineProperty( this.obj, this.prop, this.originalDescriptor || {
                            writable: true,
                            enumerable: true,
                            configurable: true
                        } );
                        this.obj[ this.prop ] = value;
                    }
                }
            };
        } catch ( err ) {
            magicAdaptor = false;
        }
        return magicAdaptor;
 
        function createAccessors( originalWrapper, value, template ) {
            var object, property, oldGet, oldSet, get, set;
            object = originalWrapper.obj;
            property = originalWrapper.prop;
            // Is this template configurable?
            if ( template && !template.configurable ) {
                // Special case - array length
                if ( property === 'length' ) {
                    return;
                }
                throw new Error( 'Cannot use magic mode with property "' + property + '" - object is not configurable' );
            }
            // Time to wrap this property
            if ( template ) {
                oldGet = template.get;
                oldSet = template.set;
            }
            get = oldGet || function() {
                return value;
            };
            set = function( v ) {
                if ( oldSet ) {
                    oldSet( v );
                }
                value = oldGet ? oldGet() : v;
                set._ractiveWrappers.forEach( updateWrapper );
            };
 
            function updateWrapper( wrapper ) {
                var keypath, ractive;
                wrapper.value = value;
                if ( wrapper.updating ) {
                    return;
                }
                ractive = wrapper.ractive;
                keypath = wrapper.keypath;
                wrapper.updating = true;
                runloop.start( ractive );
                ractive.viewmodel.mark( keypath );
                runloop.end();
                wrapper.updating = false;
            }
            // Create an array of wrappers, in case other keypaths/ractives depend on this property.
            // Handily, we can store them as a property of the set function. Yay JavaScript.
            set._ractiveWrappers = [ originalWrapper ];
            Object.defineProperty( object, property, {
                get: get,
                set: set,
                enumerable: true,
                configurable: true
            } );
        }
    }( runloop, createBranch, isArray );
 
    /* config/magic.js */
    var magic = function( magicAdaptor ) {
 
        return !!magicAdaptor;
    }( viewmodel$get_magicAdaptor );
 
    /* config/namespaces.js */
    var namespaces = {
        html: 'http://www.w3.org/1999/xhtml',
        mathml: 'http://www.w3.org/1998/Math/MathML',
        svg: 'http://www.w3.org/2000/svg',
        xlink: 'http://www.w3.org/1999/xlink',
        xml: 'http://www.w3.org/XML/1998/namespace',
        xmlns: 'http://www.w3.org/2000/xmlns/'
    };
 
    /* utils/createElement.js */
    var createElement = function( svg, namespaces ) {
 
        var createElement;
        // Test for SVG support
        if ( !svg ) {
            createElement = function( type, ns ) {
                if ( ns && ns !== namespaces.html ) {
                    throw 'This browser does not support namespaces other than http://www.w3.org/1999/xhtml. The most likely cause of this error is that you\'re trying to render SVG in an older browser. See http://docs.ractivejs.org/latest/svg-and-older-browsers for more information';
                }
                return document.createElement( type );
            };
        } else {
            createElement = function( type, ns ) {
                if ( !ns || ns === namespaces.html ) {
                    return document.createElement( type );
                }
                return document.createElementNS( ns, type );
            };
        }
        return createElement;
    }( svg, namespaces );
 
    /* config/isClient.js */
    var isClient = function() {
 
        var isClient = typeof document === 'object';
        return isClient;
    }();
 
    /* utils/defineProperty.js */
    var defineProperty = function( isClient ) {
 
        var defineProperty;
        try {
            Object.defineProperty( {}, 'test', {
                value: 0
            } );
            if ( isClient ) {
                Object.defineProperty( document.createElement( 'div' ), 'test', {
                    value: 0
                } );
            }
            defineProperty = Object.defineProperty;
        } catch ( err ) {
            // Object.defineProperty doesn't exist, or we're in IE8 where you can
            // only use it with DOM objects (what the fuck were you smoking, MSFT?)
            defineProperty = function( obj, prop, desc ) {
                obj[ prop ] = desc.value;
            };
        }
        return defineProperty;
    }( isClient );
 
    /* utils/defineProperties.js */
    var defineProperties = function( createElement, defineProperty, isClient ) {
 
        var defineProperties;
        try {
            try {
                Object.defineProperties( {}, {
                    test: {
                        value: 0
                    }
                } );
            } catch ( err ) {
                // TODO how do we account for this? noMagic = true;
                throw err;
            }
            if ( isClient ) {
                Object.defineProperties( createElement( 'div' ), {
                    test: {
                        value: 0
                    }
                } );
            }
            defineProperties = Object.defineProperties;
        } catch ( err ) {
            defineProperties = function( obj, props ) {
                var prop;
                for ( prop in props ) {
                    if ( props.hasOwnProperty( prop ) ) {
                        defineProperty( obj, prop, props[ prop ] );
                    }
                }
            };
        }
        return defineProperties;
    }( createElement, defineProperty, isClient );
 
    /* Ractive/prototype/shared/add.js */
    var Ractive$shared_add = function( isNumeric ) {
 
        return function add( root, keypath, d ) {
            var value;
            if ( typeof keypath !== 'string' || !isNumeric( d ) ) {
                throw new Error( 'Bad arguments' );
            }
            value = +root.get( keypath ) || 0;
            if ( !isNumeric( value ) ) {
                throw new Error( 'Cannot add to a non-numeric value' );
            }
            return root.set( keypath, value + d );
        };
    }( isNumeric );
 
    /* Ractive/prototype/add.js */
    var Ractive$add = function( add ) {
 
        return function Ractive$add( keypath, d ) {
            return add( this, keypath, d === undefined ? 1 : +d );
        };
    }( Ractive$shared_add );
 
    /* utils/normaliseKeypath.js */
    var normaliseKeypath = function( normaliseRef ) {
 
        var leadingDot = /^\.+/;
        return function normaliseKeypath( keypath ) {
            return normaliseRef( keypath ).replace( leadingDot, '' );
        };
    }( normaliseRef );
 
    /* config/vendors.js */
    var vendors = [
        'o',
        'ms',
        'moz',
        'webkit'
    ];
 
    /* utils/requestAnimationFrame.js */
    var requestAnimationFrame = function( vendors ) {
 
        var requestAnimationFrame;
        // If window doesn't exist, we don't need requestAnimationFrame
        if ( typeof window === 'undefined' ) {
            requestAnimationFrame = null;
        } else {
            // https://gist.github.com/paulirish/1579671
            ( function( vendors, lastTime, window ) {
                var x, setTimeout;
                if ( window.requestAnimationFrame ) {
                    return;
                }
                for ( x = 0; x < vendors.length && !window.requestAnimationFrame; ++x ) {
                    window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
                }
                if ( !window.requestAnimationFrame ) {
                    setTimeout = window.setTimeout;
                    window.requestAnimationFrame = function( callback ) {
                        var currTime, timeToCall, id;
                        currTime = Date.now();
                        timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
                        id = setTimeout( function() {
                            callback( currTime + timeToCall );
                        }, timeToCall );
                        lastTime = currTime + timeToCall;
                        return id;
                    };
                }
            }( vendors, 0, window ) );
            requestAnimationFrame = window.requestAnimationFrame;
        }
        return requestAnimationFrame;
    }( vendors );
 
    /* utils/getTime.js */
    var getTime = function() {
 
        var getTime;
        if ( typeof window !== 'undefined' && window.performance && typeof window.performance.now === 'function' ) {
            getTime = function() {
                return window.performance.now();
            };
        } else {
            getTime = function() {
                return Date.now();
            };
        }
        return getTime;
    }();
 
    /* shared/animations.js */
    var animations = function( rAF, getTime, runloop ) {
 
        var queue = [];
        var animations = {
            tick: function() {
                var i, animation, now;
                now = getTime();
                runloop.start();
                for ( i = 0; i < queue.length; i += 1 ) {
                    animation = queue[ i ];
                    if ( !animation.tick( now ) ) {
                        // animation is complete, remove it from the stack, and decrement i so we don't miss one
                        queue.splice( i--, 1 );
                    }
                }
                runloop.end();
                if ( queue.length ) {
                    rAF( animations.tick );
                } else {
                    animations.running = false;
                }
            },
            add: function( animation ) {
                queue.push( animation );
                if ( !animations.running ) {
                    animations.running = true;
                    rAF( animations.tick );
                }
            },
            // TODO optimise this
            abort: function( keypath, root ) {
                var i = queue.length,
                    animation;
                while ( i-- ) {
                    animation = queue[ i ];
                    if ( animation.root === root && animation.keypath === keypath ) {
                        animation.stop();
                    }
                }
            }
        };
        return animations;
    }( requestAnimationFrame, getTime, runloop );
 
    /* utils/warn.js */
    var warn = function() {
 
        /* global console */
        var warn, warned = {};
        if ( typeof console !== 'undefined' && typeof console.warn === 'function' && typeof console.warn.apply === 'function' ) {
            warn = function( message, allowDuplicates ) {
                if ( !allowDuplicates ) {
                    if ( warned[ message ] ) {
                        return;
                    }
                    warned[ message ] = true;
                }
                console.warn( message );
            };
        } else {
            warn = function() {};
        }
        return warn;
    }();
 
    /* config/options/css/transform.js */
    var transform = function() {
 
        var selectorsPattern = /(?:^|\})?\s*([^\{\}]+)\s*\{/g,
            commentsPattern = /\/\*.*?\*\//g,
            selectorUnitPattern = /((?:(?:\[[^\]+]\])|(?:[^\s\+\>\~:]))+)((?::[^\s\+\>\~]+)?\s*[\s\+\>\~]?)\s*/g,
            mediaQueryPattern = /^@media/,
            dataRvcGuidPattern = /\[data-rvcguid="[a-z0-9-]+"]/g;
        return function transformCss( css, guid ) {
            var transformed, addGuid;
            addGuid = function( selector ) {
                var selectorUnits, match, unit, dataAttr, base, prepended, appended, i, transformed = [];
                selectorUnits = [];
                while ( match = selectorUnitPattern.exec( selector ) ) {
                    selectorUnits.push( {
                        str: match[ 0 ],
                        base: match[ 1 ],
                        modifiers: match[ 2 ]
                    } );
                }
                // For each simple selector within the selector, we need to create a version
                // that a) combines with the guid, and b) is inside the guid
                dataAttr = '[data-rvcguid="' + guid + '"]';
                base = selectorUnits.map( extractString );
                i = selectorUnits.length;
                while ( i-- ) {
                    appended = base.slice();
                    // Pseudo-selectors should go after the attribute selector
                    unit = selectorUnits[ i ];
                    appended[ i ] = unit.base + dataAttr + unit.modifiers || '';
                    prepended = base.slice();
                    prepended[ i ] = dataAttr + ' ' + prepended[ i ];
                    transformed.push( appended.join( ' ' ), prepended.join( ' ' ) );
                }
                return transformed.join( ', ' );
            };
            if ( dataRvcGuidPattern.test( css ) ) {
                transformed = css.replace( dataRvcGuidPattern, '[data-rvcguid="' + guid + '"]' );
            } else {
                transformed = css.replace( commentsPattern, '' ).replace( selectorsPattern, function( match, $1 ) {
                    var selectors, transformed;
                    // don't transform media queries!
                    if ( mediaQueryPattern.test( $1 ) )
                        return match;
                    selectors = $1.split( ',' ).map( trim );
                    transformed = selectors.map( addGuid ).join( ', ' ) + ' ';
                    return match.replace( $1, transformed );
                } );
            }
            return transformed;
        };
 
        function trim( str ) {
            if ( str.trim ) {
                return str.trim();
            }
            return str.replace( /^\s+/, '' ).replace( /\s+$/, '' );
        }
 
        function extractString( unit ) {
            return unit.str;
        }
    }();
 
    /* config/options/css/css.js */
    var css = function( transformCss ) {
 
        var cssConfig = {
            name: 'css',
            extend: extend,
            init: function() {}
        };
 
        function extend( Parent, proto, options ) {
            var guid = proto.constructor._guid,
                css;
            if ( css = getCss( options.css, options, guid ) || getCss( Parent.css, Parent, guid ) ) {
                proto.constructor.css = css;
            }
        }
 
        function getCss( css, target, guid ) {
            if ( !css ) {
                return;
            }
            return target.noCssTransform ? css : transformCss( css, guid );
        }
        return cssConfig;
    }( transform );
 
    /* utils/wrapMethod.js */
    var wrapMethod = function() {
 
        return function( method, superMethod, force ) {
            if ( force || needsSuper( method, superMethod ) ) {
                return function() {
                    var hasSuper = '_super' in this,
                        _super = this._super,
                        result;
                    this._super = superMethod;
                    result = method.apply( this, arguments );
                    if ( hasSuper ) {
                        this._super = _super;
                    }
                    return result;
                };
            } else {
                return method;
            }
        };
 
        function needsSuper( method, superMethod ) {
            return typeof superMethod === 'function' && /_super/.test( method );
        }
    }();
 
    /* config/options/data.js */
    var data = function( wrap ) {
 
        var dataConfig = {
            name: 'data',
            extend: extend,
            init: init,
            reset: reset
        };
        return dataConfig;
 
        function combine( Parent, target, options ) {
            var value = options.data || {},
                parentValue = getAddedKeys( Parent.prototype.data );
            return dispatch( parentValue, value );
        }
 
        function extend( Parent, proto, options ) {
            proto.data = combine( Parent, proto, options );
        }
 
        function init( Parent, ractive, options ) {
            var value = options.data,
                result = combine( Parent, ractive, options );
            if ( typeof result === 'function' ) {
                result = result.call( ractive, value ) || value;
            }
            return ractive.data = result || {};
        }
 
        function reset( ractive ) {
            var result = this.init( ractive.constructor, ractive, ractive );
            if ( result ) {
                ractive.data = result;
                return true;
            }
        }
 
        function getAddedKeys( parent ) {
            // only for functions that had keys added
            if ( typeof parent !== 'function' || !Object.keys( parent ).length ) {
                return parent;
            }
            // copy the added keys to temp 'object', otherwise
            // parent would be interpreted as 'function' by dispatch
            var temp = {};
            copy( parent, temp );
            // roll in added keys
            return dispatch( parent, temp );
        }
 
        function dispatch( parent, child ) {
            if ( typeof child === 'function' ) {
                return extendFn( child, parent );
            } else if ( typeof parent === 'function' ) {
                return fromFn( child, parent );
            } else {
                return fromProperties( child, parent );
            }
        }
 
        function copy( from, to, fillOnly ) {
            for ( var key in from ) {
                if ( fillOnly && key in to ) {
                    continue;
                }
                to[ key ] = from[ key ];
            }
        }
 
        function fromProperties( child, parent ) {
            child = child || {};
            if ( !parent ) {
                return child;
            }
            copy( parent, child, true );
            return child;
        }
 
        function fromFn( child, parentFn ) {
            return function( data ) {
                var keys;
                if ( child ) {
                    // Track the keys that our on the child,
                    // but not on the data. We'll need to apply these
                    // after the parent function returns.
                    keys = [];
                    for ( var key in child ) {
                        if ( !data || !( key in data ) ) {
                            keys.push( key );
                        }
                    }
                }
                // call the parent fn, use data if no return value
                data = parentFn.call( this, data ) || data;
                // Copy child keys back onto data. The child keys
                // should take precedence over whatever the
                // parent did with the data.
                if ( keys && keys.length ) {
                    data = data || {};
                    keys.forEach( function( key ) {
                        data[ key ] = child[ key ];
                    } );
                }
                return data;
            };
        }
 
        function extendFn( childFn, parent ) {
            var parentFn;
            if ( typeof parent !== 'function' ) {
                // copy props to data
                parentFn = function( data ) {
                    fromProperties( data, parent );
                };
            } else {
                parentFn = function( data ) {
                    // give parent function it's own this._super context,
                    // otherwise this._super is from child and
                    // causes infinite loop
                    parent = wrap( parent, function() {}, true );
                    return parent.call( this, data ) || data;
                };
            }
            return wrap( childFn, parentFn );
        }
    }( wrapMethod );
 
    /* config/errors.js */
    var errors = {
        missingParser: 'Missing Ractive.parse - cannot parse template. Either preparse or use the version that includes the parser',
        mergeComparisonFail: 'Merge operation: comparison failed. Falling back to identity checking',
        noComponentEventArguments: 'Components currently only support simple events - you cannot include arguments. Sorry!',
        noTemplateForPartial: 'Could not find template for partial "{name}"',
        noNestedPartials: 'Partials ({{>{name}}}) cannot contain nested inline partials',
        evaluationError: 'Error evaluating "{uniqueString}": {err}',
        badArguments: 'Bad arguments "{arguments}". I\'m not allowed to argue unless you\'ve paid.',
        failedComputation: 'Failed to compute "{key}": {err}',
        missingPlugin: 'Missing "{name}" {plugin} plugin. You may need to download a {plugin} via http://docs.ractivejs.org/latest/plugins#{plugin}s',
        badRadioInputBinding: 'A radio input can have two-way binding on its name attribute, or its checked attribute - not both',
        noRegistryFunctionReturn: 'A function was specified for "{name}" {registry}, but no {registry} was returned'
    };
 
    /* empty/parse.js */
    var parse = null;
 
    /* utils/create.js */
    var create = function() {
 
        var create;
        try {
            Object.create( null );
            create = Object.create;
        } catch ( err ) {
            // sigh
            create = function() {
                var F = function() {};
                return function( proto, props ) {
                    var obj;
                    if ( proto === null ) {
                        return {};
                    }
                    F.prototype = proto;
                    obj = new F();
                    if ( props ) {
                        Object.defineProperties( obj, props );
                    }
                    return obj;
                };
            }();
        }
        return create;
    }();
 
    /* legacy.js */
    var legacy = function() {
 
        var win, doc, exportedShims;
        if ( typeof window === 'undefined' ) {
            exportedShims = null;
        }
        win = window;
        doc = win.document;
        exportedShims = {};
        if ( !doc ) {
            exportedShims = null;
        }
        // Shims for older browsers
        if ( !Date.now ) {
            Date.now = function() {
                return +new Date();
            };
        }
        if ( !String.prototype.trim ) {
            String.prototype.trim = function() {
                return this.replace( /^\s+/, '' ).replace( /\s+$/, '' );
            };
        }
        // Polyfill for Object.keys
        // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys
        if ( !Object.keys ) {
            Object.keys = function() {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !{
                        toString: null
                    }.propertyIsEnumerable( 'toString' ),
                    dontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;
                return function( obj ) {
                    if ( typeof obj !== 'object' && typeof obj !== 'function' || obj === null ) {
                        throw new TypeError( 'Object.keys called on non-object' );
                    }
                    var result = [];
                    for ( var prop in obj ) {
                        if ( hasOwnProperty.call( obj, prop ) ) {
                            result.push( prop );
                        }
                    }
                    if ( hasDontEnumBug ) {
                        for ( var i = 0; i < dontEnumsLength; i++ ) {
                            if ( hasOwnProperty.call( obj, dontEnums[ i ] ) ) {
                                result.push( dontEnums[ i ] );
                            }
                        }
                    }
                    return result;
                };
            }();
        }
        // TODO: use defineProperty to make these non-enumerable
        // Array extras
        if ( !Array.prototype.indexOf ) {
            Array.prototype.indexOf = function( needle, i ) {
                var len;
                if ( i === undefined ) {
                    i = 0;
                }
                if ( i < 0 ) {
                    i += this.length;
                }
                if ( i < 0 ) {
                    i = 0;
                }
                for ( len = this.length; i < len; i++ ) {
                    if ( this.hasOwnProperty( i ) && this[ i ] === needle ) {
                        return i;
                    }
                }
                return -1;
            };
        }
        if ( !Array.prototype.forEach ) {
            Array.prototype.forEach = function( callback, context ) {
                var i, len;
                for ( i = 0, len = this.length; i < len; i += 1 ) {
                    if ( this.hasOwnProperty( i ) ) {
                        callback.call( context, this[ i ], i, this );
                    }
                }
            };
        }
        if ( !Array.prototype.map ) {
            Array.prototype.map = function( mapper, context ) {
                var array = this,
                    i, len, mapped = [],
                    isActuallyString;
                // incredibly, if you do something like
                // Array.prototype.map.call( someString, iterator )
                // then `this` will become an instance of String in IE8.
                // And in IE8, you then can't do string[i]. Facepalm.
                if ( array instanceof String ) {
                    array = array.toString();
                    isActuallyString = true;
                }
                for ( i = 0, len = array.length; i < len; i += 1 ) {
                    if ( array.hasOwnProperty( i ) || isActuallyString ) {
                        mapped[ i ] = mapper.call( context, array[ i ], i, array );
                    }
                }
                return mapped;
            };
        }
        if ( typeof Array.prototype.reduce !== 'function' ) {
            Array.prototype.reduce = function( callback, opt_initialValue ) {
                var i, value, len, valueIsSet;
                if ( 'function' !== typeof callback ) {
                    throw new TypeError( callback + ' is not a function' );
                }
                len = this.length;
                valueIsSet = false;
                if ( arguments.length > 1 ) {
                    value = opt_initialValue;
                    valueIsSet = true;
                }
                for ( i = 0; i < len; i += 1 ) {
                    if ( this.hasOwnProperty( i ) ) {
                        if ( valueIsSet ) {
                            value = callback( value, this[ i ], i, this );
                        }
                    } else {
                        value = this[ i ];
                        valueIsSet = true;
                    }
                }
                if ( !valueIsSet ) {
                    throw new TypeError( 'Reduce of empty array with no initial value' );
                }
                return value;
            };
        }
        if ( !Array.prototype.filter ) {
            Array.prototype.filter = function( filter, context ) {
                var i, len, filtered = [];
                for ( i = 0, len = this.length; i < len; i += 1 ) {
                    if ( this.hasOwnProperty( i ) && filter.call( context, this[ i ], i, this ) ) {
                        filtered[ filtered.length ] = this[ i ];
                    }
                }
                return filtered;
            };
        }
        if ( !Array.prototype.every ) {
            Array.prototype.every = function( iterator, context ) {
                var t, len, i;
                if ( this == null ) {
                    throw new TypeError();
                }
                t = Object( this );
                len = t.length >>> 0;
                if ( typeof iterator !== 'function' ) {
                    throw new TypeError();
                }
                for ( i = 0; i < len; i += 1 ) {
                    if ( i in t && !iterator.call( context, t[ i ], i, t ) ) {
                        return false;
                    }
                }
                return true;
            };
        }
        /*
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
            if (!Array.prototype.find) {
                Array.prototype.find = function(predicate) {
                    if (this == null) {
                    throw new TypeError('Array.prototype.find called on null or undefined');
                    }
                    if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                    }
                    var list = Object(this);
                    var length = list.length >>> 0;
                    var thisArg = arguments[1];
                    var value;
         
                    for (var i = 0; i < length; i++) {
                        if (i in list) {
                            value = list[i];
                            if (predicate.call(thisArg, value, i, list)) {
                            return value;
                            }
                        }
                    }
                    return undefined;
                }
            }
            */
        if ( typeof Function.prototype.bind !== 'function' ) {
            Function.prototype.bind = function( context ) {
                var args, fn, Empty, bound, slice = [].slice;
                if ( typeof this !== 'function' ) {
                    throw new TypeError( 'Function.prototype.bind called on non-function' );
                }
                args = slice.call( arguments, 1 );
                fn = this;
                Empty = function() {};
                bound = function() {
                    var ctx = this instanceof Empty && context ? this : context;
                    return fn.apply( ctx, args.concat( slice.call( arguments ) ) );
                };
                Empty.prototype = this.prototype;
                bound.prototype = new Empty();
                return bound;
            };
        }
        // https://gist.github.com/Rich-Harris/6010282 via https://gist.github.com/jonathantneal/2869388
        // addEventListener polyfill IE6+
        if ( !win.addEventListener ) {
            ( function( win, doc ) {
                var Event, addEventListener, removeEventListener, head, style, origCreateElement;
                Event = function( e, element ) {
                    var property, instance = this;
                    for ( property in e ) {
                        instance[ property ] = e[ property ];
                    }
                    instance.currentTarget = element;
                    instance.target = e.srcElement || element;
                    instance.timeStamp = +new Date();
                    instance.preventDefault = function() {
                        e.returnValue = false;
                    };
                    instance.stopPropagation = function() {
                        e.cancelBubble = true;
                    };
                };
                addEventListener = function( type, listener ) {
                    var element = this,
                        listeners, i;
                    listeners = element.listeners || ( element.listeners = [] );
                    i = listeners.length;
                    listeners[ i ] = [
                        listener,
                        function( e ) {
                            listener.call( element, new Event( e, element ) );
                        }
                    ];
                    element.attachEvent( 'on' + type, listeners[ i ][ 1 ] );
                };
                removeEventListener = function( type, listener ) {
                    var element = this,
                        listeners, i;
                    if ( !element.listeners ) {
                        return;
                    }
                    listeners = element.listeners;
                    i = listeners.length;
                    while ( i-- ) {
                        if ( listeners[ i ][ 0 ] === listener ) {
                            element.detachEvent( 'on' + type, listeners[ i ][ 1 ] );
                        }
                    }
                };
                win.addEventListener = doc.addEventListener = addEventListener;
                win.removeEventListener = doc.removeEventListener = removeEventListener;
                if ( 'Element' in win ) {
                    win.Element.prototype.addEventListener = addEventListener;
                    win.Element.prototype.removeEventListener = removeEventListener;
                } else {
                    // First, intercept any calls to document.createElement - this is necessary
                    // because the CSS hack (see below) doesn't come into play until after a
                    // node is added to the DOM, which is too late for a lot of Ractive setup work
                    origCreateElement = doc.createElement;
                    doc.createElement = function( tagName ) {
                        var el = origCreateElement( tagName );
                        el.addEventListener = addEventListener;
                        el.removeEventListener = removeEventListener;
                        return el;
                    };
                    // Then, mop up any additional elements that weren't created via
                    // document.createElement (i.e. with innerHTML).
                    head = doc.getElementsByTagName( 'head' )[ 0 ];
                    style = doc.createElement( 'style' );
                    head.insertBefore( style, head.firstChild );
                }
            }( win, doc ) );
        }
        // The getComputedStyle polyfill interacts badly with jQuery, so we don't attach
        // it to window. Instead, we export it for other modules to use as needed
        // https://github.com/jonathantneal/Polyfills-for-IE8/blob/master/getComputedStyle.js
        if ( !win.getComputedStyle ) {
            exportedShims.getComputedStyle = function() {
                var borderSizes = {};
 
                function getPixelSize( element, style, property, fontSize ) {
                    var sizeWithSuffix = style[ property ],
                        size = parseFloat( sizeWithSuffix ),
                        suffix = sizeWithSuffix.split( /\d/ )[ 0 ],
                        rootSize;
                    if ( isNaN( size ) ) {
                        if ( /^thin|medium|thick$/.test( sizeWithSuffix ) ) {
                            size = getBorderPixelSize( sizeWithSuffix );
                            suffix = '';
                        } else {}
                    }
                    fontSize = fontSize != null ? fontSize : /%|em/.test( suffix ) && element.parentElement ? getPixelSize( element.parentElement, element.parentElement.currentStyle, 'fontSize', null ) : 16;
                    rootSize = property == 'fontSize' ? fontSize : /width/i.test( property ) ? element.clientWidth : element.clientHeight;
                    return suffix == 'em' ? size * fontSize : suffix == 'in' ? size * 96 : suffix == 'pt' ? size * 96 / 72 : suffix == '%' ? size / 100 * rootSize : size;
                }
 
                function getBorderPixelSize( size ) {
                    var div, bcr;
                    // `thin`, `medium` and `thick` vary between browsers. (Don't ever use them.)
                    if ( !borderSizes[ size ] ) {
                        div = document.createElement( 'div' );
                        div.style.display = 'block';
                        div.style.position = 'fixed';
                        div.style.width = div.style.height = '0';
                        div.style.borderRight = size + ' solid black';
                        document.getElementsByTagName( 'body' )[ 0 ].appendChild( div );
                        bcr = div.getBoundingClientRect();
                        borderSizes[ size ] = bcr.right - bcr.left;
                    }
                    return borderSizes[ size ];
                }
 
                function setShortStyleProperty( style, property ) {
                    var borderSuffix = property == 'border' ? 'Width' : '',
                        t = property + 'Top' + borderSuffix,
                        r = property + 'Right' + borderSuffix,
                        b = property + 'Bottom' + borderSuffix,
                        l = property + 'Left' + borderSuffix;
                    style[ property ] = ( style[ t ] == style[ r ] == style[ b ] == style[ l ] ? [ style[ t ] ] : style[ t ] == style[ b ] && style[ l ] == style[ r ] ? [
                        style[ t ],
                        style[ r ]
                    ] : style[ l ] == style[ r ] ? [
                        style[ t ],
                        style[ r ],
                        style[ b ]
                    ] : [
                        style[ t ],
                        style[ r ],
                        style[ b ],
                        style[ l ]
                    ] ).join( ' ' );
                }
 
                function CSSStyleDeclaration( element ) {
                    var currentStyle, style, fontSize, property;
                    currentStyle = element.currentStyle;
                    style = this;
                    fontSize = getPixelSize( element, currentStyle, 'fontSize', null );
                    // TODO tidy this up, test it, send PR to jonathantneal!
                    for ( property in currentStyle ) {
                        if ( /width|height|margin.|padding.|border.+W/.test( property ) ) {
                            if ( currentStyle[ property ] === 'auto' ) {
                                if ( /^width|height/.test( property ) ) {
                                    // just use clientWidth/clientHeight...
                                    style[ property ] = ( property === 'width' ? element.clientWidth : element.clientHeight ) + 'px';
                                } else if ( /(?:padding)?Top|Bottom$/.test( property ) ) {
                                    style[ property ] = '0px';
                                }
                            } else {
                                style[ property ] = getPixelSize( element, currentStyle, property, fontSize ) + 'px';
                            }
                        } else if ( property === 'styleFloat' ) {
                            style.float = currentStyle[ property ];
                        } else {
                            style[ property ] = currentStyle[ property ];
                        }
                    }
                    setShortStyleProperty( style, 'margin' );
                    setShortStyleProperty( style, 'padding' );
                    setShortStyleProperty( style, 'border' );
                    style.fontSize = fontSize + 'px';
                    return style;
                }
                CSSStyleDeclaration.prototype = {
                    constructor: CSSStyleDeclaration,
                    getPropertyPriority: function() {},
                    getPropertyValue: function( prop ) {
                        return this[ prop ] || '';
                    },
                    item: function() {},
                    removeProperty: function() {},
                    setProperty: function() {},
                    getPropertyCSSValue: function() {}
                };
 
                function getComputedStyle( element ) {
                    return new CSSStyleDeclaration( element );
                }
                return getComputedStyle;
            }();
        }
        return exportedShims;
    }();
 
    /* config/options/groups/optionGroup.js */
    var optionGroup = function() {
 
        return function createOptionGroup( keys, config ) {
            var group = keys.map( config );
            keys.forEach( function( key, i ) {
                group[ key ] = group[ i ];
            } );
            return group;
        };
    }( legacy );
 
    /* config/options/groups/parseOptions.js */
    var parseOptions = function( optionGroup ) {
 
        var keys, parseOptions;
        keys = [
            'preserveWhitespace',
            'sanitize',
            'stripComments',
            'delimiters',
            'tripleDelimiters'
        ];
        parseOptions = optionGroup( keys, function( key ) {
            return key;
        } );
        return parseOptions;
    }( optionGroup );
 
    /* config/options/template/parser.js */
    var parser = function( errors, isClient, parse, create, parseOptions ) {
 
        var parser = {
            parse: doParse,
            fromId: fromId,
            isHashedId: isHashedId,
            isParsed: isParsed,
            getParseOptions: getParseOptions,
            createHelper: createHelper
        };
 
        function createHelper( parseOptions ) {
            var helper = create( parser );
            helper.parse = function( template, options ) {
                return doParse( template, options || parseOptions );
            };
            return helper;
        }
 
        function doParse( template, parseOptions ) {
            if ( !parse ) {
                throw new Error( errors.missingParser );
            }
            return parse( template, parseOptions || this.options );
        }
 
        function fromId( id, options ) {
            var template;
            if ( !isClient ) {
                if ( options && options.noThrow ) {
                    return;
                }
                throw new Error( 'Cannot retrieve template #' + id + ' as Ractive is not running in a browser.' );
            }
            if ( isHashedId( id ) ) {
                id = id.substring( 1 );
            }
            if ( !( template = document.getElementById( id ) ) ) {
                if ( options && options.noThrow ) {
                    return;
                }
                throw new Error( 'Could not find template element with id #' + id );
            }
            // Do we want to turn this on?
            /*
                if ( template.tagName.toUpperCase() !== 'SCRIPT' )) {
                    if ( options && options.noThrow ) { return; }
                    throw new Error( 'Template element with id #' + id + ', must be a <script> element' );
                }
                */
            return template.innerHTML;
        }
 
        function isHashedId( id ) {
            return id.charAt( 0 ) === '#';
        }
 
        function isParsed( template ) {
            return !( typeof template === 'string' );
        }
 
        function getParseOptions( ractive ) {
            // Could be Ractive or a Component
            if ( ractive.defaults ) {
                ractive = ractive.defaults;
            }
            return parseOptions.reduce( function( val, key ) {
                val[ key ] = ractive[ key ];
                return val;
            }, {} );
        }
        return parser;
    }( errors, isClient, parse, create, parseOptions );
 
    /* config/options/template/template.js */
    var template = function( parser, parse ) {
 
        var templateConfig = {
            name: 'template',
            extend: function extend( Parent, proto, options ) {
                var template;
                // only assign if exists
                if ( 'template' in options ) {
                    template = options.template;
                    if ( typeof template === 'function' ) {
                        proto.template = template;
                    } else {
                        proto.template = parseIfString( template, proto );
                    }
                }
            },
            init: function init( Parent, ractive, options ) {
                var template, fn;
                // TODO because of prototypal inheritance, we might just be able to use
                // ractive.template, and not bother passing through the Parent object.
                // At present that breaks the test mocks' expectations
                template = 'template' in options ? options.template : Parent.prototype.template;
                if ( typeof template === 'function' ) {
                    fn = template;
                    template = getDynamicTemplate( ractive, fn );
                    ractive._config.template = {
                        fn: fn,
                        result: template
                    };
                }
                template = parseIfString( template, ractive );
                // TODO the naming of this is confusing - ractive.template refers to [...],
                // but Component.prototype.template refers to {v:1,t:[],p:[]}...
                // it's unnecessary, because the developer never needs to access
                // ractive.template
                ractive.template = template.t;
                if ( template.p ) {
                    extendPartials( ractive.partials, template.p );
                }
            },
            reset: function( ractive ) {
                var result = resetValue( ractive ),
                    parsed;
                if ( result ) {
                    parsed = parseIfString( result, ractive );
                    ractive.template = parsed.t;
                    extendPartials( ractive.partials, parsed.p, true );
                    return true;
                }
            }
        };
 
        function resetValue( ractive ) {
            var initial = ractive._config.template,
                result;
            // If this isn't a dynamic template, there's nothing to do
            if ( !initial || !initial.fn ) {
                return;
            }
            result = getDynamicTemplate( ractive, initial.fn );
            result = parseIfString( result, ractive );
            // TODO deep equality check to prevent unnecessary re-rendering
            // in the case of already-parsed templates
            if ( result !== initial.result ) {
                initial.result = result;
                return result;
            }
        }
 
        function getDynamicTemplate( ractive, fn ) {
            var helper = parser.createHelper( parser.getParseOptions( ractive ) );
            return fn.call( ractive, ractive.data, helper );
        }
 
        function parseIfString( template, ractive ) {
            if ( typeof template === 'string' ) {
                // ID of an element containing the template?
                if ( template[ 0 ] === '#' ) {
                    template = parser.fromId( template );
                }
                template = parse( template, parser.getParseOptions( ractive ) );
            } else if ( template.v !== 1 ) {
                throw new Error( 'Mismatched template version! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app' );
            }
            return template;
        }
 
        function extendPartials( existingPartials, newPartials, overwrite ) {
            if ( !newPartials )
                return;
            // TODO there's an ambiguity here - we need to overwrite in the `reset()`
            // case, but not initially...
            for ( var key in newPartials ) {
                if ( overwrite || !existingPartials.hasOwnProperty( key ) ) {
                    existingPartials[ key ] = newPartials[ key ];
                }
            }
        }
        return templateConfig;
    }( parser, parse );
 
    /* config/options/Registry.js */
    var Registry = function( create ) {
 
        function Registry( name, useDefaults ) {
            this.name = name;
            this.useDefaults = useDefaults;
        }
        Registry.prototype = {
            constructor: Registry,
            extend: function( Parent, proto, options ) {
                this.configure( this.useDefaults ? Parent.defaults : Parent, this.useDefaults ? proto : proto.constructor, options );
            },
            init: function( Parent, ractive, options ) {
                this.configure( this.useDefaults ? Parent.defaults : Parent, ractive, options );
            },
            configure: function( Parent, target, options ) {
                var name = this.name,
                    option = options[ name ],
                    registry;
                registry = create( Parent[ name ] );
                for ( var key in option ) {
                    registry[ key ] = option[ key ];
                }
                target[ name ] = registry;
            },
            reset: function( ractive ) {
                var registry = ractive[ this.name ];
                var changed = false;
                Object.keys( registry ).forEach( function( key ) {
                    var item = registry[ key ];
                    if ( item._fn ) {
                        if ( item._fn.isOwner ) {
                            registry[ key ] = item._fn;
                        } else {
                            delete registry[ key ];
                        }
                        changed = true;
                    }
                } );
                return changed;
            },
            findOwner: function( ractive, key ) {
                return ractive[ this.name ].hasOwnProperty( key ) ? ractive : this.findConstructor( ractive.constructor, key );
            },
            findConstructor: function( constructor, key ) {
                if ( !constructor ) {
                    return;
                }
                return constructor[ this.name ].hasOwnProperty( key ) ? constructor : this.findConstructor( constructor._parent, key );
            },
            find: function( ractive, key ) {
                var this$0 = this;
                return recurseFind( ractive, function( r ) {
                    return r[ this$0.name ][ key ];
                } );
            },
            findInstance: function( ractive, key ) {
                var this$0 = this;
                return recurseFind( ractive, function( r ) {
                    return r[ this$0.name ][ key ] ? r : void 0;
                } );
            }
        };
 
        function recurseFind( ractive, fn ) {
            var find, parent;
            if ( find = fn( ractive ) ) {
                return find;
            }
            if ( !ractive.isolated && ( parent = ractive._parent ) ) {
                return recurseFind( parent, fn );
            }
        }
        return Registry;
    }( create, legacy );
 
    /* config/options/groups/registries.js */
    var registries = function( optionGroup, Registry ) {
 
        var keys = [
                'adaptors',
                'components',
                'computed',
                'decorators',
                'easing',
                'events',
                'interpolators',
                'partials',
                'transitions'
            ],
            registries = optionGroup( keys, function( key ) {
                return new Registry( key, key === 'computed' );
            } );
        return registries;
    }( optionGroup, Registry );
 
    /* utils/noop.js */
    var noop = function() {};
 
    /* utils/wrapPrototypeMethod.js */
    var wrapPrototypeMethod = function( noop ) {
 
        return function wrap( parent, name, method ) {
            if ( !/_super/.test( method ) ) {
                return method;
            }
            var wrapper = function wrapSuper() {
                var superMethod = getSuperMethod( wrapper._parent, name ),
                    hasSuper = '_super' in this,
                    oldSuper = this._super,
                    result;
                this._super = superMethod;
                result = method.apply( this, arguments );
                if ( hasSuper ) {
                    this._super = oldSuper;
                } else {
                    delete this._super;
                }
                return result;
            };
            wrapper._parent = parent;
            wrapper._method = method;
            return wrapper;
        };
 
        function getSuperMethod( parent, name ) {
            var method;
            if ( name in parent ) {
                var value = parent[ name ];
                if ( typeof value === 'function' ) {
                    method = value;
                } else {
                    method = function returnValue() {
                        return value;
                    };
                }
            } else {
                method = noop;
            }
            return method;
        }
    }( noop );
 
    /* config/deprecate.js */
    var deprecate = function( warn, isArray ) {
 
        function deprecate( options, deprecated, correct ) {
            if ( deprecated in options ) {
                if ( !( correct in options ) ) {
                    warn( getMessage( deprecated, correct ) );
                    options[ correct ] = options[ deprecated ];
                } else {
                    throw new Error( getMessage( deprecated, correct, true ) );
                }
            }
        }
 
        function getMessage( deprecated, correct, isError ) {
            return 'options.' + deprecated + ' has been deprecated in favour of options.' + correct + '.' + ( isError ? ' You cannot specify both options, please use options.' + correct + '.' : '' );
        }
 
        function deprecateEventDefinitions( options ) {
            deprecate( options, 'eventDefinitions', 'events' );
        }
 
        function deprecateAdaptors( options ) {
            // Using extend with Component instead of options,
            // like Human.extend( Spider ) means adaptors as a registry
            // gets copied to options. So we have to check if actually an array
            if ( isArray( options.adaptors ) ) {
                deprecate( options, 'adaptors', 'adapt' );
            }
        }
        return function deprecateOptions( options ) {
            deprecateEventDefinitions( options );
            deprecateAdaptors( options );
        };
    }( warn, isArray );
 
    /* config/config.js */
    var config = function( css, data, defaults, template, parseOptions, registries, wrap, deprecate ) {
 
        var custom, options, config;
        custom = {
            data: data,
            template: template,
            css: css
        };
        options = Object.keys( defaults ).filter( function( key ) {
            return !registries[ key ] && !custom[ key ] && !parseOptions[ key ];
        } );
        // this defines the order:
        config = [].concat( custom.data, parseOptions, options, registries, custom.template, custom.css );
        for ( var key in custom ) {
            config[ key ] = custom[ key ];
        }
        // for iteration
        config.keys = Object.keys( defaults ).concat( registries.map( function( r ) {
            return r.name;
        } ) ).concat( [ 'css' ] );
        config.parseOptions = parseOptions;
        config.registries = registries;
 
        function customConfig( method, key, Parent, instance, options ) {
            custom[ key ][ method ]( Parent, instance, options );
        }
        config.extend = function( Parent, proto, options ) {
            configure( 'extend', Parent, proto, options );
        };
        config.init = function( Parent, ractive, options ) {
            configure( 'init', Parent, ractive, options );
            if ( ractive._config ) {
                ractive._config.options = options;
            }
        };
 
        function configure( method, Parent, instance, options ) {
            deprecate( options );
            customConfig( method, 'data', Parent, instance, options );
            config.parseOptions.forEach( function( key ) {
                if ( key in options ) {
                    instance[ key ] = options[ key ];
                }
            } );
            for ( var key in options ) {
                if ( key in defaults && !( key in config.parseOptions ) && !( key in custom ) ) {
                    var value = options[ key ];
                    instance[ key ] = typeof value === 'function' ? wrap( Parent.prototype, key, value ) : value;
                }
            }
            config.registries.forEach( function( registry ) {
                registry[ method ]( Parent, instance, options );
            } );
            customConfig( method, 'template', Parent, instance, options );
            customConfig( method, 'css', Parent, instance, options );
        }
        config.reset = function( ractive ) {
            return config.filter( function( c ) {
                return c.reset && c.reset( ractive );
            } );
        };
        return config;
    }( css, data, options, template, parseOptions, registries, wrapPrototypeMethod, deprecate );
 
    /* shared/interpolate.js */
    var interpolate = function( circular, warn, interpolators, config ) {
 
        var interpolate = function( from, to, ractive, type ) {
            if ( from === to ) {
                return snap( to );
            }
            if ( type ) {
                var interpol = config.registries.interpolators.find( ractive, type );
                if ( interpol ) {
                    return interpol( from, to ) || snap( to );
                }
                warn( 'Missing "' + type + '" interpolator. You may need to download a plugin from [TODO]' );
            }
            return interpolators.number( from, to ) || interpolators.array( from, to ) || interpolators.object( from, to ) || interpolators.cssLength( from, to ) || snap( to );
        };
        circular.interpolate = interpolate;
        return interpolate;
 
        function snap( to ) {
            return function() {
                return to;
            };
        }
    }( circular, warn, interpolators, config );
 
    /* Ractive/prototype/animate/Animation.js */
    var Ractive$animate_Animation = function( warn, runloop, interpolate ) {
 
        var Animation = function( options ) {
            var key;
            this.startTime = Date.now();
            // from and to
            for ( key in options ) {
                if ( options.hasOwnProperty( key ) ) {
                    this[ key ] = options[ key ];
                }
            }
            this.interpolator = interpolate( this.from, this.to, this.root, this.interpolator );
            this.running = true;
        };
        Animation.prototype = {
            tick: function() {
                var elapsed, t, value, timeNow, index, keypath;
                keypath = this.keypath;
                if ( this.running ) {
                    timeNow = Date.now();
                    elapsed = timeNow - this.startTime;
                    if ( elapsed >= this.duration ) {
                        if ( keypath !== null ) {
                            runloop.start( this.root );
                            this.root.viewmodel.set( keypath, this.to );
                            runloop.end();
                        }
                        if ( this.step ) {
                            this.step( 1, this.to );
                        }
                        this.complete( this.to );
                        index = this.root._animations.indexOf( this );
                        // TODO investigate why this happens
                        if ( index === -1 ) {
                            warn( 'Animation was not found' );
                        }
                        this.root._animations.splice( index, 1 );
                        this.running = false;
                        return false;
                    }
                    t = this.easing ? this.easing( elapsed / this.duration ) : elapsed / this.duration;
                    if ( keypath !== null ) {
                        value = this.interpolator( t );
                        runloop.start( this.root );
                        this.root.viewmodel.set( keypath, value );
                        runloop.end();
                    }
                    if ( this.step ) {
                        this.step( t, value );
                    }
                    return true;
                }
                return false;
            },
            stop: function() {
                var index;
                this.running = false;
                index = this.root._animations.indexOf( this );
                // TODO investigate why this happens
                if ( index === -1 ) {
                    warn( 'Animation was not found' );
                }
                this.root._animations.splice( index, 1 );
            }
        };
        return Animation;
    }( warn, runloop, interpolate );
 
    /* Ractive/prototype/animate.js */
    var Ractive$animate = function( isEqual, Promise, normaliseKeypath, animations, Animation ) {
 
        var noop = function() {},
            noAnimation = {
                stop: noop
            };
        return function Ractive$animate( keypath, to, options ) {
            var promise, fulfilPromise, k, animation, animations, easing, duration, step, complete, makeValueCollector, currentValues, collectValue, dummy, dummyOptions;
            promise = new Promise( function( fulfil ) {
                fulfilPromise = fulfil;
            } );
            // animate multiple keypaths
            if ( typeof keypath === 'object' ) {
                options = to || {};
                easing = options.easing;
                duration = options.duration;
                animations = [];
                // we don't want to pass the `step` and `complete` handlers, as they will
                // run for each animation! So instead we'll store the handlers and create
                // our own...
                step = options.step;
                complete = options.complete;
                if ( step || complete ) {
                    currentValues = {};
                    options.step = null;
                    options.complete = null;
                    makeValueCollector = function( keypath ) {
                        return function( t, value ) {
                            currentValues[ keypath ] = value;
                        };
                    };
                }
                for ( k in keypath ) {
                    if ( keypath.hasOwnProperty( k ) ) {
                        if ( step || complete ) {
                            collectValue = makeValueCollector( k );
                            options = {
                                easing: easing,
                                duration: duration
                            };
                            if ( step ) {
                                options.step = collectValue;
                            }
                        }
                        options.complete = complete ? collectValue : noop;
                        animations.push( animate( this, k, keypath[ k ], options ) );
                    }
                }
                if ( step || complete ) {
                    dummyOptions = {
                        easing: easing,
                        duration: duration
                    };
                    if ( step ) {
                        dummyOptions.step = function( t ) {
                            step( t, currentValues );
                        };
                    }
                    if ( complete ) {
                        promise.then( function( t ) {
                            complete( t, currentValues );
                        } );
                    }
                    dummyOptions.complete = fulfilPromise;
                    dummy = animate( this, null, null, dummyOptions );
                    animations.push( dummy );
                }
                return {
                    stop: function() {
                        var animation;
                        while ( animation = animations.pop() ) {
                            animation.stop();
                        }
                        if ( dummy ) {
                            dummy.stop();
                        }
                    }
                };
            }
            // animate a single keypath
            options = options || {};
            if ( options.complete ) {
                promise.then( options.complete );
            }
            options.complete = fulfilPromise;
            animation = animate( this, keypath, to, options );
            promise.stop = function() {
                animation.stop();
            };
            return promise;
        };
 
        function animate( root, keypath, to, options ) {
            var easing, duration, animation, from;
            if ( keypath ) {
                keypath = normaliseKeypath( keypath );
            }
            if ( keypath !== null ) {
                from = root.viewmodel.get( keypath );
            }
            // cancel any existing animation
            // TODO what about upstream/downstream keypaths?
            animations.abort( keypath, root );
            // don't bother animating values that stay the same
            if ( isEqual( from, to ) ) {
                if ( options.complete ) {
                    options.complete( options.to );
                }
                return noAnimation;
            }
            // easing function
            if ( options.easing ) {
                if ( typeof options.easing === 'function' ) {
                    easing = options.easing;
                } else {
                    easing = root.easing[ options.easing ];
                }
                if ( typeof easing !== 'function' ) {
                    easing = null;
                }
            }
            // duration
            duration = options.duration === undefined ? 400 : options.duration;
            // TODO store keys, use an internal set method
            animation = new Animation( {
                keypath: keypath,
                from: from,
                to: to,
                root: root,
                duration: duration,
                easing: easing,
                interpolator: options.interpolator,
                // TODO wrap callbacks if necessary, to use instance as context
                step: options.step,
                complete: options.complete
            } );
            animations.add( animation );
            root._animations.push( animation );
            return animation;
        }
    }( isEqual, Promise, normaliseKeypath, animations, Ractive$animate_Animation );
 
    /* Ractive/prototype/detach.js */
    var Ractive$detach = function( removeFromArray ) {
 
        return function Ractive$detach() {
            if ( this.el ) {
                removeFromArray( this.el.__ractive_instances__, this );
            }
            return this.fragment.detach();
        };
    }( removeFromArray );
 
    /* Ractive/prototype/find.js */
    var Ractive$find = function Ractive$find( selector ) {
        if ( !this.el ) {
            return null;
        }
        return this.fragment.find( selector );
    };
 
    /* utils/matches.js */
    var matches = function( isClient, vendors, createElement ) {
 
        var matches, div, methodNames, unprefixed, prefixed, i, j, makeFunction;
        if ( !isClient ) {
            matches = null;
        } else {
            div = createElement( 'div' );
            methodNames = [
                'matches',
                'matchesSelector'
            ];
            makeFunction = function( methodName ) {
                return function( node, selector ) {
                    return node[ methodName ]( selector );
                };
            };
            i = methodNames.length;
            while ( i-- && !matches ) {
                unprefixed = methodNames[ i ];
                if ( div[ unprefixed ] ) {
                    matches = makeFunction( unprefixed );
                } else {
                    j = vendors.length;
                    while ( j-- ) {
                        prefixed = vendors[ i ] + unprefixed.substr( 0, 1 ).toUpperCase() + unprefixed.substring( 1 );
                        if ( div[ prefixed ] ) {
                            matches = makeFunction( prefixed );
                            break;
                        }
                    }
                }
            }
            // IE8...
            if ( !matches ) {
                matches = function( node, selector ) {
                    var nodes, parentNode, i;
                    parentNode = node.parentNode;
                    if ( !parentNode ) {
                        // empty dummy <div>
                        div.innerHTML = '';
                        parentNode = div;
                        node = node.cloneNode();
                        div.appendChild( node );
                    }
                    nodes = parentNode.querySelectorAll( selector );
                    i = nodes.length;
                    while ( i-- ) {
                        if ( nodes[ i ] === node ) {
                            return true;
                        }
                    }
                    return false;
                };
            }
        }
        return matches;
    }( isClient, vendors, createElement );
 
    /* Ractive/prototype/shared/makeQuery/test.js */
    var Ractive$shared_makeQuery_test = function( matches ) {
 
        return function( item, noDirty ) {
            var itemMatches = this._isComponentQuery ? !this.selector || item.name === this.selector : matches( item.node, this.selector );
            if ( itemMatches ) {
                this.push( item.node || item.instance );
                if ( !noDirty ) {
                    this._makeDirty();
                }
                return true;
            }
        };
    }( matches );
 
    /* Ractive/prototype/shared/makeQuery/cancel.js */
    var Ractive$shared_makeQuery_cancel = function() {
        var liveQueries, selector, index;
        liveQueries = this._root[ this._isComponentQuery ? 'liveComponentQueries' : 'liveQueries' ];
        selector = this.selector;
        index = liveQueries.indexOf( selector );
        if ( index !== -1 ) {
            liveQueries.splice( index, 1 );
            liveQueries[ selector ] = null;
        }
    };
 
    /* Ractive/prototype/shared/makeQuery/sortByItemPosition.js */
    var Ractive$shared_makeQuery_sortByItemPosition = function() {
 
        return function( a, b ) {
            var ancestryA, ancestryB, oldestA, oldestB, mutualAncestor, indexA, indexB, fragments, fragmentA, fragmentB;
            ancestryA = getAncestry( a.component || a._ractive.proxy );
            ancestryB = getAncestry( b.component || b._ractive.proxy );
            oldestA = ancestryA[ ancestryA.length - 1 ];
            oldestB = ancestryB[ ancestryB.length - 1 ];
            // remove items from the end of both ancestries as long as they are identical
            // - the final one removed is the closest mutual ancestor
            while ( oldestA && oldestA === oldestB ) {
                ancestryA.pop();
                ancestryB.pop();
                mutualAncestor = oldestA;
                oldestA = ancestryA[ ancestryA.length - 1 ];
                oldestB = ancestryB[ ancestryB.length - 1 ];
            }
            // now that we have the mutual ancestor, we can find which is earliest
            oldestA = oldestA.component || oldestA;
            oldestB = oldestB.component || oldestB;
            fragmentA = oldestA.parentFragment;
            fragmentB = oldestB.parentFragment;
            // if both items share a parent fragment, our job is easy
            if ( fragmentA === fragmentB ) {
                indexA = fragmentA.items.indexOf( oldestA );
                indexB = fragmentB.items.indexOf( oldestB );
                // if it's the same index, it means one contains the other,
                // so we see which has the longest ancestry
                return indexA - indexB || ancestryA.length - ancestryB.length;
            }
            // if mutual ancestor is a section, we first test to see which section
            // fragment comes first
            if ( fragments = mutualAncestor.fragments ) {
                indexA = fragments.indexOf( fragmentA );
                indexB = fragments.indexOf( fragmentB );
                return indexA - indexB || ancestryA.length - ancestryB.length;
            }
            throw new Error( 'An unexpected condition was met while comparing the position of two components. Please file an issue at https://github.com/RactiveJS/Ractive/issues - thanks!' );
        };
 
        function getParent( item ) {
            var parentFragment;
            if ( parentFragment = item.parentFragment ) {
                return parentFragment.owner;
            }
            if ( item.component && ( parentFragment = item.component.parentFragment ) ) {
                return parentFragment.owner;
            }
        }
 
        function getAncestry( item ) {
            var ancestry, ancestor;
            ancestry = [ item ];
            ancestor = getParent( item );
            while ( ancestor ) {
                ancestry.push( ancestor );
                ancestor = getParent( ancestor );
            }
            return ancestry;
        }
    }();
 
    /* Ractive/prototype/shared/makeQuery/sortByDocumentPosition.js */
    var Ractive$shared_makeQuery_sortByDocumentPosition = function( sortByItemPosition ) {
 
        return function( node, otherNode ) {
            var bitmask;
            if ( node.compareDocumentPosition ) {
                bitmask = node.compareDocumentPosition( otherNode );
                return bitmask & 2 ? 1 : -1;
            }
            // In old IE, we can piggy back on the mechanism for
            // comparing component positions
            return sortByItemPosition( node, otherNode );
        };
    }( Ractive$shared_makeQuery_sortByItemPosition );
 
    /* Ractive/prototype/shared/makeQuery/sort.js */
    var Ractive$shared_makeQuery_sort = function( sortByDocumentPosition, sortByItemPosition ) {
 
        return function() {
            this.sort( this._isComponentQuery ? sortByItemPosition : sortByDocumentPosition );
            this._dirty = false;
        };
    }( Ractive$shared_makeQuery_sortByDocumentPosition, Ractive$shared_makeQuery_sortByItemPosition );
 
    /* Ractive/prototype/shared/makeQuery/dirty.js */
    var Ractive$shared_makeQuery_dirty = function( runloop ) {
 
        return function() {
            var this$0 = this;
            if ( !this._dirty ) {
                this._dirty = true;
                // Once the DOM has been updated, ensure the query
                // is correctly ordered
                runloop.scheduleTask( function() {
                    this$0._sort();
                } );
            }
        };
    }( runloop );
 
    /* Ractive/prototype/shared/makeQuery/remove.js */
    var Ractive$shared_makeQuery_remove = function( nodeOrComponent ) {
        var index = this.indexOf( this._isComponentQuery ? nodeOrComponent.instance : nodeOrComponent );
        if ( index !== -1 ) {
            this.splice( index, 1 );
        }
    };
 
    /* Ractive/prototype/shared/makeQuery/_makeQuery.js */
    var Ractive$shared_makeQuery__makeQuery = function( defineProperties, test, cancel, sort, dirty, remove ) {
 
        return function makeQuery( ractive, selector, live, isComponentQuery ) {
            var query = [];
            defineProperties( query, {
                selector: {
                    value: selector
                },
                live: {
                    value: live
                },
                _isComponentQuery: {
                    value: isComponentQuery
                },
                _test: {
                    value: test
                }
            } );
            if ( !live ) {
                return query;
            }
            defineProperties( query, {
                cancel: {
                    value: cancel
                },
                _root: {
                    value: ractive
                },
                _sort: {
                    value: sort
                },
                _makeDirty: {
                    value: dirty
                },
                _remove: {
                    value: remove
                },
                _dirty: {
                    value: false,
                    writable: true
                }
            } );
            return query;
        };
    }( defineProperties, Ractive$shared_makeQuery_test, Ractive$shared_makeQuery_cancel, Ractive$shared_makeQuery_sort, Ractive$shared_makeQuery_dirty, Ractive$shared_makeQuery_remove );
 
    /* Ractive/prototype/findAll.js */
    var Ractive$findAll = function( makeQuery ) {
 
        return function Ractive$findAll( selector, options ) {
            var liveQueries, query;
            if ( !this.el ) {
                return [];
            }
            options = options || {};
            liveQueries = this._liveQueries;
            // Shortcut: if we're maintaining a live query with this
            // selector, we don't need to traverse the parallel DOM
            if ( query = liveQueries[ selector ] ) {
                // Either return the exact same query, or (if not live) a snapshot
                return options && options.live ? query : query.slice();
            }
            query = makeQuery( this, selector, !!options.live, false );
            // Add this to the list of live queries Ractive needs to maintain,
            // if applicable
            if ( query.live ) {
                liveQueries.push( selector );
                liveQueries[ '_' + selector ] = query;
            }
            this.fragment.findAll( selector, query );
            return query;
        };
    }( Ractive$shared_makeQuery__makeQuery );
 
    /* Ractive/prototype/findAllComponents.js */
    var Ractive$findAllComponents = function( makeQuery ) {
 
        return function Ractive$findAllComponents( selector, options ) {
            var liveQueries, query;
            options = options || {};
            liveQueries = this._liveComponentQueries;
            // Shortcut: if we're maintaining a live query with this
            // selector, we don't need to traverse the parallel DOM
            if ( query = liveQueries[ selector ] ) {
                // Either return the exact same query, or (if not live) a snapshot
                return options && options.live ? query : query.slice();
            }
            query = makeQuery( this, selector, !!options.live, true );
            // Add this to the list of live queries Ractive needs to maintain,
            // if applicable
            if ( query.live ) {
                liveQueries.push( selector );
                liveQueries[ '_' + selector ] = query;
            }
            this.fragment.findAllComponents( selector, query );
            return query;
        };
    }( Ractive$shared_makeQuery__makeQuery );
 
    /* Ractive/prototype/findComponent.js */
    var Ractive$findComponent = function Ractive$findComponent( selector ) {
        return this.fragment.findComponent( selector );
    };
 
    /* Ractive/prototype/fire.js */
    var Ractive$fire = function Ractive$fire( eventName ) {
        var args, i, len, subscribers = this._subs[ eventName ];
        if ( !subscribers ) {
            return;
        }
        args = Array.prototype.slice.call( arguments, 1 );
        for ( i = 0, len = subscribers.length; i < len; i += 1 ) {
            subscribers[ i ].apply( this, args );
        }
    };
 
    /* Ractive/prototype/get.js */
    var Ractive$get = function( normaliseKeypath ) {
 
        var options = {
            capture: true
        };
        // top-level calls should be intercepted
        return function Ractive$get( keypath ) {
            keypath = normaliseKeypath( keypath );
            return this.viewmodel.get( keypath, options );
        };
    }( normaliseKeypath );
 
    /* utils/getElement.js */
    var getElement = function getElement( input ) {
        var output;
        if ( !input || typeof input === 'boolean' ) {
            return;
        }
        if ( typeof window === 'undefined' || !document || !input ) {
            return null;
        }
        // We already have a DOM node - no work to do. (Duck typing alert!)
        if ( input.nodeType ) {
            return input;
        }
        // Get node from string
        if ( typeof input === 'string' ) {
            // try ID first
            output = document.getElementById( input );
            // then as selector, if possible
            if ( !output && document.querySelector ) {
                output = document.querySelector( input );
            }
            // did it work?
            if ( output && output.nodeType ) {
                return output;
            }
        }
        // If we've been given a collection (jQuery, Zepto etc), extract the first item
        if ( input[ 0 ] && input[ 0 ].nodeType ) {
            return input[ 0 ];
        }
        return null;
    };
 
    /* Ractive/prototype/insert.js */
    var Ractive$insert = function( getElement ) {
 
        return function Ractive$insert( target, anchor ) {
            if ( !this.rendered ) {
                // TODO create, and link to, documentation explaining this
                throw new Error( 'The API has changed - you must call `ractive.render(target[, anchor])` to render your Ractive instance. Once rendered you can use `ractive.insert()`.' );
            }
            target = getElement( target );
            anchor = getElement( anchor ) || null;
            if ( !target ) {
                throw new Error( 'You must specify a valid target to insert into' );
            }
            target.insertBefore( this.detach(), anchor );
            this.el = target;
            ( target.__ractive_instances__ || ( target.__ractive_instances__ = [] ) ).push( this );
        };
    }( getElement );
 
    /* Ractive/prototype/merge.js */
    var Ractive$merge = function( runloop, isArray, normaliseKeypath ) {
 
        return function Ractive$merge( keypath, array, options ) {
            var currentArray, promise;
            keypath = normaliseKeypath( keypath );
            currentArray = this.viewmodel.get( keypath );
            // If either the existing value or the new value isn't an
            // array, just do a regular set
            if ( !isArray( currentArray ) || !isArray( array ) ) {
                return this.set( keypath, array, options && options.complete );
            }
            // Manage transitions
            promise = runloop.start( this, true );
            this.viewmodel.merge( keypath, currentArray, array, options );
            runloop.end();
            // attach callback as fulfilment handler, if specified
            if ( options && options.complete ) {
                promise.then( options.complete );
            }
            return promise;
        };
    }( runloop, isArray, normaliseKeypath );
 
    /* Ractive/prototype/observe/Observer.js */
    var Ractive$observe_Observer = function( runloop, isEqual ) {
 
        var Observer = function( ractive, keypath, callback, options ) {
            this.root = ractive;
            this.keypath = keypath;
            this.callback = callback;
            this.defer = options.defer;
            this.debug = options.debug;
            // Observers are notified before any DOM changes take place (though
            // they can defer execution until afterwards)
            this.priority = 0;
            // default to root as context, but allow it to be overridden
            this.context = options && options.context ? options.context : ractive;
        };
        Observer.prototype = {
            init: function( immediate ) {
                this.value = this.root.viewmodel.get( this.keypath );
                if ( immediate !== false ) {
                    this.update();
                }
            },
            setValue: function( value ) {
                var this$0 = this;
                if ( !isEqual( value, this.value ) ) {
                    this.value = value;
                    if ( this.defer && this.ready ) {
                        runloop.scheduleTask( function() {
                            return this$0.update();
                        } );
                    } else {
                        this.update();
                    }
                }
            },
            update: function() {
                // Prevent infinite loops
                if ( this.updating ) {
                    return;
                }
                this.updating = true;
                this.callback.call( this.context, this.value, this.oldValue, this.keypath );
                this.oldValue = this.value;
                this.updating = false;
            }
        };
        return Observer;
    }( runloop, isEqual );
 
    /* shared/getMatchingKeypaths.js */
    var getMatchingKeypaths = function( isArray ) {
 
        return function getMatchingKeypaths( ractive, pattern ) {
            var keys, key, matchingKeypaths;
            keys = pattern.split( '.' );
            matchingKeypaths = [ '' ];
            while ( key = keys.shift() ) {
                if ( key === '*' ) {
                    // expand to find all valid child keypaths
                    matchingKeypaths = matchingKeypaths.reduce( expand, [] );
                } else {
                    if ( matchingKeypaths[ 0 ] === '' ) {
                        // first key
                        matchingKeypaths[ 0 ] = key;
                    } else {
                        matchingKeypaths = matchingKeypaths.map( concatenate( key ) );
                    }
                }
            }
            return matchingKeypaths;
 
            function expand( matchingKeypaths, keypath ) {
                var value, key, childKeypath;
                value = ractive.viewmodel.wrapped[ keypath ] ? ractive.viewmodel.wrapped[ keypath ].get() : ractive.get( keypath );
                for ( key in value ) {
                    if ( value.hasOwnProperty( key ) && ( key !== '_ractive' || !isArray( value ) ) ) {
                        // for benefit of IE8
                        childKeypath = keypath ? keypath + '.' + key : key;
                        matchingKeypaths.push( childKeypath );
                    }
                }
                return matchingKeypaths;
            }
 
            function concatenate( key ) {
                return function( keypath ) {
                    return keypath ? keypath + '.' + key : key;
                };
            }
        };
    }( isArray );
 
    /* Ractive/prototype/observe/getPattern.js */
    var Ractive$observe_getPattern = function( getMatchingKeypaths ) {
 
        return function getPattern( ractive, pattern ) {
            var matchingKeypaths, values;
            matchingKeypaths = getMatchingKeypaths( ractive, pattern );
            values = {};
            matchingKeypaths.forEach( function( keypath ) {
                values[ keypath ] = ractive.get( keypath );
            } );
            return values;
        };
    }( getMatchingKeypaths );
 
    /* Ractive/prototype/observe/PatternObserver.js */
    var Ractive$observe_PatternObserver = function( runloop, isEqual, getPattern ) {
 
        var PatternObserver, wildcard = /\*/,
            slice = Array.prototype.slice;
        PatternObserver = function( ractive, keypath, callback, options ) {
            this.root = ractive;
            this.callback = callback;
            this.defer = options.defer;
            this.debug = options.debug;
            this.keypath = keypath;
            this.regex = new RegExp( '^' + keypath.replace( /\./g, '\\.' ).replace( /\*/g, '([^\\.]+)' ) + '$' );
            this.values = {};
            if ( this.defer ) {
                this.proxies = [];
            }
            // Observers are notified before any DOM changes take place (though
            // they can defer execution until afterwards)
            this.priority = 'pattern';
            // default to root as context, but allow it to be overridden
            this.context = options && options.context ? options.context : ractive;
        };
        PatternObserver.prototype = {
            init: function( immediate ) {
                var values, keypath;
                values = getPattern( this.root, this.keypath );
                if ( immediate !== false ) {
                    for ( keypath in values ) {
                        if ( values.hasOwnProperty( keypath ) ) {
                            this.update( keypath );
                        }
                    }
                } else {
                    this.values = values;
                }
            },
            update: function( keypath ) {
                var values;
                if ( wildcard.test( keypath ) ) {
                    values = getPattern( this.root, keypath );
                    for ( keypath in values ) {
                        if ( values.hasOwnProperty( keypath ) ) {
                            this.update( keypath );
                        }
                    }
                    return;
                }
                // special case - array mutation should not trigger `array.*`
                // pattern observer with `array.length`
                if ( this.root.viewmodel.implicitChanges[ keypath ] ) {
                    return;
                }
                if ( this.defer && this.ready ) {
                    runloop.addObserver( this.getProxy( keypath ) );
                    return;
                }
                this.reallyUpdate( keypath );
            },
            reallyUpdate: function( keypath ) {
                var value, keys, args;
                value = this.root.viewmodel.get( keypath );
                // Prevent infinite loops
                if ( this.updating ) {
                    this.values[ keypath ] = value;
                    return;
                }
                this.updating = true;
                if ( !isEqual( value, this.values[ keypath ] ) || !this.ready ) {
                    keys = slice.call( this.regex.exec( keypath ), 1 );
                    args = [
                        value,
                        this.values[ keypath ],
                        keypath
                    ].concat( keys );
                    this.callback.apply( this.context, args );
                    this.values[ keypath ] = value;
                }
                this.updating = false;
            },
            getProxy: function( keypath ) {
                var self = this;
                if ( !this.proxies[ keypath ] ) {
                    this.proxies[ keypath ] = {
                        update: function() {
                            self.reallyUpdate( keypath );
                        }
                    };
                }
                return this.proxies[ keypath ];
            }
        };
        return PatternObserver;
    }( runloop, isEqual, Ractive$observe_getPattern );
 
    /* Ractive/prototype/observe/getObserverFacade.js */
    var Ractive$observe_getObserverFacade = function( normaliseKeypath, Observer, PatternObserver ) {
 
        var wildcard = /\*/,
            emptyObject = {};
        return function getObserverFacade( ractive, keypath, callback, options ) {
            var observer, isPatternObserver, cancelled;
            keypath = normaliseKeypath( keypath );
            options = options || emptyObject;
            // pattern observers are treated differently
            if ( wildcard.test( keypath ) ) {
                observer = new PatternObserver( ractive, keypath, callback, options );
                ractive.viewmodel.patternObservers.push( observer );
                isPatternObserver = true;
            } else {
                observer = new Observer( ractive, keypath, callback, options );
            }
            ractive.viewmodel.register( keypath, observer, isPatternObserver ? 'patternObservers' : 'observers' );
            observer.init( options.init );
            // This flag allows observers to initialise even with undefined values
            observer.ready = true;
            return {
                cancel: function() {
                    var index;
                    if ( cancelled ) {
                        return;
                    }
                    if ( isPatternObserver ) {
                        index = ractive.viewmodel.patternObservers.indexOf( observer );
                        ractive.viewmodel.patternObservers.splice( index, 1 );
                        ractive.viewmodel.unregister( keypath, observer, 'patternObservers' );
                    }
                    ractive.viewmodel.unregister( keypath, observer, 'observers' );
                    cancelled = true;
                }
            };
        };
    }( normaliseKeypath, Ractive$observe_Observer, Ractive$observe_PatternObserver );
 
    /* Ractive/prototype/observe.js */
    var Ractive$observe = function( isObject, getObserverFacade ) {
 
        return function Ractive$observe( keypath, callback, options ) {
            var observers, map, keypaths, i;
            // Allow a map of keypaths to handlers
            if ( isObject( keypath ) ) {
                options = callback;
                map = keypath;
                observers = [];
                for ( keypath in map ) {
                    if ( map.hasOwnProperty( keypath ) ) {
                        callback = map[ keypath ];
                        observers.push( this.observe( keypath, callback, options ) );
                    }
                }
                return {
                    cancel: function() {
                        while ( observers.length ) {
                            observers.pop().cancel();
                        }
                    }
                };
            }
            // Allow `ractive.observe( callback )` - i.e. observe entire model
            if ( typeof keypath === 'function' ) {
                options = callback;
                callback = keypath;
                keypath = '';
                return getObserverFacade( this, keypath, callback, options );
            }
            keypaths = keypath.split( ' ' );
            // Single keypath
            if ( keypaths.length === 1 ) {
                return getObserverFacade( this, keypath, callback, options );
            }
            // Multiple space-separated keypaths
            observers = [];
            i = keypaths.length;
            while ( i-- ) {
                keypath = keypaths[ i ];
                if ( keypath ) {
                    observers.push( getObserverFacade( this, keypath, callback, options ) );
                }
            }
            return {
                cancel: function() {
                    while ( observers.length ) {
                        observers.pop().cancel();
                    }
                }
            };
        };
    }( isObject, Ractive$observe_getObserverFacade );
 
    /* Ractive/prototype/shared/trim.js */
    var Ractive$shared_trim = function( str ) {
        return str.trim();
    };
 
    /* Ractive/prototype/shared/notEmptyString.js */
    var Ractive$shared_notEmptyString = function( str ) {
        return str !== '';
    };
 
    /* Ractive/prototype/off.js */
    var Ractive$off = function( trim, notEmptyString ) {
 
        return function Ractive$off( eventName, callback ) {
            var this$0 = this;
            var eventNames;
            // if no arguments specified, remove all callbacks
            if ( !eventName ) {
                // TODO use this code instead, once the following issue has been resolved
                // in PhantomJS (tests are unpassable otherwise!)
                // https://github.com/ariya/phantomjs/issues/11856
                // defineProperty( this, '_subs', { value: create( null ), configurable: true });
                for ( eventName in this._subs ) {
                    delete this._subs[ eventName ];
                }
            } else {
                // Handle multiple space-separated event names
                eventNames = eventName.split( ' ' ).map( trim ).filter( notEmptyString );
                eventNames.forEach( function( eventName ) {
                    var subscribers, index;
                    // If we have subscribers for this event...
                    if ( subscribers = this$0._subs[ eventName ] ) {
                        // ...if a callback was specified, only remove that
                        if ( callback ) {
                            index = subscribers.indexOf( callback );
                            if ( index !== -1 ) {
                                subscribers.splice( index, 1 );
                            }
                        } else {
                            this$0._subs[ eventName ] = [];
                        }
                    }
                } );
            }
            return this;
        };
    }( Ractive$shared_trim, Ractive$shared_notEmptyString );
 
    /* Ractive/prototype/on.js */
    var Ractive$on = function( trim, notEmptyString ) {
 
        return function Ractive$on( eventName, callback ) {
            var this$0 = this;
            var self = this,
                listeners, n, eventNames;
            // allow mutliple listeners to be bound in one go
            if ( typeof eventName === 'object' ) {
                listeners = [];
                for ( n in eventName ) {
                    if ( eventName.hasOwnProperty( n ) ) {
                        listeners.push( this.on( n, eventName[ n ] ) );
                    }
                }
                return {
                    cancel: function() {
                        var listener;
                        while ( listener = listeners.pop() ) {
                            listener.cancel();
                        }
                    }
                };
            }
            // Handle multiple space-separated event names
            eventNames = eventName.split( ' ' ).map( trim ).filter( notEmptyString );
            eventNames.forEach( function( eventName ) {
                ( this$0._subs[ eventName ] || ( this$0._subs[ eventName ] = [] ) ).push( callback );
            } );
            return {
                cancel: function() {
                    self.off( eventName, callback );
                }
            };
        };
    }( Ractive$shared_trim, Ractive$shared_notEmptyString );
 
    /* shared/getSpliceEquivalent.js */
    var getSpliceEquivalent = function( array, methodName, args ) {
        switch ( methodName ) {
            case 'splice':
                return args;
            case 'sort':
            case 'reverse':
                return null;
            case 'pop':
                if ( array.length ) {
                    return [ -1 ];
                }
                return null;
            case 'push':
                return [
                    array.length,
                    0
                ].concat( args );
            case 'shift':
                return [
                    0,
                    1
                ];
            case 'unshift':
                return [
                    0,
                    0
                ].concat( args );
        }
    };
 
    /* shared/summariseSpliceOperation.js */
    var summariseSpliceOperation = function( array, args ) {
        var rangeStart, rangeEnd, newLength, addedItems, removedItems, balance;
        if ( !args ) {
            return null;
        }
        // figure out where the changes started...
        rangeStart = +( args[ 0 ] < 0 ? array.length + args[ 0 ] : args[ 0 ] );
        // ...and how many items were added to or removed from the array
        addedItems = Math.max( 0, args.length - 2 );
        removedItems = args[ 1 ] !== undefined ? args[ 1 ] : array.length - rangeStart;
        // It's possible to do e.g. [ 1, 2, 3 ].splice( 2, 2 ) - i.e. the second argument
        // means removing more items from the end of the array than there are. In these
        // cases we need to curb JavaScript's enthusiasm or we'll get out of sync
        removedItems = Math.min( removedItems, array.length - rangeStart );
        balance = addedItems - removedItems;
        newLength = array.length + balance;
        // We need to find the end of the range affected by the splice
        if ( !balance ) {
            rangeEnd = rangeStart + addedItems;
        } else {
            rangeEnd = Math.max( array.length, newLength );
        }
        return {
            rangeStart: rangeStart,
            rangeEnd: rangeEnd,
            balance: balance,
            added: addedItems,
            removed: removedItems
        };
    };
 
    /* Ractive/prototype/shared/makeArrayMethod.js */
    var Ractive$shared_makeArrayMethod = function( isArray, runloop, getSpliceEquivalent, summariseSpliceOperation ) {
 
        var arrayProto = Array.prototype;
        return function( methodName ) {
            return function( keypath ) {
                var SLICE$0 = Array.prototype.slice;
                var args = SLICE$0.call( arguments, 1 );
                var array, spliceEquivalent, spliceSummary, promise;
                array = this.get( keypath );
                if ( !isArray( array ) ) {
                    throw new Error( 'Called ractive.' + methodName + '(\'' + keypath + '\'), but \'' + keypath + '\' does not refer to an array' );
                }
                spliceEquivalent = getSpliceEquivalent( array, methodName, args );
                spliceSummary = summariseSpliceOperation( array, spliceEquivalent );
                arrayProto[ methodName ].apply( array, args );
                promise = runloop.start( this, true );
                if ( spliceSummary ) {
                    this.viewmodel.splice( keypath, spliceSummary );
                } else {
                    this.viewmodel.mark( keypath );
                }
                runloop.end();
                return promise;
            };
        };
    }( isArray, runloop, getSpliceEquivalent, summariseSpliceOperation );
 
    /* Ractive/prototype/pop.js */
    var Ractive$pop = function( makeArrayMethod ) {
 
        return makeArrayMethod( 'pop' );
    }( Ractive$shared_makeArrayMethod );
 
    /* Ractive/prototype/push.js */
    var Ractive$push = function( makeArrayMethod ) {
 
        return makeArrayMethod( 'push' );
    }( Ractive$shared_makeArrayMethod );
 
    /* global/css.js */
    var global_css = function( circular, isClient, removeFromArray ) {
 
        var css, update, runloop, styleElement, head, styleSheet, inDom, prefix = '/* Ractive.js component styles */\n',
            componentsInPage = {},
            styles = [];
        if ( !isClient ) {
            css = null;
        } else {
            circular.push( function() {
                runloop = circular.runloop;
            } );
            styleElement = document.createElement( 'style' );
            styleElement.type = 'text/css';
            head = document.getElementsByTagName( 'head' )[ 0 ];
            inDom = false;
            // Internet Exploder won't let you use styleSheet.innerHTML - we have to
            // use styleSheet.cssText instead
            styleSheet = styleElement.styleSheet;
            update = function() {
                var css;
                if ( styles.length ) {
                    css = prefix + styles.join( ' ' );
                    if ( styleSheet ) {
                        styleSheet.cssText = css;
                    } else {
                        styleElement.innerHTML = css;
                    }
                    if ( !inDom ) {
                        head.appendChild( styleElement );
                        inDom = true;
                    }
                } else if ( inDom ) {
                    head.removeChild( styleElement );
                    inDom = false;
                }
            };
            css = {
                add: function( Component ) {
                    if ( !Component.css ) {
                        return;
                    }
                    if ( !componentsInPage[ Component._guid ] ) {
                        // we create this counter so that we can in/decrement it as
                        // instances are added and removed. When all components are
                        // removed, the style is too
                        componentsInPage[ Component._guid ] = 0;
                        styles.push( Component.css );
                        runloop.scheduleTask( update );
                    }
                    componentsInPage[ Component._guid ] += 1;
                },
                remove: function( Component ) {
                    if ( !Component.css ) {
                        return;
                    }
                    componentsInPage[ Component._guid ] -= 1;
                    if ( !componentsInPage[ Component._guid ] ) {
                        removeFromArray( styles, Component.css );
                        runloop.scheduleTask( update );
                    }
                }
            };
        }
        return css;
    }( circular, isClient, removeFromArray );
 
    /* Ractive/prototype/render.js */
    var Ractive$render = function( runloop, css, getElement ) {
 
        var queues = {},
            rendering = {};
        return function Ractive$render( target, anchor ) {
            var this$0 = this;
            var promise, instances;
            rendering[ this._guid ] = true;
            promise = runloop.start( this, true );
            if ( this.rendered ) {
                throw new Error( 'You cannot call ractive.render() on an already rendered instance! Call ractive.unrender() first' );
            }
            target = getElement( target ) || this.el;
            anchor = getElement( anchor ) || this.anchor;
            this.el = target;
            this.anchor = anchor;
            // Add CSS, if applicable
            if ( this.constructor.css ) {
                css.add( this.constructor );
            }
            if ( target ) {
                if ( !( instances = target.__ractive_instances__ ) ) {
                    target.__ractive_instances__ = [ this ];
                } else {
                    instances.push( this );
                }
                if ( anchor ) {
                    target.insertBefore( this.fragment.render(), anchor );
                } else {
                    target.appendChild( this.fragment.render() );
                }
            }
            // If this is *isn't* a child of a component that's in the process of rendering,
            // it should call any `init()` methods at this point
            if ( !this._parent || !rendering[ this._parent._guid ] ) {
                init( this );
            } else {
                getChildInitQueue( this._parent ).push( this );
            }
            rendering[ this._guid ] = false;
            runloop.end();
            this.rendered = true;
            if ( this.complete ) {
                promise.then( function() {
                    return this$0.complete();
                } );
            }
            return promise;
        };
 
        function init( instance ) {
            if ( instance.init ) {
                instance.init( instance._config.options );
            }
            getChildInitQueue( instance ).forEach( init );
            queues[ instance._guid ] = null;
        }
 
        function getChildInitQueue( instance ) {
            return queues[ instance._guid ] || ( queues[ instance._guid ] = [] );
        }
    }( runloop, global_css, getElement );
 
    /* virtualdom/Fragment/prototype/bubble.js */
    var virtualdom_Fragment$bubble = function Fragment$bubble() {
        this.dirtyValue = this.dirtyArgs = true;
        if ( this.inited && this.owner.bubble ) {
            this.owner.bubble();
        }
    };
 
    /* virtualdom/Fragment/prototype/detach.js */
    var virtualdom_Fragment$detach = function Fragment$detach() {
        var docFrag;
        if ( this.items.length === 1 ) {
            return this.items[ 0 ].detach();
        }
        docFrag = document.createDocumentFragment();
        this.items.forEach( function( item ) {
            docFrag.appendChild( item.detach() );
        } );
        return docFrag;
    };
 
    /* virtualdom/Fragment/prototype/find.js */
    var virtualdom_Fragment$find = function Fragment$find( selector ) {
        var i, len, item, queryResult;
        if ( this.items ) {
            len = this.items.length;
            for ( i = 0; i < len; i += 1 ) {
                item = this.items[ i ];
                if ( item.find && ( queryResult = item.find( selector ) ) ) {
                    return queryResult;
                }
            }
            return null;
        }
    };
 
    /* virtualdom/Fragment/prototype/findAll.js */
    var virtualdom_Fragment$findAll = function Fragment$findAll( selector, query ) {
        var i, len, item;
        if ( this.items ) {
            len = this.items.length;
            for ( i = 0; i < len; i += 1 ) {
                item = this.items[ i ];
                if ( item.findAll ) {
                    item.findAll( selector, query );
                }
            }
        }
        return query;
    };
 
    /* virtualdom/Fragment/prototype/findAllComponents.js */
    var virtualdom_Fragment$findAllComponents = function Fragment$findAllComponents( selector, query ) {
        var i, len, item;
        if ( this.items ) {
            len = this.items.length;
            for ( i = 0; i < len; i += 1 ) {
                item = this.items[ i ];
                if ( item.findAllComponents ) {
                    item.findAllComponents( selector, query );
                }
            }
        }
        return query;
    };
 
    /* virtualdom/Fragment/prototype/findComponent.js */
    var virtualdom_Fragment$findComponent = function Fragment$findComponent( selector ) {
        var len, i, item, queryResult;
        if ( this.items ) {
            len = this.items.length;
            for ( i = 0; i < len; i += 1 ) {
                item = this.items[ i ];
                if ( item.findComponent && ( queryResult = item.findComponent( selector ) ) ) {
                    return queryResult;
                }
            }
            return null;
        }
    };
 
    /* virtualdom/Fragment/prototype/findNextNode.js */
    var virtualdom_Fragment$findNextNode = function Fragment$findNextNode( item ) {
        var index = item.index,
            node;
        if ( this.items[ index + 1 ] ) {
            node = this.items[ index + 1 ].firstNode();
        } else if ( this.owner === this.root ) {
            if ( !this.owner.component ) {
                // TODO but something else could have been appended to
                // this.root.el, no?
                node = null;
            } else {
                node = this.owner.component.findNextNode();
            }
        } else {
            node = this.owner.findNextNode( this );
        }
        return node;
    };
 
    /* virtualdom/Fragment/prototype/firstNode.js */
    var virtualdom_Fragment$firstNode = function Fragment$firstNode() {
        if ( this.items && this.items[ 0 ] ) {
            return this.items[ 0 ].firstNode();
        }
        return null;
    };
 
    /* virtualdom/Fragment/prototype/getNode.js */
    var virtualdom_Fragment$getNode = function Fragment$getNode() {
        var fragment = this;
        do {
            if ( fragment.pElement ) {
                return fragment.pElement.node;
            }
        } while ( fragment = fragment.parent );
        return this.root.el;
    };
 
    /* config/types.js */
    var types = {
        TEXT: 1,
        INTERPOLATOR: 2,
        TRIPLE: 3,
        SECTION: 4,
        INVERTED: 5,
        CLOSING: 6,
        ELEMENT: 7,
        PARTIAL: 8,
        COMMENT: 9,
        DELIMCHANGE: 10,
        MUSTACHE: 11,
        TAG: 12,
        ATTRIBUTE: 13,
        CLOSING_TAG: 14,
        COMPONENT: 15,
        NUMBER_LITERAL: 20,
        STRING_LITERAL: 21,
        ARRAY_LITERAL: 22,
        OBJECT_LITERAL: 23,
        BOOLEAN_LITERAL: 24,
        GLOBAL: 26,
        KEY_VALUE_PAIR: 27,
        REFERENCE: 30,
        REFINEMENT: 31,
        MEMBER: 32,
        PREFIX_OPERATOR: 33,
        BRACKETED: 34,
        CONDITIONAL: 35,
        INFIX_OPERATOR: 36,
        INVOCATION: 40,
        SECTION_IF: 50,
        SECTION_UNLESS: 51,
        SECTION_EACH: 52,
        SECTION_WITH: 53
    };
 
    /* parse/Parser/expressions/shared/errors.js */
    var parse_Parser_expressions_shared_errors = {
        expectedExpression: 'Expected a JavaScript expression',
        expectedParen: 'Expected closing paren'
    };
 
    /* parse/Parser/expressions/primary/literal/numberLiteral.js */
    var numberLiteral = function( types ) {
 
        // bulletproof number regex from https://gist.github.com/Rich-Harris/7544330
        var numberPattern = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
        return function( parser ) {
            var result;
            if ( result = parser.matchPattern( numberPattern ) ) {
                return {
                    t: types.NUMBER_LITERAL,
                    v: result
                };
            }
            return null;
        };
    }( types );
 
    /* parse/Parser/expressions/primary/literal/booleanLiteral.js */
    var booleanLiteral = function( types ) {
 
        return function( parser ) {
            var remaining = parser.remaining();
            if ( remaining.substr( 0, 4 ) === 'true' ) {
                parser.pos += 4;
                return {
                    t: types.BOOLEAN_LITERAL,
                    v: 'true'
                };
            }
            if ( remaining.substr( 0, 5 ) === 'false' ) {
                parser.pos += 5;
                return {
                    t: types.BOOLEAN_LITERAL,
                    v: 'false'
                };
            }
            return null;
        };
    }( types );
 
    /* parse/Parser/expressions/primary/literal/stringLiteral/makeQuotedStringMatcher.js */
    var makeQuotedStringMatcher = function() {
 
        var stringMiddlePattern, escapeSequencePattern, lineContinuationPattern;
        // Match one or more characters until: ", ', \, or EOL/EOF.
        // EOL/EOF is written as (?!.) (meaning there's no non-newline char next).
        stringMiddlePattern = /^(?=.)[^"'\\]+?(?:(?!.)|(?=["'\\]))/;
        // Match one escape sequence, including the backslash.
        escapeSequencePattern = /^\\(?:['"\\bfnrt]|0(?![0-9])|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|(?=.)[^ux0-9])/;
        // Match one ES5 line continuation (backslash + line terminator).
        lineContinuationPattern = /^\\(?:\r\n|[\u000A\u000D\u2028\u2029])/;
        // Helper for defining getDoubleQuotedString and getSingleQuotedString.
        return function( okQuote ) {
            return function( parser ) {
                var start, literal, done, next;
                start = parser.pos;
                literal = '"';
                done = false;
                while ( !done ) {
                    next = parser.matchPattern( stringMiddlePattern ) || parser.matchPattern( escapeSequencePattern ) || parser.matchString( okQuote );
                    if ( next ) {
                        if ( next === '"' ) {
                            literal += '\\"';
                        } else if ( next === '\\\'' ) {
                            literal += '\'';
                        } else {
                            literal += next;
                        }
                    } else {
                        next = parser.matchPattern( lineContinuationPattern );
                        if ( next ) {
                            // convert \(newline-like) into a \u escape, which is allowed in JSON
                            literal += '\\u' + ( '000' + next.charCodeAt( 1 ).toString( 16 ) ).slice( -4 );
                        } else {
                            done = true;
                        }
                    }
                }
                literal += '"';
                // use JSON.parse to interpret escapes
                return JSON.parse( literal );
            };
        };
    }();
 
    /* parse/Parser/expressions/primary/literal/stringLiteral/singleQuotedString.js */
    var singleQuotedString = function( makeQuotedStringMatcher ) {
 
        return makeQuotedStringMatcher( '"' );
    }( makeQuotedStringMatcher );
 
    /* parse/Parser/expressions/primary/literal/stringLiteral/doubleQuotedString.js */
    var doubleQuotedString = function( makeQuotedStringMatcher ) {
 
        return makeQuotedStringMatcher( '\'' );
    }( makeQuotedStringMatcher );
 
    /* parse/Parser/expressions/primary/literal/stringLiteral/_stringLiteral.js */
    var stringLiteral = function( types, getSingleQuotedString, getDoubleQuotedString ) {
 
        return function( parser ) {
            var start, string;
            start = parser.pos;
            if ( parser.matchString( '"' ) ) {
                string = getDoubleQuotedString( parser );
                if ( !parser.matchString( '"' ) ) {
                    parser.pos = start;
                    return null;
                }
                return {
                    t: types.STRING_LITERAL,
                    v: string
                };
            }
            if ( parser.matchString( '\'' ) ) {
                string = getSingleQuotedString( parser );
                if ( !parser.matchString( '\'' ) ) {
                    parser.pos = start;
                    return null;
                }
                return {
                    t: types.STRING_LITERAL,
                    v: string
                };
            }
            return null;
        };
    }( types, singleQuotedString, doubleQuotedString );
 
    /* parse/Parser/expressions/shared/patterns.js */
    var patterns = {
        name: /^[a-zA-Z_$][a-zA-Z_$0-9]*/
    };
 
    /* parse/Parser/expressions/shared/key.js */
    var key = function( getStringLiteral, getNumberLiteral, patterns ) {
 
        var identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
        // http://mathiasbynens.be/notes/javascript-properties
        // can be any name, string literal, or number literal
        return function( parser ) {
            var token;
            if ( token = getStringLiteral( parser ) ) {
                return identifier.test( token.v ) ? token.v : '"' + token.v.replace( /"/g, '\\"' ) + '"';
            }
            if ( token = getNumberLiteral( parser ) ) {
                return token.v;
            }
            if ( token = parser.matchPattern( patterns.name ) ) {
                return token;
            }
        };
    }( stringLiteral, numberLiteral, patterns );
 
    /* parse/Parser/expressions/primary/literal/objectLiteral/keyValuePair.js */
    var keyValuePair = function( types, getKey ) {
 
        return function( parser ) {
            var start, key, value;
            start = parser.pos;
            // allow whitespace between '{' and key
            parser.allowWhitespace();
            key = getKey( parser );
            if ( key === null ) {
                parser.pos = start;
                return null;
            }
            // allow whitespace between key and ':'
            parser.allowWhitespace();
            // next character must be ':'
            if ( !parser.matchString( ':' ) ) {
                parser.pos = start;
                return null;
            }
            // allow whitespace between ':' and value
            parser.allowWhitespace();
            // next expression must be a, well... expression
            value = parser.readExpression();
            if ( value === null ) {
                parser.pos = start;
                return null;
            }
            return {
                t: types.KEY_VALUE_PAIR,
                k: key,
                v: value
            };
        };
    }( types, key );
 
    /* parse/Parser/expressions/primary/literal/objectLiteral/keyValuePairs.js */
    var keyValuePairs = function( getKeyValuePair ) {
 
        return function getKeyValuePairs( parser ) {
            var start, pairs, pair, keyValuePairs;
            start = parser.pos;
            pair = getKeyValuePair( parser );
            if ( pair === null ) {
                return null;
            }
            pairs = [ pair ];
            if ( parser.matchString( ',' ) ) {
                keyValuePairs = getKeyValuePairs( parser );
                if ( !keyValuePairs ) {
                    parser.pos = start;
                    return null;
                }
                return pairs.concat( keyValuePairs );
            }
            return pairs;
        };
    }( keyValuePair );
 
    /* parse/Parser/expressions/primary/literal/objectLiteral/_objectLiteral.js */
    var objectLiteral = function( types, getKeyValuePairs ) {
 
        return function( parser ) {
            var start, keyValuePairs;
            start = parser.pos;
            // allow whitespace
            parser.allowWhitespace();
            if ( !parser.matchString( '{' ) ) {
                parser.pos = start;
                return null;
            }
            keyValuePairs = getKeyValuePairs( parser );
            // allow whitespace between final value and '}'
            parser.allowWhitespace();
            if ( !parser.matchString( '}' ) ) {
                parser.pos = start;
                return null;
            }
            return {
                t: types.OBJECT_LITERAL,
                m: keyValuePairs
            };
        };
    }( types, keyValuePairs );
 
    /* parse/Parser/expressions/shared/expressionList.js */
    var expressionList = function( errors ) {
 
        return function getExpressionList( parser ) {
            var start, expressions, expr, next;
            start = parser.pos;
            parser.allowWhitespace();
            expr = parser.readExpression();
            if ( expr === null ) {
                return null;
            }
            expressions = [ expr ];
            // allow whitespace between expression and ','
            parser.allowWhitespace();
            if ( parser.matchString( ',' ) ) {
                next = getExpressionList( parser );
                if ( next === null ) {
                    parser.error( errors.expectedExpression );
                }
                next.forEach( append );
            }
 
            function append( expression ) {
                expressions.push( expression );
            }
            return expressions;
        };
    }( parse_Parser_expressions_shared_errors );
 
    /* parse/Parser/expressions/primary/literal/arrayLiteral.js */
    var arrayLiteral = function( types, getExpressionList ) {
 
        return function( parser ) {
            var start, expressionList;
            start = parser.pos;
            // allow whitespace before '['
            parser.allowWhitespace();
            if ( !parser.matchString( '[' ) ) {
                parser.pos = start;
                return null;
            }
            expressionList = getExpressionList( parser );
            if ( !parser.matchString( ']' ) ) {
                parser.pos = start;
                return null;
            }
            return {
                t: types.ARRAY_LITERAL,
                m: expressionList
            };
        };
    }( types, expressionList );
 
    /* parse/Parser/expressions/primary/literal/_literal.js */
    var literal = function( getNumberLiteral, getBooleanLiteral, getStringLiteral, getObjectLiteral, getArrayLiteral ) {
 
        return function( parser ) {
            var literal = getNumberLiteral( parser ) || getBooleanLiteral( parser ) || getStringLiteral( parser ) || getObjectLiteral( parser ) || getArrayLiteral( parser );
            return literal;
        };
    }( numberLiteral, booleanLiteral, stringLiteral, objectLiteral, arrayLiteral );
 
    /* parse/Parser/expressions/primary/reference.js */
    var reference = function( types, patterns ) {
 
        var dotRefinementPattern, arrayMemberPattern, getArrayRefinement, globals, keywords;
        dotRefinementPattern = /^\.[a-zA-Z_$0-9]+/;
        getArrayRefinement = function( parser ) {
            var num = parser.matchPattern( arrayMemberPattern );
            if ( num ) {
                return '.' + num;
            }
            return null;
        };
        arrayMemberPattern = /^\[(0|[1-9][0-9]*)\]/;
        // if a reference is a browser global, we don't deference it later, so it needs special treatment
        globals = /^(?:Array|Date|RegExp|decodeURIComponent|decodeURI|encodeURIComponent|encodeURI|isFinite|isNaN|parseFloat|parseInt|JSON|Math|NaN|undefined|null)$/;
        // keywords are not valid references, with the exception of `this`
        keywords = /^(?:break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with)$/;
        return function( parser ) {
            var startPos, ancestor, name, dot, combo, refinement, lastDotIndex;
            startPos = parser.pos;
            // we might have a root-level reference
            if ( parser.matchString( '~/' ) ) {
                ancestor = '~/';
            } else {
                // we might have ancestor refs...
                ancestor = '';
                while ( parser.matchString( '../' ) ) {
                    ancestor += '../';
                }
            }
            if ( !ancestor ) {
                // we might have an implicit iterator or a restricted reference
                dot = parser.matchString( '.' ) || '';
            }
            name = parser.matchPattern( /^@(?:index|key)/ ) || parser.matchPattern( patterns.name ) || '';
            // bug out if it's a keyword
            if ( keywords.test( name ) ) {
                parser.pos = startPos;
                return null;
            }
            // if this is a browser global, stop here
            if ( !ancestor && !dot && globals.test( name ) ) {
                return {
                    t: types.GLOBAL,
                    v: name
                };
            }
            combo = ( ancestor || dot ) + name;
            if ( !combo ) {
                return null;
            }
            while ( refinement = parser.matchPattern( dotRefinementPattern ) || getArrayRefinement( parser ) ) {
                combo += refinement;
            }
            if ( parser.matchString( '(' ) ) {
                // if this is a method invocation (as opposed to a function) we need
                // to strip the method name from the reference combo, else the context
                // will be wrong
                lastDotIndex = combo.lastIndexOf( '.' );
                if ( lastDotIndex !== -1 ) {
                    combo = combo.substr( 0, lastDotIndex );
                    parser.pos = startPos + combo.length;
                } else {
                    parser.pos -= 1;
                }
            }
            return {
                t: types.REFERENCE,
                n: combo.replace( /^this\./, './' ).replace( /^this$/, '.' )
            };
        };
    }( types, patterns );
 
    /* parse/Parser/expressions/primary/bracketedExpression.js */
    var bracketedExpression = function( types, errors ) {
 
        return function( parser ) {
            var start, expr;
            start = parser.pos;
            if ( !parser.matchString( '(' ) ) {
                return null;
            }
            parser.allowWhitespace();
            expr = parser.readExpression();
            if ( !expr ) {
                parser.error( errors.expectedExpression );
            }
            parser.allowWhitespace();
            if ( !parser.matchString( ')' ) ) {
                parser.error( errors.expectedParen );
            }
            return {
                t: types.BRACKETED,
                x: expr
            };
        };
    }( types, parse_Parser_expressions_shared_errors );
 
    /* parse/Parser/expressions/primary/_primary.js */
    var primary = function( getLiteral, getReference, getBracketedExpression ) {
 
        return function( parser ) {
            return getLiteral( parser ) || getReference( parser ) || getBracketedExpression( parser );
        };
    }( literal, reference, bracketedExpression );
 
    /* parse/Parser/expressions/shared/refinement.js */
    var refinement = function( types, errors, patterns ) {
 
        return function getRefinement( parser ) {
            var start, name, expr;
            start = parser.pos;
            parser.allowWhitespace();
            // "." name
            if ( parser.matchString( '.' ) ) {
                parser.allowWhitespace();
                if ( name = parser.matchPattern( patterns.name ) ) {
                    return {
                        t: types.REFINEMENT,
                        n: name
                    };
                }
                parser.error( 'Expected a property name' );
            }
            // "[" expression "]"
            if ( parser.matchString( '[' ) ) {
                parser.allowWhitespace();
                expr = parser.readExpression();
                if ( !expr ) {
                    parser.error( errors.expectedExpression );
                }
                parser.allowWhitespace();
                if ( !parser.matchString( ']' ) ) {
                    parser.error( 'Expected \']\'' );
                }
                return {
                    t: types.REFINEMENT,
                    x: expr
                };
            }
            return null;
        };
    }( types, parse_Parser_expressions_shared_errors, patterns );
 
    /* parse/Parser/expressions/memberOrInvocation.js */
    var memberOrInvocation = function( types, getPrimary, getExpressionList, getRefinement, errors ) {
 
        return function( parser ) {
            var current, expression, refinement, expressionList;
            expression = getPrimary( parser );
            if ( !expression ) {
                return null;
            }
            while ( expression ) {
                current = parser.pos;
                if ( refinement = getRefinement( parser ) ) {
                    expression = {
                        t: types.MEMBER,
                        x: expression,
                        r: refinement
                    };
                } else if ( parser.matchString( '(' ) ) {
                    parser.allowWhitespace();
                    expressionList = getExpressionList( parser );
                    parser.allowWhitespace();
                    if ( !parser.matchString( ')' ) ) {
                        parser.error( errors.expectedParen );
                    }
                    expression = {
                        t: types.INVOCATION,
                        x: expression
                    };
                    if ( expressionList ) {
                        expression.o = expressionList;
                    }
                } else {
                    break;
                }
            }
            return expression;
        };
    }( types, primary, expressionList, refinement, parse_Parser_expressions_shared_errors );
 
    /* parse/Parser/expressions/typeof.js */
    var _typeof = function( types, errors, getMemberOrInvocation ) {
 
        var getTypeof, makePrefixSequenceMatcher;
        makePrefixSequenceMatcher = function( symbol, fallthrough ) {
            return function( parser ) {
                var expression;
                if ( expression = fallthrough( parser ) ) {
                    return expression;
                }
                if ( !parser.matchString( symbol ) ) {
                    return null;
                }
                parser.allowWhitespace();
                expression = parser.readExpression();
                if ( !expression ) {
                    parser.error( errors.expectedExpression );
                }
                return {
                    s: symbol,
                    o: expression,
                    t: types.PREFIX_OPERATOR
                };
            };
        };
        // create all prefix sequence matchers, return getTypeof
        ( function() {
            var i, len, matcher, prefixOperators, fallthrough;
            prefixOperators = '! ~ + - typeof'.split( ' ' );
            fallthrough = getMemberOrInvocation;
            for ( i = 0, len = prefixOperators.length; i < len; i += 1 ) {
                matcher = makePrefixSequenceMatcher( prefixOperators[ i ], fallthrough );
                fallthrough = matcher;
            }
            // typeof operator is higher precedence than multiplication, so provides the
            // fallthrough for the multiplication sequence matcher we're about to create
            // (we're skipping void and delete)
            getTypeof = fallthrough;
        }() );
        return getTypeof;
    }( types, parse_Parser_expressions_shared_errors, memberOrInvocation );
 
    /* parse/Parser/expressions/logicalOr.js */
    var logicalOr = function( types, getTypeof ) {
 
        var getLogicalOr, makeInfixSequenceMatcher;
        makeInfixSequenceMatcher = function( symbol, fallthrough ) {
            return function( parser ) {
                var start, left, right;
                left = fallthrough( parser );
                if ( !left ) {
                    return null;
                }
                // Loop to handle left-recursion in a case like `a * b * c` and produce
                // left association, i.e. `(a * b) * c`.  The matcher can't call itself
                // to parse `left` because that would be infinite regress.
                while ( true ) {
                    start = parser.pos;
                    parser.allowWhitespace();
                    if ( !parser.matchString( symbol ) ) {
                        parser.pos = start;
                        return left;
                    }
                    // special case - in operator must not be followed by [a-zA-Z_$0-9]
                    if ( symbol === 'in' && /[a-zA-Z_$0-9]/.test( parser.remaining().charAt( 0 ) ) ) {
                        parser.pos = start;
                        return left;
                    }
                    parser.allowWhitespace();
                    // right operand must also consist of only higher-precedence operators
                    right = fallthrough( parser );
                    if ( !right ) {
                        parser.pos = start;
                        return left;
                    }
                    left = {
                        t: types.INFIX_OPERATOR,
                        s: symbol,
                        o: [
                            left,
                            right
                        ]
                    };
                }
            };
        };
        // create all infix sequence matchers, and return getLogicalOr
        ( function() {
            var i, len, matcher, infixOperators, fallthrough;
            // All the infix operators on order of precedence (source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Operator_Precedence)
            // Each sequence matcher will initially fall through to its higher precedence
            // neighbour, and only attempt to match if one of the higher precedence operators
            // (or, ultimately, a literal, reference, or bracketed expression) already matched
            infixOperators = '* / % + - << >> >>> < <= > >= in instanceof == != === !== & ^ | && ||'.split( ' ' );
            // A typeof operator is higher precedence than multiplication
            fallthrough = getTypeof;
            for ( i = 0, len = infixOperators.length; i < len; i += 1 ) {
                matcher = makeInfixSequenceMatcher( infixOperators[ i ], fallthrough );
                fallthrough = matcher;
            }
            // Logical OR is the fallthrough for the conditional matcher
            getLogicalOr = fallthrough;
        }() );
        return getLogicalOr;
    }( types, _typeof );
 
    /* parse/Parser/expressions/conditional.js */
    var conditional = function( types, getLogicalOr, errors ) {
 
        // The conditional operator is the lowest precedence operator, so we start here
        return function( parser ) {
            var start, expression, ifTrue, ifFalse;
            expression = getLogicalOr( parser );
            if ( !expression ) {
                return null;
            }
            start = parser.pos;
            parser.allowWhitespace();
            if ( !parser.matchString( '?' ) ) {
                parser.pos = start;
                return expression;
            }
            parser.allowWhitespace();
            ifTrue = parser.readExpression();
            if ( !ifTrue ) {
                parser.error( errors.expectedExpression );
            }
            parser.allowWhitespace();
            if ( !parser.matchString( ':' ) ) {
                parser.error( 'Expected ":"' );
            }
            parser.allowWhitespace();
            ifFalse = parser.readExpression();
            if ( !ifFalse ) {
                parser.error( errors.expectedExpression );
            }
            return {
                t: types.CONDITIONAL,
                o: [
                    expression,
                    ifTrue,
                    ifFalse
                ]
            };
        };
    }( types, logicalOr, parse_Parser_expressions_shared_errors );
 
    /* parse/Parser/utils/flattenExpression.js */
    var flattenExpression = function( types, isObject ) {
 
        return function( expression ) {
            var refs = [],
                flattened;
            extractRefs( expression, refs );
            flattened = {
                r: refs,
                s: stringify( this, expression, refs )
            };
            return flattened;
        };
 
        function quoteStringLiteral( str ) {
            return JSON.stringify( String( str ) );
        }
        // TODO maybe refactor this?
        function extractRefs( node, refs ) {
            var i, list;
            if ( node.t === types.REFERENCE ) {
                if ( refs.indexOf( node.n ) === -1 ) {
                    refs.unshift( node.n );
                }
            }
            list = node.o || node.m;
            if ( list ) {
                if ( isObject( list ) ) {
                    extractRefs( list, refs );
                } else {
                    i = list.length;
                    while ( i-- ) {
                        extractRefs( list[ i ], refs );
                    }
                }
            }
            if ( node.x ) {
                extractRefs( node.x, refs );
            }
            if ( node.r ) {
                extractRefs( node.r, refs );
            }
            if ( node.v ) {
                extractRefs( node.v, refs );
            }
        }
 
        function stringify( parser, node, refs ) {
            var stringifyAll = function( item ) {
                return stringify( parser, item, refs );
            };
            switch ( node.t ) {
                case types.BOOLEAN_LITERAL:
                case types.GLOBAL:
                case types.NUMBER_LITERAL:
                    return node.v;
                case types.STRING_LITERAL:
                    return quoteStringLiteral( node.v );
                case types.ARRAY_LITERAL:
                    return '[' + ( node.m ? node.m.map( stringifyAll ).join( ',' ) : '' ) + ']';
                case types.OBJECT_LITERAL:
                    return '{' + ( node.m ? node.m.map( stringifyAll ).join( ',' ) : '' ) + '}';
                case types.KEY_VALUE_PAIR:
                    return node.k + ':' + stringify( parser, node.v, refs );
                case types.PREFIX_OPERATOR:
                    return ( node.s === 'typeof' ? 'typeof ' : node.s ) + stringify( parser, node.o, refs );
                case types.INFIX_OPERATOR:
                    return stringify( parser, node.o[ 0 ], refs ) + ( node.s.substr( 0, 2 ) === 'in' ? ' ' + node.s + ' ' : node.s ) + stringify( parser, node.o[ 1 ], refs );
                case types.INVOCATION:
                    return stringify( parser, node.x, refs ) + '(' + ( node.o ? node.o.map( stringifyAll ).join( ',' ) : '' ) + ')';
                case types.BRACKETED:
                    return '(' + stringify( parser, node.x, refs ) + ')';
                case types.MEMBER:
                    return stringify( parser, node.x, refs ) + stringify( parser, node.r, refs );
                case types.REFINEMENT:
                    return node.n ? '.' + node.n : '[' + stringify( parser, node.x, refs ) + ']';
                case types.CONDITIONAL:
                    return stringify( parser, node.o[ 0 ], refs ) + '?' + stringify( parser, node.o[ 1 ], refs ) + ':' + stringify( parser, node.o[ 2 ], refs );
                case types.REFERENCE:
                    return '${' + refs.indexOf( node.n ) + '}';
                default:
                    parser.error( 'Expected legal JavaScript' );
            }
        }
    }( types, isObject );
 
    /* parse/Parser/_Parser.js */
    var Parser = function( circular, create, hasOwnProperty, getConditional, flattenExpression ) {
 
        var Parser, ParseError, leadingWhitespace = /^\s+/;
        ParseError = function( message ) {
            this.name = 'ParseError';
            this.message = message;
            try {
                throw new Error( message );
            } catch ( e ) {
                this.stack = e.stack;
            }
        };
        ParseError.prototype = Error.prototype;
        Parser = function( str, options ) {
            var items, item;
            this.str = str;
            this.options = options || {};
            this.pos = 0;
            // Custom init logic
            if ( this.init )
                this.init( str, options );
            items = [];
            while ( this.pos < this.str.length && ( item = this.read() ) ) {
                items.push( item );
            }
            this.leftover = this.remaining();
            this.result = this.postProcess ? this.postProcess( items, options ) : items;
        };
        Parser.prototype = {
            read: function( converters ) {
                var pos, i, len, item;
                if ( !converters )
                    converters = this.converters;
                pos = this.pos;
                len = converters.length;
                for ( i = 0; i < len; i += 1 ) {
                    this.pos = pos;
                    // reset for each attempt
                    if ( item = converters[ i ]( this ) ) {
                        return item;
                    }
                }
                return null;
            },
            readExpression: function() {
                // The conditional operator is the lowest precedence operator (except yield,
                // assignment operators, and commas, none of which are supported), so we
                // start there. If it doesn't match, it 'falls through' to progressively
                // higher precedence operators, until it eventually matches (or fails to
                // match) a 'primary' - a literal or a reference. This way, the abstract syntax
                // tree has everything in its proper place, i.e. 2 + 3 * 4 === 14, not 20.
                return getConditional( this );
            },
            flattenExpression: flattenExpression,
            getLinePos: function() {
                var lines, currentLine, currentLineEnd, nextLineEnd, lineNum, columnNum;
                lines = this.str.split( '\n' );
                lineNum = -1;
                nextLineEnd = 0;
                do {
                    currentLineEnd = nextLineEnd;
                    lineNum++;
                    currentLine = lines[ lineNum ];
                    nextLineEnd += currentLine.length + 1;
                } while ( nextLineEnd <= this.pos );
                columnNum = this.pos - currentLineEnd;
                return {
                    line: lineNum + 1,
                    ch: columnNum + 1,
                    text: currentLine,
                    toJSON: function() {
                        return [
                            this.line,
                            this.ch
                        ];
                    },
                    toString: function() {
                        return 'line ' + this.line + ' character ' + this.ch + ':\n' + this.text + '\n' + this.text.substr( 0, this.ch - 1 ).replace( /[\S]/g, ' ' ) + '^----';
                    }
                };
            },
            error: function( err ) {
                var pos, message;
                pos = this.getLinePos();
                message = err + ' at ' + pos;
                throw new ParseError( message );
            },
            matchString: function( string ) {
                if ( this.str.substr( this.pos, string.length ) === string ) {
                    this.pos += string.length;
                    return string;
                }
            },
            matchPattern: function( pattern ) {
                var match;
                if ( match = pattern.exec( this.remaining() ) ) {
                    this.pos += match[ 0 ].length;
                    return match[ 1 ] || match[ 0 ];
                }
            },
            allowWhitespace: function() {
                this.matchPattern( leadingWhitespace );
            },
            remaining: function() {
                return this.str.substring( this.pos );
            },
            nextChar: function() {
                return this.str.charAt( this.pos );
            }
        };
        Parser.extend = function( proto ) {
            var Parent = this,
                Child, key;
            Child = function( str, options ) {
                Parser.call( this, str, options );
            };
            Child.prototype = create( Parent.prototype );
            for ( key in proto ) {
                if ( hasOwnProperty.call( proto, key ) ) {
                    Child.prototype[ key ] = proto[ key ];
                }
            }
            Child.extend = Parser.extend;
            return Child;
        };
        circular.Parser = Parser;
        return Parser;
    }( circular, create, hasOwn, conditional, flattenExpression );
 
    /* utils/parseJSON.js */
    var parseJSON = function( Parser, getStringLiteral, getKey ) {
 
        // simple JSON parser, without the restrictions of JSON parse
        // (i.e. having to double-quote keys).
        //
        // If passed a hash of values as the second argument, ${placeholders}
        // will be replaced with those values
        var JsonParser, specials, specialsPattern, numberPattern, placeholderPattern, placeholderAtStartPattern, onlyWhitespace;
        specials = {
            'true': true,
            'false': false,
            'undefined': undefined,
            'null': null
        };
        specialsPattern = new RegExp( '^(?:' + Object.keys( specials ).join( '|' ) + ')' );
        numberPattern = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
        placeholderPattern = /\$\{([^\}]+)\}/g;
        placeholderAtStartPattern = /^\$\{([^\}]+)\}/;
        onlyWhitespace = /^\s*$/;
        JsonParser = Parser.extend( {
            init: function( str, options ) {
                this.values = options.values;
            },
            postProcess: function( result ) {
                if ( result.length !== 1 || !onlyWhitespace.test( this.leftover ) ) {
                    return null;
                }
                return {
                    value: result[ 0 ].v
                };
            },
            converters: [
 
                function getPlaceholder( parser ) {
                    var placeholder;
                    if ( !parser.values ) {
                        return null;
                    }
                    placeholder = parser.matchPattern( placeholderAtStartPattern );
                    if ( placeholder && parser.values.hasOwnProperty( placeholder ) ) {
                        return {
                            v: parser.values[ placeholder ]
                        };
                    }
                },
                function getSpecial( parser ) {
                    var special;
                    if ( special = parser.matchPattern( specialsPattern ) ) {
                        return {
                            v: specials[ special ]
                        };
                    }
                },
                function getNumber( parser ) {
                    var number;
                    if ( number = parser.matchPattern( numberPattern ) ) {
                        return {
                            v: +number
                        };
                    }
                },
                function getString( parser ) {
                    var stringLiteral = getStringLiteral( parser ),
                        values;
                    if ( stringLiteral && ( values = parser.values ) ) {
                        return {
                            v: stringLiteral.v.replace( placeholderPattern, function( match, $1 ) {
                                return $1 in values ? values[ $1 ] : $1;
                            } )
                        };
                    }
                    return stringLiteral;
                },
                function getObject( parser ) {
                    var result, pair;
                    if ( !parser.matchString( '{' ) ) {
                        return null;
                    }
                    result = {};
                    parser.allowWhitespace();
                    if ( parser.matchString( '}' ) ) {
                        return {
                            v: result
                        };
                    }
                    while ( pair = getKeyValuePair( parser ) ) {
                        result[ pair.key ] = pair.value;
                        parser.allowWhitespace();
                        if ( parser.matchString( '}' ) ) {
                            return {
                                v: result
                            };
                        }
                        if ( !parser.matchString( ',' ) ) {
                            return null;
                        }
                    }
                    return null;
                },
                function getArray( parser ) {
                    var result, valueToken;
                    if ( !parser.matchString( '[' ) ) {
                        return null;
                    }
                    result = [];
                    parser.allowWhitespace();
                    if ( parser.matchString( ']' ) ) {
                        return {
                            v: result
                        };
                    }
                    while ( valueToken = parser.read() ) {
                        result.push( valueToken.v );
                        parser.allowWhitespace();
                        if ( parser.matchString( ']' ) ) {
                            return {
                                v: result
                            };
                        }
                        if ( !parser.matchString( ',' ) ) {
                            return null;
                        }
                        parser.allowWhitespace();
                    }
                    return null;
                }
            ]
        } );
 
        function getKeyValuePair( parser ) {
            var key, valueToken, pair;
            parser.allowWhitespace();
            key = getKey( parser );
            if ( !key ) {
                return null;
            }
            pair = {
                key: key
            };
            parser.allowWhitespace();
            if ( !parser.matchString( ':' ) ) {
                return null;
            }
            parser.allowWhitespace();
            valueToken = parser.read();
            if ( !valueToken ) {
                return null;
            }
            pair.value = valueToken.v;
            return pair;
        }
        return function( str, values ) {
            var parser = new JsonParser( str, {
                values: values
            } );
            return parser.result;
        };
    }( Parser, stringLiteral, key );
 
    /* virtualdom/Fragment/prototype/getValue.js */
    var virtualdom_Fragment$getValue = function( types, parseJSON ) {
 
        var empty = {};
        return function Fragment$getValue( options ) {
            var asArgs, parse, value, values, jsonesque, parsed, cache, dirtyFlag, result;
            options = options || empty;
            asArgs = options.args;
            parse = asArgs || options.parse;
            cache = asArgs ? 'argsList' : 'value';
            dirtyFlag = asArgs ? 'dirtyArgs' : 'dirtyValue';
            if ( this[ dirtyFlag ] || !this.hasOwnProperty( cache ) ) {
                // Fast path
                if ( this.items.length === 1 && this.items[ 0 ].type === types.INTERPOLATOR ) {
                    value = this.items[ 0 ].value;
                    if ( value !== undefined ) {
                        result = asArgs ? [ value ] : value;
                    }
                } else {
                    if ( parse ) {
                        values = {};
                        jsonesque = processItems( this.items, values, this.root._guid );
                        parsed = parseJSON( asArgs ? '[' + jsonesque + ']' : jsonesque, values );
                    }
                    if ( !parsed ) {
                        result = asArgs ? [ this.toString() ] : this.toString();
                    } else {
                        result = parsed.value;
                    }
                }
                this[ cache ] = result;
                this[ dirtyFlag ] = false;
            }
            return this[ cache ];
        };
 
        function processItems( items, values, guid, counter ) {
            counter = counter || 0;
            return items.map( function( item ) {
                var placeholderId, wrapped, value;
                if ( item.text ) {
                    return item.text;
                }
                if ( item.fragments ) {
                    return item.fragments.map( function( fragment ) {
                        return processItems( fragment.items, values, guid, counter );
                    } ).join( '' );
                }
                placeholderId = guid + '-' + counter++;
                if ( wrapped = item.root.viewmodel.wrapped[ item.keypath ] ) {
                    value = wrapped.value;
                } else {
                    value = item.value;
                }
                values[ placeholderId ] = value;
                return '${' + placeholderId + '}';
            } ).join( '' );
        }
    }( types, parseJSON );
 
    /* utils/escapeHtml.js */
    var escapeHtml = function() {
 
        var lessThan = /</g,
            greaterThan = />/g;
        return function escapeHtml( str ) {
            return str.replace( lessThan, '&lt;' ).replace( greaterThan, '&gt;' );
        };
    }();
 
    /* utils/detachNode.js */
    var detachNode = function detachNode( node ) {
        if ( node && node.parentNode ) {
            node.parentNode.removeChild( node );
        }
        return node;
    };
 
    /* virtualdom/items/shared/detach.js */
    var detach = function( detachNode ) {
 
        return function() {
            return detachNode( this.node );
        };
    }( detachNode );
 
    /* virtualdom/items/Text.js */
    var Text = function( types, escapeHtml, detach ) {
 
        var Text = function( options ) {
            this.type = types.TEXT;
            this.text = options.template;
        };
        Text.prototype = {
            detach: detach,
            firstNode: function() {
                return this.node;
            },
            render: function() {
                if ( !this.node ) {
                    this.node = document.createTextNode( this.text );
                }
                return this.node;
            },
            toString: function( escape ) {
                return escape ? escapeHtml( this.text ) : this.text;
            },
            unrender: function( shouldDestroy ) {
                if ( shouldDestroy ) {
                    return this.detach();
                }
            }
        };
        return Text;
    }( types, escapeHtml, detach );
 
    /* virtualdom/items/shared/unbind.js */
    var unbind = function( runloop ) {
 
        return function unbind() {
            if ( !this.keypath ) {
                // this was on the 'unresolved' list, we need to remove it
                runloop.removeUnresolved( this );
            } else {
                // this was registered as a dependant
                this.root.viewmodel.unregister( this.keypath, this );
            }
            if ( this.resolver ) {
                this.resolver.teardown();
            }
        };
    }( runloop );
 
    /* shared/Unresolved.js */
    var Unresolved = function( runloop ) {
 
        var Unresolved = function( ractive, ref, parentFragment, callback ) {
            this.root = ractive;
            this.ref = ref;
            this.parentFragment = parentFragment;
            this.resolve = callback;
            runloop.addUnresolved( this );
        };
        Unresolved.prototype = {
            teardown: function() {
                runloop.removeUnresolved( this );
            }
        };
        return Unresolved;
    }( runloop );
 
    /* virtualdom/items/shared/utils/startsWithKeypath.js */
    var startsWithKeypath = function startsWithKeypath( target, keypath ) {
        return target.substr( 0, keypath.length + 1 ) === keypath + '.';
    };
 
    /* virtualdom/items/shared/utils/getNewKeypath.js */
    var getNewKeypath = function( startsWithKeypath ) {
 
        return function getNewKeypath( targetKeypath, oldKeypath, newKeypath ) {
            // exact match
            if ( targetKeypath === oldKeypath ) {
                return newKeypath;
            }
            // partial match based on leading keypath segments
            if ( startsWithKeypath( targetKeypath, oldKeypath ) ) {
                return targetKeypath.replace( oldKeypath + '.', newKeypath + '.' );
            }
        };
    }( startsWithKeypath );
 
    /* utils/log.js */
    var log = function( consolewarn, errors ) {
 
        var log = {
            warn: function( options, passthru ) {
                if ( !options.debug && !passthru ) {
                    return;
                }
                this.logger( getMessage( options ), options.allowDuplicates );
            },
            error: function( options ) {
                this.errorOnly( options );
                if ( !options.debug ) {
                    this.warn( options, true );
                }
            },
            errorOnly: function( options ) {
                if ( options.debug ) {
                    this.critical( options );
                }
            },
            critical: function( options ) {
                var err = options.err || new Error( getMessage( options ) );
                this.thrower( err );
            },
            logger: consolewarn,
            thrower: function( err ) {
                throw err;
            }
        };
 
        function getMessage( options ) {
            var message = errors[ options.message ] || options.message || '';
            return interpolate( message, options.args );
        }
        // simple interpolation. probably quicker (and better) out there,
        // but log is not in golden path of execution, only exceptions
        function interpolate( message, args ) {
            return message.replace( /{([^{}]*)}/g, function( a, b ) {
                return args[ b ];
            } );
        }
        return log;
    }( warn, errors );
 
    /* viewmodel/Computation/diff.js */
    var diff = function diff( computation, dependencies, newDependencies ) {
        var i, keypath;
        // remove dependencies that are no longer used
        i = dependencies.length;
        while ( i-- ) {
            keypath = dependencies[ i ];
            if ( newDependencies.indexOf( keypath ) === -1 ) {
                computation.viewmodel.unregister( keypath, computation, 'computed' );
            }
        }
        // create references for any new dependencies
        i = newDependencies.length;
        while ( i-- ) {
            keypath = newDependencies[ i ];
            if ( dependencies.indexOf( keypath ) === -1 ) {
                computation.viewmodel.register( keypath, computation, 'computed' );
            }
        }
        computation.dependencies = newDependencies.slice();
    };
 
    /* virtualdom/items/shared/Evaluator/Evaluator.js */
    var Evaluator = function( log, isEqual, defineProperty, diff ) {
 
        // TODO this is a red flag... should be treated the same?
        var Evaluator, cache = {};
        Evaluator = function( root, keypath, uniqueString, functionStr, args, priority ) {
            var evaluator = this,
                viewmodel = root.viewmodel;
            evaluator.root = root;
            evaluator.viewmodel = viewmodel;
            evaluator.uniqueString = uniqueString;
            evaluator.keypath = keypath;
            evaluator.priority = priority;
            evaluator.fn = getFunctionFromString( functionStr, args.length );
            evaluator.explicitDependencies = [];
            evaluator.dependencies = [];
            // created by `this.get()` within functions
            evaluator.argumentGetters = args.map( function( arg ) {
                var keypath, index;
                if ( !arg ) {
                    return void 0;
                }
                if ( arg.indexRef ) {
                    index = arg.value;
                    return index;
                }
                keypath = arg.keypath;
                evaluator.explicitDependencies.push( keypath );
                viewmodel.register( keypath, evaluator, 'computed' );
                return function() {
                    var value = viewmodel.get( keypath );
                    return typeof value === 'function' ? wrap( value, root ) : value;
                };
            } );
        };
        Evaluator.prototype = {
            wake: function() {
                this.awake = true;
            },
            sleep: function() {
                this.awake = false;
            },
            getValue: function() {
                var args, value, newImplicitDependencies;
                args = this.argumentGetters.map( call );
                if ( this.updating ) {
                    // Prevent infinite loops caused by e.g. in-place array mutations
                    return;
                }
                this.updating = true;
                this.viewmodel.capture();
                try {
                    value = this.fn.apply( null, args );
                } catch ( err ) {
                    if ( this.root.debug ) {
                        log.warn( {
                            debug: this.root.debug,
                            message: 'evaluationError',
                            args: {
                                uniqueString: this.uniqueString,
                                err: err.message || err
                            }
                        } );
                    }
                    value = undefined;
                }
                newImplicitDependencies = this.viewmodel.release();
                diff( this, this.dependencies, newImplicitDependencies );
                this.updating = false;
                return value;
            },
            update: function() {
                var value = this.getValue();
                if ( !isEqual( value, this.value ) ) {
                    this.value = value;
                    this.root.viewmodel.mark( this.keypath );
                }
                return this;
            },
            // TODO should evaluators ever get torn down? At present, they don't...
            teardown: function() {
                var this$0 = this;
                this.explicitDependencies.concat( this.dependencies ).forEach( function( keypath ) {
                    return this$0.viewmodel.unregister( keypath, this$0, 'computed' );
                } );
                this.root.viewmodel.evaluators[ this.keypath ] = null;
            }
        };
        return Evaluator;
 
        function getFunctionFromString( str, i ) {
            var fn, args;
            str = str.replace( /\$\{([0-9]+)\}/g, '_$1' );
            if ( cache[ str ] ) {
                return cache[ str ];
            }
            args = [];
            while ( i-- ) {
                args[ i ] = '_' + i;
            }
            fn = new Function( args.join( ',' ), 'return(' + str + ')' );
            cache[ str ] = fn;
            return fn;
        }
 
        function wrap( fn, ractive ) {
            var wrapped, prop;
            if ( fn._noWrap ) {
                return fn;
            }
            prop = '__ractive_' + ractive._guid;
            wrapped = fn[ prop ];
            if ( wrapped ) {
                return wrapped;
            } else if ( /this/.test( fn.toString() ) ) {
                defineProperty( fn, prop, {
                    value: fn.bind( ractive )
                } );
                return fn[ prop ];
            }
            defineProperty( fn, '__ractive_nowrap', {
                value: fn
            } );
            return fn.__ractive_nowrap;
        }
 
        function call( arg ) {
            return typeof arg === 'function' ? arg() : arg;
        }
    }( log, isEqual, defineProperty, diff );
 
    /* virtualdom/items/shared/Resolvers/ExpressionResolver.js */
    var ExpressionResolver = function( removeFromArray, resolveRef, Unresolved, Evaluator, getNewKeypath ) {
 
        var ExpressionResolver = function( owner, parentFragment, expression, callback ) {
            var expressionResolver = this,
                ractive, indexRefs, args;
            ractive = owner.root;
            this.root = ractive;
            this.callback = callback;
            this.owner = owner;
            this.str = expression.s;
            this.args = args = [];
            this.unresolved = [];
            this.pending = 0;
            indexRefs = parentFragment.indexRefs;
            // some expressions don't have references. edge case, but, yeah.
            if ( !expression.r || !expression.r.length ) {
                this.resolved = this.ready = true;
                this.bubble();
                return;
            }
            // Create resolvers for each reference
            expression.r.forEach( function( reference, i ) {
                var index, keypath, unresolved;
                // Is this an index reference?
                if ( indexRefs && ( index = indexRefs[ reference ] ) !== undefined ) {
                    args[ i ] = {
                        indexRef: reference,
                        value: index
                    };
                    return;
                }
                // Can we resolve it immediately?
                if ( keypath = resolveRef( ractive, reference, parentFragment ) ) {
                    args[ i ] = {
                        keypath: keypath
                    };
                    return;
                }
                // Couldn't resolve yet
                args[ i ] = null;
                expressionResolver.pending += 1;
                unresolved = new Unresolved( ractive, reference, parentFragment, function( keypath ) {
                    expressionResolver.resolve( i, keypath );
                    removeFromArray( expressionResolver.unresolved, unresolved );
                } );
                expressionResolver.unresolved.push( unresolved );
            } );
            this.ready = true;
            this.bubble();
        };
        ExpressionResolver.prototype = {
            bubble: function() {
                if ( !this.ready ) {
                    return;
                }
                this.uniqueString = getUniqueString( this.str, this.args );
                this.keypath = getKeypath( this.uniqueString );
                this.createEvaluator();
                this.callback( this.keypath );
            },
            teardown: function() {
                var unresolved;
                while ( unresolved = this.unresolved.pop() ) {
                    unresolved.teardown();
                }
            },
            resolve: function( index, keypath ) {
                this.args[ index ] = {
                    keypath: keypath
                };
                this.bubble();
                // when all references have been resolved, we can flag the entire expression
                // as having been resolved
                this.resolved = !--this.pending;
            },
            createEvaluator: function() {
                var evaluator = this.root.viewmodel.evaluators[ this.keypath ];
                // only if it doesn't exist yet!
                if ( !evaluator ) {
                    evaluator = new Evaluator( this.root, this.keypath, this.uniqueString, this.str, this.args, this.owner.priority );
                    this.root.viewmodel.evaluators[ this.keypath ] = evaluator;
                }
                evaluator.update();
            },
            rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                var changed;
                this.args.forEach( function( arg ) {
                    var changedKeypath;
                    if ( !arg )
                        return;
                    if ( arg.keypath && ( changedKeypath = getNewKeypath( arg.keypath, oldKeypath, newKeypath ) ) ) {
                        arg.keypath = changedKeypath;
                        changed = true;
                    } else if ( arg.indexRef && arg.indexRef === indexRef ) {
                        arg.value = newIndex;
                        changed = true;
                    }
                } );
                if ( changed ) {
                    this.bubble();
                }
            }
        };
        return ExpressionResolver;
 
        function getUniqueString( str, args ) {
            // get string that is unique to this expression
            return str.replace( /\$\{([0-9]+)\}/g, function( match, $1 ) {
                var arg = args[ $1 ];
                if ( !arg )
                    return 'undefined';
                if ( arg.indexRef )
                    return arg.value;
                return arg.keypath;
            } );
        }
 
        function getKeypath( uniqueString ) {
            // Sanitize by removing any periods or square brackets. Otherwise
            // we can't split the keypath into keys!
            return '${' + uniqueString.replace( /[\.\[\]]/g, '-' ) + '}';
        }
    }( removeFromArray, resolveRef, Unresolved, Evaluator, getNewKeypath );
 
    /* virtualdom/items/shared/Resolvers/ReferenceExpressionResolver/MemberResolver.js */
    var MemberResolver = function( types, resolveRef, Unresolved, getNewKeypath, ExpressionResolver ) {
 
        var MemberResolver = function( template, resolver, parentFragment ) {
            var member = this,
                ref, indexRefs, index, ractive, keypath;
            member.resolver = resolver;
            member.root = resolver.root;
            member.viewmodel = resolver.root.viewmodel;
            if ( typeof template === 'string' ) {
                member.value = template;
            } else if ( template.t === types.REFERENCE ) {
                ref = member.ref = template.n;
                // If it's an index reference, our job is simple
                if ( ( indexRefs = parentFragment.indexRefs ) && ( index = indexRefs[ ref ] ) !== undefined ) {
                    member.indexRef = ref;
                    member.value = index;
                } else {
                    ractive = resolver.root;
                    // Can we resolve the reference immediately?
                    if ( keypath = resolveRef( ractive, ref, parentFragment ) ) {
                        member.resolve( keypath );
                    } else {
                        // Couldn't resolve yet
                        member.unresolved = new Unresolved( ractive, ref, parentFragment, function( keypath ) {
                            member.unresolved = null;
                            member.resolve( keypath );
                        } );
                    }
                }
            } else {
                new ExpressionResolver( resolver, parentFragment, template, function( keypath ) {
                    member.resolve( keypath );
                } );
            }
        };
        MemberResolver.prototype = {
            resolve: function( keypath ) {
                this.keypath = keypath;
                this.value = this.viewmodel.get( keypath );
                this.bind();
                this.resolver.bubble();
            },
            bind: function() {
                this.viewmodel.register( this.keypath, this );
            },
            rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                var keypath;
                if ( indexRef && this.indexRef === indexRef ) {
                    if ( newIndex !== this.value ) {
                        this.value = newIndex;
                        return true;
                    }
                } else if ( this.keypath && ( keypath = getNewKeypath( this.keypath, oldKeypath, newKeypath ) ) ) {
                    this.unbind();
                    this.keypath = keypath;
                    this.value = this.root.viewmodel.get( keypath );
                    this.bind();
                    return true;
                }
            },
            setValue: function( value ) {
                this.value = value;
                this.resolver.bubble();
            },
            unbind: function() {
                if ( this.keypath ) {
                    this.root.viewmodel.unregister( this.keypath, this );
                }
            },
            teardown: function() {
                this.unbind();
                if ( this.unresolved ) {
                    this.unresolved.teardown();
                }
            },
            forceResolution: function() {
                if ( this.unresolved ) {
                    this.unresolved.teardown();
                    this.unresolved = null;
                    this.keypath = this.ref;
                    this.value = this.viewmodel.get( this.ref );
                    this.bind();
                }
            }
        };
        return MemberResolver;
    }( types, resolveRef, Unresolved, getNewKeypath, ExpressionResolver );
 
    /* virtualdom/items/shared/Resolvers/ReferenceExpressionResolver/ReferenceExpressionResolver.js */
    var ReferenceExpressionResolver = function( resolveRef, Unresolved, MemberResolver ) {
 
        var ReferenceExpressionResolver = function( mustache, template, callback ) {
            var this$0 = this;
            var resolver = this,
                ractive, ref, keypath, parentFragment;
            parentFragment = mustache.parentFragment;
            resolver.root = ractive = mustache.root;
            resolver.mustache = mustache;
            resolver.priority = mustache.priority;
            resolver.ref = ref = template.r;
            resolver.callback = callback;
            resolver.unresolved = [];
            // Find base keypath
            if ( keypath = resolveRef( ractive, ref, parentFragment ) ) {
                resolver.base = keypath;
            } else {
                resolver.baseResolver = new Unresolved( ractive, ref, parentFragment, function( keypath ) {
                    resolver.base = keypath;
                    resolver.baseResolver = null;
                    resolver.bubble();
                } );
            }
            // Find values for members, or mark them as unresolved
            resolver.members = template.m.map( function( template ) {
                return new MemberResolver( template, this$0, parentFragment );
            } );
            resolver.ready = true;
            resolver.bubble();
        };
        ReferenceExpressionResolver.prototype = {
            getKeypath: function() {
                var values = this.members.map( getValue );
                if ( !values.every( isDefined ) || this.baseResolver ) {
                    return;
                }
                return this.base + '.' + values.join( '.' );
            },
            bubble: function() {
                if ( !this.ready || this.baseResolver ) {
                    return;
                }
                this.callback( this.getKeypath() );
            },
            teardown: function() {
                this.members.forEach( unbind );
            },
            rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                var changed;
                this.members.forEach( function( members ) {
                    if ( members.rebind( indexRef, newIndex, oldKeypath, newKeypath ) ) {
                        changed = true;
                    }
                } );
                if ( changed ) {
                    this.bubble();
                }
            },
            forceResolution: function() {
                if ( this.baseResolver ) {
                    this.base = this.ref;
                    this.baseResolver.teardown();
                    this.baseResolver = null;
                }
                this.members.forEach( function( m ) {
                    return m.forceResolution();
                } );
                this.bubble();
            }
        };
 
        function getValue( member ) {
            return member.value;
        }
 
        function isDefined( value ) {
            return value != undefined;
        }
 
        function unbind( member ) {
            member.unbind();
        }
        return ReferenceExpressionResolver;
    }( resolveRef, Unresolved, MemberResolver );
 
    /* virtualdom/items/shared/Mustache/initialise.js */
    var initialise = function( types, runloop, resolveRef, ReferenceExpressionResolver, ExpressionResolver ) {
 
        return function Mustache$init( mustache, options ) {
            var ref, keypath, indexRefs, index, parentFragment, template;
            parentFragment = options.parentFragment;
            template = options.template;
            mustache.root = parentFragment.root;
            mustache.parentFragment = parentFragment;
            mustache.pElement = parentFragment.pElement;
            mustache.template = options.template;
            mustache.index = options.index || 0;
            mustache.priority = parentFragment.priority;
            mustache.isStatic = options.template.s;
            mustache.type = options.template.t;
            // if this is a simple mustache, with a reference, we just need to resolve
            // the reference to a keypath
            if ( ref = template.r ) {
                indexRefs = parentFragment.indexRefs;
                if ( indexRefs && ( index = indexRefs[ ref ] ) !== undefined ) {
                    mustache.indexRef = ref;
                    mustache.setValue( index );
                    return;
                }
                keypath = resolveRef( mustache.root, ref, mustache.parentFragment );
                if ( keypath !== undefined ) {
                    mustache.resolve( keypath );
                } else {
                    mustache.ref = ref;
                    runloop.addUnresolved( mustache );
                }
            }
            // if it's an expression, we have a bit more work to do
            if ( options.template.x ) {
                mustache.resolver = new ExpressionResolver( mustache, parentFragment, options.template.x, resolveAndRebindChildren );
            }
            if ( options.template.rx ) {
                mustache.resolver = new ReferenceExpressionResolver( mustache, options.template.rx, resolveAndRebindChildren );
            }
            // Special case - inverted sections
            if ( mustache.template.n === types.SECTION_UNLESS && !mustache.hasOwnProperty( 'value' ) ) {
                mustache.setValue( undefined );
            }
 
            function resolveAndRebindChildren( newKeypath ) {
                var oldKeypath = mustache.keypath;
                if ( newKeypath !== oldKeypath ) {
                    mustache.resolve( newKeypath );
                    if ( oldKeypath !== undefined ) {
                        mustache.fragments && mustache.fragments.forEach( function( f ) {
                            f.rebind( null, null, oldKeypath, newKeypath );
                        } );
                    }
                }
            }
        };
    }( types, runloop, resolveRef, ReferenceExpressionResolver, ExpressionResolver );
 
    /* virtualdom/items/shared/Mustache/resolve.js */
    var resolve = function Mustache$resolve( keypath ) {
        var wasResolved, value, twowayBinding;
        // If we resolved previously, we need to unregister
        if ( this.keypath !== undefined ) {
            this.root.viewmodel.unregister( this.keypath, this );
            wasResolved = true;
        }
        this.keypath = keypath;
        // If the new keypath exists, we need to register
        // with the viewmodel
        if ( keypath !== undefined ) {
            value = this.root.viewmodel.get( keypath );
            this.root.viewmodel.register( keypath, this );
        }
        // Either way we need to queue up a render (`value`
        // will be `undefined` if there's no keypath)
        this.setValue( value );
        // Two-way bindings need to point to their new target keypath
        if ( wasResolved && ( twowayBinding = this.twowayBinding ) ) {
            twowayBinding.rebound();
        }
    };
 
    /* virtualdom/items/shared/Mustache/rebind.js */
    var rebind = function( getNewKeypath ) {
 
        return function Mustache$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
            var keypath;
            // Children first
            if ( this.fragments ) {
                this.fragments.forEach( function( f ) {
                    return f.rebind( indexRef, newIndex, oldKeypath, newKeypath );
                } );
            }
            // Expression mustache?
            if ( this.resolver ) {
                this.resolver.rebind( indexRef, newIndex, oldKeypath, newKeypath );
            }
            // Normal keypath mustache or reference expression?
            if ( this.keypath ) {
                // was a new keypath created?
                if ( keypath = getNewKeypath( this.keypath, oldKeypath, newKeypath ) ) {
                    // resolve it
                    this.resolve( keypath );
                }
            } else if ( indexRef !== undefined && this.indexRef === indexRef ) {
                this.setValue( newIndex );
            }
        };
    }( getNewKeypath );
 
    /* virtualdom/items/shared/Mustache/_Mustache.js */
    var Mustache = function( init, resolve, rebind ) {
 
        return {
            init: init,
            resolve: resolve,
            rebind: rebind
        };
    }( initialise, resolve, rebind );
 
    /* virtualdom/items/Interpolator.js */
    var Interpolator = function( types, runloop, escapeHtml, detachNode, unbind, Mustache, detach ) {
 
        var Interpolator = function( options ) {
            this.type = types.INTERPOLATOR;
            Mustache.init( this, options );
        };
        Interpolator.prototype = {
            update: function() {
                this.node.data = this.value == undefined ? '' : this.value;
            },
            resolve: Mustache.resolve,
            rebind: Mustache.rebind,
            detach: detach,
            unbind: unbind,
            render: function() {
                if ( !this.node ) {
                    this.node = document.createTextNode( this.value != undefined ? this.value : '' );
                }
                return this.node;
            },
            unrender: function( shouldDestroy ) {
                if ( shouldDestroy ) {
                    detachNode( this.node );
                }
            },
            // TEMP
            setValue: function( value ) {
                var wrapper;
                // TODO is there a better way to approach this?
                if ( wrapper = this.root.viewmodel.wrapped[ this.keypath ] ) {
                    value = wrapper.get();
                }
                if ( value !== this.value ) {
                    this.value = value;
                    this.parentFragment.bubble();
                    if ( this.node ) {
                        runloop.addView( this );
                    }
                }
            },
            firstNode: function() {
                return this.node;
            },
            toString: function( escape ) {
                var string = this.value != undefined ? '' + this.value : '';
                return escape ? escapeHtml( string ) : string;
            }
        };
        return Interpolator;
    }( types, runloop, escapeHtml, detachNode, unbind, Mustache, detach );
 
    /* virtualdom/items/Section/prototype/bubble.js */
    var virtualdom_items_Section$bubble = function Section$bubble() {
        this.parentFragment.bubble();
    };
 
    /* virtualdom/items/Section/prototype/detach.js */
    var virtualdom_items_Section$detach = function Section$detach() {
        var docFrag;
        if ( this.fragments.length === 1 ) {
            return this.fragments[ 0 ].detach();
        }
        docFrag = document.createDocumentFragment();
        this.fragments.forEach( function( item ) {
            docFrag.appendChild( item.detach() );
        } );
        return docFrag;
    };
 
    /* virtualdom/items/Section/prototype/find.js */
    var virtualdom_items_Section$find = function Section$find( selector ) {
        var i, len, queryResult;
        len = this.fragments.length;
        for ( i = 0; i < len; i += 1 ) {
            if ( queryResult = this.fragments[ i ].find( selector ) ) {
                return queryResult;
            }
        }
        return null;
    };
 
    /* virtualdom/items/Section/prototype/findAll.js */
    var virtualdom_items_Section$findAll = function Section$findAll( selector, query ) {
        var i, len;
        len = this.fragments.length;
        for ( i = 0; i < len; i += 1 ) {
            this.fragments[ i ].findAll( selector, query );
        }
    };
 
    /* virtualdom/items/Section/prototype/findAllComponents.js */
    var virtualdom_items_Section$findAllComponents = function Section$findAllComponents( selector, query ) {
        var i, len;
        len = this.fragments.length;
        for ( i = 0; i < len; i += 1 ) {
            this.fragments[ i ].findAllComponents( selector, query );
        }
    };
 
    /* virtualdom/items/Section/prototype/findComponent.js */
    var virtualdom_items_Section$findComponent = function Section$findComponent( selector ) {
        var i, len, queryResult;
        len = this.fragments.length;
        for ( i = 0; i < len; i += 1 ) {
            if ( queryResult = this.fragments[ i ].findComponent( selector ) ) {
                return queryResult;
            }
        }
        return null;
    };
 
    /* virtualdom/items/Section/prototype/findNextNode.js */
    var virtualdom_items_Section$findNextNode = function Section$findNextNode( fragment ) {
        if ( this.fragments[ fragment.index + 1 ] ) {
            return this.fragments[ fragment.index + 1 ].firstNode();
        }
        return this.parentFragment.findNextNode( this );
    };
 
    /* virtualdom/items/Section/prototype/firstNode.js */
    var virtualdom_items_Section$firstNode = function Section$firstNode() {
        var len, i, node;
        if ( len = this.fragments.length ) {
            for ( i = 0; i < len; i += 1 ) {
                if ( node = this.fragments[ i ].firstNode() ) {
                    return node;
                }
            }
        }
        return this.parentFragment.findNextNode( this );
    };
 
    /* virtualdom/items/Section/prototype/merge.js */
    var virtualdom_items_Section$merge = function( runloop, circular ) {
 
        var Fragment;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        return function Section$merge( newIndices ) {
            var section = this,
                parentFragment, firstChange, i, newLength, reboundFragments, fragmentOptions, fragment, nextNode;
            parentFragment = this.parentFragment;
            reboundFragments = [];
            // first, rebind existing fragments
            newIndices.forEach( function rebindIfNecessary( newIndex, oldIndex ) {
                var fragment, by, oldKeypath, newKeypath;
                if ( newIndex === oldIndex ) {
                    reboundFragments[ newIndex ] = section.fragments[ oldIndex ];
                    return;
                }
                fragment = section.fragments[ oldIndex ];
                if ( firstChange === undefined ) {
                    firstChange = oldIndex;
                }
                // does this fragment need to be torn down?
                if ( newIndex === -1 ) {
                    section.fragmentsToUnrender.push( fragment );
                    fragment.unbind();
                    return;
                }
                // Otherwise, it needs to be rebound to a new index
                by = newIndex - oldIndex;
                oldKeypath = section.keypath + '.' + oldIndex;
                newKeypath = section.keypath + '.' + newIndex;
                fragment.rebind( section.template.i, newIndex, oldKeypath, newKeypath );
                reboundFragments[ newIndex ] = fragment;
            } );
            // If nothing changed with the existing fragments, then we start adding
            // new fragments at the end...
            if ( firstChange === undefined ) {
                firstChange = this.length;
            }
            this.length = this.fragments.length = newLength = this.root.get( this.keypath ).length;
            if ( newLength === firstChange ) {
                // ...unless there are no new fragments to add
                return;
            }
            runloop.addView( this );
            // Prepare new fragment options
            fragmentOptions = {
                template: this.template.f,
                root: this.root,
                owner: this
            };
            if ( this.template.i ) {
                fragmentOptions.indexRef = this.template.i;
            }
            // Add as many new fragments as we need to, or add back existing
            // (detached) fragments
            for ( i = firstChange; i < newLength; i += 1 ) {
                // is this an existing fragment?
                if ( fragment = reboundFragments[ i ] ) {
                    this.docFrag.appendChild( fragment.detach( false ) );
                } else {
                    // Fragment will be created when changes are applied
                    // by the runloop
                    this.fragmentsToCreate.push( i );
                }
                this.fragments[ i ] = fragment;
            }
            // reinsert fragment
            nextNode = parentFragment.findNextNode( this );
            this.parentFragment.getNode().insertBefore( this.docFrag, nextNode );
        };
    }( runloop, circular );
 
    /* virtualdom/items/Section/prototype/render.js */
    var virtualdom_items_Section$render = function Section$render() {
        var docFrag;
        docFrag = this.docFrag = document.createDocumentFragment();
        this.update();
        this.rendered = true;
        return docFrag;
    };
 
    /* virtualdom/items/Section/prototype/setValue.js */
    var virtualdom_items_Section$setValue = function( types, isArray, isObject, runloop, circular ) {
 
        var Fragment;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        return function Section$setValue( value ) {
            var this$0 = this;
            var wrapper, fragmentOptions;
            if ( this.updating ) {
                // If a child of this section causes a re-evaluation - for example, an
                // expression refers to a function that mutates the array that this
                // section depends on - we'll end up with a double rendering bug (see
                // https://github.com/ractivejs/ractive/issues/748). This prevents it.
                return;
            }
            this.updating = true;
            // with sections, we need to get the fake value if we have a wrapped object
            if ( wrapper = this.root.viewmodel.wrapped[ this.keypath ] ) {
                value = wrapper.get();
            }
            // If any fragments are awaiting creation after a splice,
            // this is the place to do it
            if ( this.fragmentsToCreate.length ) {
                fragmentOptions = {
                    template: this.template.f,
                    root: this.root,
                    pElement: this.pElement,
                    owner: this,
                    indexRef: this.template.i
                };
                this.fragmentsToCreate.forEach( function( index ) {
                    var fragment;
                    fragmentOptions.context = this$0.keypath + '.' + index;
                    fragmentOptions.index = index;
                    fragment = new Fragment( fragmentOptions );
                    this$0.fragmentsToRender.push( this$0.fragments[ index ] = fragment );
                } );
                this.fragmentsToCreate.length = 0;
            } else if ( reevaluateSection( this, value ) ) {
                this.bubble();
                if ( this.rendered ) {
                    runloop.addView( this );
                }
            }
            this.value = value;
            this.updating = false;
        };
 
        function reevaluateSection( section, value ) {
            var fragmentOptions = {
                template: section.template.f,
                root: section.root,
                pElement: section.parentFragment.pElement,
                owner: section
            };
            // If we already know the section type, great
            // TODO can this be optimised? i.e. pick an reevaluateSection function during init
            // and avoid doing this each time?
            if ( section.template.n ) {
                switch ( section.template.n ) {
                    case types.SECTION_IF:
                        return reevaluateConditionalSection( section, value, false, fragmentOptions );
                    case types.SECTION_UNLESS:
                        return reevaluateConditionalSection( section, value, true, fragmentOptions );
                    case types.SECTION_WITH:
                        return reevaluateContextSection( section, fragmentOptions );
                    case types.SECTION_EACH:
                        if ( isObject( value ) ) {
                            return reevaluateListObjectSection( section, value, fragmentOptions );
                        }
                }
            }
            // Otherwise we need to work out what sort of section we're dealing with
            section.ordered = !!isArray( value );
            // Ordered list section
            if ( section.ordered ) {
                return reevaluateListSection( section, value, fragmentOptions );
            }
            // Unordered list, or context
            if ( isObject( value ) || typeof value === 'function' ) {
                // Index reference indicates section should be treated as a list
                if ( section.template.i ) {
                    return reevaluateListObjectSection( section, value, fragmentOptions );
                }
                // Otherwise, object provides context for contents
                return reevaluateContextSection( section, fragmentOptions );
            }
            // Conditional section
            return reevaluateConditionalSection( section, value, false, fragmentOptions );
        }
 
        function reevaluateListSection( section, value, fragmentOptions ) {
            var i, length, fragment;
            length = value.length;
            if ( length === section.length ) {
                // Nothing to do
                return false;
            }
            // if the array is shorter than it was previously, remove items
            if ( length < section.length ) {
                section.fragmentsToUnrender = section.fragments.splice( length, section.length - length );
                section.fragmentsToUnrender.forEach( unbind );
            } else {
                if ( length > section.length ) {
                    // add any new ones
                    for ( i = section.length; i < length; i += 1 ) {
                        // append list item to context stack
                        fragmentOptions.context = section.keypath + '.' + i;
                        fragmentOptions.index = i;
                        if ( section.template.i ) {
                            fragmentOptions.indexRef = section.template.i;
                        }
                        fragment = new Fragment( fragmentOptions );
                        section.fragmentsToRender.push( section.fragments[ i ] = fragment );
                    }
                }
            }
            section.length = length;
            return true;
        }
 
        function reevaluateListObjectSection( section, value, fragmentOptions ) {
            var id, i, hasKey, fragment, changed;
            hasKey = section.hasKey || ( section.hasKey = {} );
            // remove any fragments that should no longer exist
            i = section.fragments.length;
            while ( i-- ) {
                fragment = section.fragments[ i ];
                if ( !( fragment.index in value ) ) {
                    changed = true;
                    fragment.unbind();
                    section.fragmentsToUnrender.push( fragment );
                    section.fragments.splice( i, 1 );
                    hasKey[ fragment.index ] = false;
                }
            }
            // add any that haven't been created yet
            for ( id in value ) {
                if ( !hasKey[ id ] ) {
                    changed = true;
                    fragmentOptions.context = section.keypath + '.' + id;
                    fragmentOptions.index = id;
                    if ( section.template.i ) {
                        fragmentOptions.indexRef = section.template.i;
                    }
                    fragment = new Fragment( fragmentOptions );
                    section.fragmentsToRender.push( fragment );
                    section.fragments.push( fragment );
                    hasKey[ id ] = true;
                }
            }
            section.length = section.fragments.length;
            return changed;
        }
 
        function reevaluateContextSection( section, fragmentOptions ) {
            var fragment;
            // ...then if it isn't rendered, render it, adding section.keypath to the context stack
            // (if it is already rendered, then any children dependent on the context stack
            // will update themselves without any prompting)
            if ( !section.length ) {
                // append this section to the context stack
                fragmentOptions.context = section.keypath;
                fragmentOptions.index = 0;
                fragment = new Fragment( fragmentOptions );
                section.fragmentsToRender.push( section.fragments[ 0 ] = fragment );
                section.length = 1;
                return true;
            }
        }
 
        function reevaluateConditionalSection( section, value, inverted, fragmentOptions ) {
            var doRender, emptyArray, fragment;
            emptyArray = isArray( value ) && value.length === 0;
            if ( inverted ) {
                doRender = emptyArray || !value;
            } else {
                doRender = value && !emptyArray;
            }
            if ( doRender ) {
                if ( !section.length ) {
                    // no change to context stack
                    fragmentOptions.index = 0;
                    fragment = new Fragment( fragmentOptions );
                    section.fragmentsToRender.push( section.fragments[ 0 ] = fragment );
                    section.length = 1;
                    return true;
                }
                if ( section.length > 1 ) {
                    section.fragmentsToUnrender = section.fragments.splice( 1 );
                    section.fragmentsToUnrender.forEach( unbind );
                    return true;
                }
            } else if ( section.length ) {
                section.fragmentsToUnrender = section.fragments.splice( 0, section.fragments.length );
                section.fragmentsToUnrender.forEach( unbind );
                section.length = 0;
                return true;
            }
        }
 
        function unbind( fragment ) {
            fragment.unbind();
        }
    }( types, isArray, isObject, runloop, circular );
 
    /* virtualdom/items/Section/prototype/splice.js */
    var virtualdom_items_Section$splice = function( runloop, circular ) {
 
        var Fragment;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        return function Section$splice( spliceSummary ) {
            var section = this,
                balance, start, insertStart, insertEnd, spliceArgs;
            balance = spliceSummary.balance;
            if ( !balance ) {
                // The array length hasn't changed - we don't need to add or remove anything
                return;
            }
            // Register with the runloop, so we can (un)render with the
            // next batch of DOM changes
            runloop.addView( section );
            start = spliceSummary.rangeStart;
            section.length += balance;
            // If more items were removed from the array than added, we tear down
            // the excess fragments and remove them...
            if ( balance < 0 ) {
                section.fragmentsToUnrender = section.fragments.splice( start, -balance );
                section.fragmentsToUnrender.forEach( unbind );
                // Reassign fragments after the ones we've just removed
                rebindFragments( section, start, section.length, balance );
                // Nothing more to do
                return;
            }
            // ...otherwise we need to add some things to the DOM.
            insertStart = start + spliceSummary.removed;
            insertEnd = start + spliceSummary.added;
            // Make room for the new fragments by doing a splice that simulates
            // what happened to the data array
            spliceArgs = [
                insertStart,
                0
            ];
            spliceArgs.length += balance;
            section.fragments.splice.apply( section.fragments, spliceArgs );
            // Rebind existing fragments at the end of the array
            rebindFragments( section, insertEnd, section.length, balance );
            // Schedule new fragments to be created
            section.fragmentsToCreate = range( insertStart, insertEnd );
        };
 
        function unbind( fragment ) {
            fragment.unbind();
        }
 
        function range( start, end ) {
            var array = [],
                i;
            for ( i = start; i < end; i += 1 ) {
                array.push( i );
            }
            return array;
        }
 
        function rebindFragments( section, start, end, by ) {
            var i, fragment, indexRef, oldKeypath, newKeypath;
            indexRef = section.template.i;
            for ( i = start; i < end; i += 1 ) {
                fragment = section.fragments[ i ];
                oldKeypath = section.keypath + '.' + ( i - by );
                newKeypath = section.keypath + '.' + i;
                // change the fragment index
                fragment.index = i;
                fragment.rebind( indexRef, i, oldKeypath, newKeypath );
            }
        }
    }( runloop, circular );
 
    /* virtualdom/items/Section/prototype/toString.js */
    var virtualdom_items_Section$toString = function Section$toString( escape ) {
        var str, i, len;
        str = '';
        i = 0;
        len = this.length;
        for ( i = 0; i < len; i += 1 ) {
            str += this.fragments[ i ].toString( escape );
        }
        return str;
    };
 
    /* virtualdom/items/Section/prototype/unbind.js */
    var virtualdom_items_Section$unbind = function( unbind ) {
 
        return function Section$unbind() {
            this.fragments.forEach( unbindFragment );
            unbind.call( this );
            this.length = 0;
        };
 
        function unbindFragment( fragment ) {
            fragment.unbind();
        }
    }( unbind );
 
    /* virtualdom/items/Section/prototype/unrender.js */
    var virtualdom_items_Section$unrender = function() {
 
        return function Section$unrender( shouldDestroy ) {
            this.fragments.forEach( shouldDestroy ? unrenderAndDestroy : unrender );
        };
 
        function unrenderAndDestroy( fragment ) {
            fragment.unrender( true );
        }
 
        function unrender( fragment ) {
            fragment.unrender( false );
        }
    }();
 
    /* virtualdom/items/Section/prototype/update.js */
    var virtualdom_items_Section$update = function Section$update() {
        var fragment, rendered, nextFragment, anchor, target;
        while ( fragment = this.fragmentsToUnrender.pop() ) {
            fragment.unrender( true );
        }
        // If we have no new nodes to insert (i.e. the section length stayed the
        // same, or shrank), we don't need to go any further
        if ( !this.fragmentsToRender.length ) {
            return;
        }
        if ( this.rendered ) {
            target = this.parentFragment.getNode();
        }
        // Render new fragments to our docFrag
        while ( fragment = this.fragmentsToRender.shift() ) {
            rendered = fragment.render();
            this.docFrag.appendChild( rendered );
            // If this is an ordered list, and it's already rendered, we may
            // need to insert content into the appropriate place
            if ( this.rendered && this.ordered ) {
                // If the next fragment is already rendered, use it as an anchor...
                nextFragment = this.fragments[ fragment.index + 1 ];
                if ( nextFragment && nextFragment.rendered ) {
                    target.insertBefore( this.docFrag, nextFragment.firstNode() || null );
                }
            }
        }
        if ( this.rendered && this.docFrag.childNodes.length ) {
            anchor = this.parentFragment.findNextNode( this );
            target.insertBefore( this.docFrag, anchor );
        }
    };
 
    /* virtualdom/items/Section/_Section.js */
    var Section = function( types, Mustache, bubble, detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, merge, render, setValue, splice, toString, unbind, unrender, update ) {
 
        var Section = function( options ) {
            this.type = types.SECTION;
            this.inverted = options.template.n === types.SECTION_UNLESS;
            this.pElement = options.pElement;
            this.fragments = [];
            this.fragmentsToCreate = [];
            this.fragmentsToRender = [];
            this.fragmentsToUnrender = [];
            this.length = 0;
            // number of times this section is rendered
            Mustache.init( this, options );
        };
        Section.prototype = {
            bubble: bubble,
            detach: detach,
            find: find,
            findAll: findAll,
            findAllComponents: findAllComponents,
            findComponent: findComponent,
            findNextNode: findNextNode,
            firstNode: firstNode,
            merge: merge,
            rebind: Mustache.rebind,
            render: render,
            resolve: Mustache.resolve,
            setValue: setValue,
            splice: splice,
            toString: toString,
            unbind: unbind,
            unrender: unrender,
            update: update
        };
        return Section;
    }( types, Mustache, virtualdom_items_Section$bubble, virtualdom_items_Section$detach, virtualdom_items_Section$find, virtualdom_items_Section$findAll, virtualdom_items_Section$findAllComponents, virtualdom_items_Section$findComponent, virtualdom_items_Section$findNextNode, virtualdom_items_Section$firstNode, virtualdom_items_Section$merge, virtualdom_items_Section$render, virtualdom_items_Section$setValue, virtualdom_items_Section$splice, virtualdom_items_Section$toString, virtualdom_items_Section$unbind, virtualdom_items_Section$unrender, virtualdom_items_Section$update );
 
    /* virtualdom/items/Triple/prototype/detach.js */
    var virtualdom_items_Triple$detach = function Triple$detach() {
        var len, i;
        if ( this.docFrag ) {
            len = this.nodes.length;
            for ( i = 0; i < len; i += 1 ) {
                this.docFrag.appendChild( this.nodes[ i ] );
            }
            return this.docFrag;
        }
    };
 
    /* virtualdom/items/Triple/prototype/find.js */
    var virtualdom_items_Triple$find = function( matches ) {
 
        return function Triple$find( selector ) {
            var i, len, node, queryResult;
            len = this.nodes.length;
            for ( i = 0; i < len; i += 1 ) {
                node = this.nodes[ i ];
                if ( node.nodeType !== 1 ) {
                    continue;
                }
                if ( matches( node, selector ) ) {
                    return node;
                }
                if ( queryResult = node.querySelector( selector ) ) {
                    return queryResult;
                }
            }
            return null;
        };
    }( matches );
 
    /* virtualdom/items/Triple/prototype/findAll.js */
    var virtualdom_items_Triple$findAll = function( matches ) {
 
        return function Triple$findAll( selector, queryResult ) {
            var i, len, node, queryAllResult, numNodes, j;
            len = this.nodes.length;
            for ( i = 0; i < len; i += 1 ) {
                node = this.nodes[ i ];
                if ( node.nodeType !== 1 ) {
                    continue;
                }
                if ( matches( node, selector ) ) {
                    queryResult.push( node );
                }
                if ( queryAllResult = node.querySelectorAll( selector ) ) {
                    numNodes = queryAllResult.length;
                    for ( j = 0; j < numNodes; j += 1 ) {
                        queryResult.push( queryAllResult[ j ] );
                    }
                }
            }
        };
    }( matches );
 
    /* virtualdom/items/Triple/prototype/firstNode.js */
    var virtualdom_items_Triple$firstNode = function Triple$firstNode() {
        if ( this.rendered && this.nodes[ 0 ] ) {
            return this.nodes[ 0 ];
        }
        return this.parentFragment.findNextNode( this );
    };
 
    /* virtualdom/items/Triple/helpers/insertHtml.js */
    var insertHtml = function( namespaces, createElement ) {
 
        var elementCache = {},
            ieBug, ieBlacklist;
        try {
            createElement( 'table' ).innerHTML = 'foo';
        } catch ( err ) {
            ieBug = true;
            ieBlacklist = {
                TABLE: [
                    '<table class="x">',
                    '</table>'
                ],
                THEAD: [
                    '<table><thead class="x">',
                    '</thead></table>'
                ],
                TBODY: [
                    '<table><tbody class="x">',
                    '</tbody></table>'
                ],
                TR: [
                    '<table><tr class="x">',
                    '</tr></table>'
                ],
                SELECT: [
                    '<select class="x">',
                    '</select>'
                ]
            };
        }
        return function( html, node, docFrag ) {
            var container, nodes = [],
                wrapper, selectedOption, child, i;
            if ( html ) {
                if ( ieBug && ( wrapper = ieBlacklist[ node.tagName ] ) ) {
                    container = element( 'DIV' );
                    container.innerHTML = wrapper[ 0 ] + html + wrapper[ 1 ];
                    container = container.querySelector( '.x' );
                    if ( container.tagName === 'SELECT' ) {
                        selectedOption = container.options[ container.selectedIndex ];
                    }
                } else if ( node.namespaceURI === namespaces.svg ) {
                    container = element( 'DIV' );
                    container.innerHTML = '<svg class="x">' + html + '</svg>';
                    container = container.querySelector( '.x' );
                } else {
                    container = element( node.tagName );
                    container.innerHTML = html;
                }
                while ( child = container.firstChild ) {
                    nodes.push( child );
                    docFrag.appendChild( child );
                }
                // This is really annoying. Extracting <option> nodes from the
                // temporary container <select> causes the remaining ones to
                // become selected. So now we have to deselect them. IE8, you
                // amaze me. You really do
                if ( ieBug && node.tagName === 'SELECT' ) {
                    i = nodes.length;
                    while ( i-- ) {
                        if ( nodes[ i ] !== selectedOption ) {
                            nodes[ i ].selected = false;
                        }
                    }
                }
            }
            return nodes;
        };
 
        function element( tagName ) {
            return elementCache[ tagName ] || ( elementCache[ tagName ] = createElement( tagName ) );
        }
    }( namespaces, createElement );
 
    /* utils/toArray.js */
    var toArray = function toArray( arrayLike ) {
        var array = [],
            i = arrayLike.length;
        while ( i-- ) {
            array[ i ] = arrayLike[ i ];
        }
        return array;
    };
 
    /* virtualdom/items/Triple/helpers/updateSelect.js */
    var updateSelect = function( toArray ) {
 
        return function updateSelect( parentElement ) {
            var selectedOptions, option, value;
            if ( !parentElement || parentElement.name !== 'select' || !parentElement.binding ) {
                return;
            }
            selectedOptions = toArray( parentElement.node.options ).filter( isSelected );
            // If one of them had a `selected` attribute, we need to sync
            // the model to the view
            if ( parentElement.getAttribute( 'multiple' ) ) {
                value = selectedOptions.map( function( o ) {
                    return o.value;
                } );
            } else if ( option = selectedOptions[ 0 ] ) {
                value = option.value;
            }
            if ( value !== undefined ) {
                parentElement.binding.setValue( value );
            }
            parentElement.bubble();
        };
 
        function isSelected( option ) {
            return option.selected;
        }
    }( toArray );
 
    /* virtualdom/items/Triple/prototype/render.js */
    var virtualdom_items_Triple$render = function( insertHtml, updateSelect ) {
 
        return function Triple$render() {
            if ( this.rendered ) {
                throw new Error( 'Attempted to render an item that was already rendered' );
            }
            this.docFrag = document.createDocumentFragment();
            this.nodes = insertHtml( this.value, this.parentFragment.getNode(), this.docFrag );
            // Special case - we're inserting the contents of a <select>
            updateSelect( this.pElement );
            this.rendered = true;
            return this.docFrag;
        };
    }( insertHtml, updateSelect );
 
    /* virtualdom/items/Triple/prototype/setValue.js */
    var virtualdom_items_Triple$setValue = function( runloop ) {
 
        return function Triple$setValue( value ) {
            var wrapper;
            // TODO is there a better way to approach this?
            if ( wrapper = this.root.viewmodel.wrapped[ this.keypath ] ) {
                value = wrapper.get();
            }
            if ( value !== this.value ) {
                this.value = value;
                this.parentFragment.bubble();
                if ( this.rendered ) {
                    runloop.addView( this );
                }
            }
        };
    }( runloop );
 
    /* virtualdom/items/Triple/prototype/toString.js */
    var virtualdom_items_Triple$toString = function Triple$toString() {
        return this.value != undefined ? this.value : '';
    };
 
    /* virtualdom/items/Triple/prototype/unrender.js */
    var virtualdom_items_Triple$unrender = function( detachNode ) {
 
        return function Triple$unrender( shouldDestroy ) {
            if ( this.rendered && shouldDestroy ) {
                this.nodes.forEach( detachNode );
                this.rendered = false;
            }
        };
    }( detachNode );
 
    /* virtualdom/items/Triple/prototype/update.js */
    var virtualdom_items_Triple$update = function( insertHtml, updateSelect ) {
 
        return function Triple$update() {
            var node, parentNode;
            if ( !this.rendered ) {
                return;
            }
            // Remove existing nodes
            while ( this.nodes && this.nodes.length ) {
                node = this.nodes.pop();
                node.parentNode.removeChild( node );
            }
            // Insert new nodes
            parentNode = this.parentFragment.getNode();
            this.nodes = insertHtml( this.value, parentNode, this.docFrag );
            parentNode.insertBefore( this.docFrag, this.parentFragment.findNextNode( this ) );
            // Special case - we're inserting the contents of a <select>
            updateSelect( this.pElement );
        };
    }( insertHtml, updateSelect );
 
    /* virtualdom/items/Triple/_Triple.js */
    var Triple = function( types, Mustache, detach, find, findAll, firstNode, render, setValue, toString, unrender, update, unbind ) {
 
        var Triple = function( options ) {
            this.type = types.TRIPLE;
            Mustache.init( this, options );
        };
        Triple.prototype = {
            detach: detach,
            find: find,
            findAll: findAll,
            firstNode: firstNode,
            rebind: Mustache.rebind,
            render: render,
            resolve: Mustache.resolve,
            setValue: setValue,
            toString: toString,
            unbind: unbind,
            unrender: unrender,
            update: update
        };
        return Triple;
    }( types, Mustache, virtualdom_items_Triple$detach, virtualdom_items_Triple$find, virtualdom_items_Triple$findAll, virtualdom_items_Triple$firstNode, virtualdom_items_Triple$render, virtualdom_items_Triple$setValue, virtualdom_items_Triple$toString, virtualdom_items_Triple$unrender, virtualdom_items_Triple$update, unbind );
 
    /* virtualdom/items/Element/prototype/bubble.js */
    var virtualdom_items_Element$bubble = function() {
        this.parentFragment.bubble();
    };
 
    /* virtualdom/items/Element/prototype/detach.js */
    var virtualdom_items_Element$detach = function Element$detach() {
        var node = this.node,
            parentNode;
        if ( node ) {
            // need to check for parent node - DOM may have been altered
            // by something other than Ractive! e.g. jQuery UI...
            if ( parentNode = node.parentNode ) {
                parentNode.removeChild( node );
            }
            return node;
        }
    };
 
    /* virtualdom/items/Element/prototype/find.js */
    var virtualdom_items_Element$find = function( matches ) {
 
        return function( selector ) {
            if ( matches( this.node, selector ) ) {
                return this.node;
            }
            if ( this.fragment && this.fragment.find ) {
                return this.fragment.find( selector );
            }
        };
    }( matches );
 
    /* virtualdom/items/Element/prototype/findAll.js */
    var virtualdom_items_Element$findAll = function( selector, query ) {
        // Add this node to the query, if applicable, and register the
        // query on this element
        if ( query._test( this, true ) && query.live ) {
            ( this.liveQueries || ( this.liveQueries = [] ) ).push( query );
        }
        if ( this.fragment ) {
            this.fragment.findAll( selector, query );
        }
    };
 
    /* virtualdom/items/Element/prototype/findAllComponents.js */
    var virtualdom_items_Element$findAllComponents = function( selector, query ) {
        if ( this.fragment ) {
            this.fragment.findAllComponents( selector, query );
        }
    };
 
    /* virtualdom/items/Element/prototype/findComponent.js */
    var virtualdom_items_Element$findComponent = function( selector ) {
        if ( this.fragment ) {
            return this.fragment.findComponent( selector );
        }
    };
 
    /* virtualdom/items/Element/prototype/findNextNode.js */
    var virtualdom_items_Element$findNextNode = function Element$findNextNode() {
        return null;
    };
 
    /* virtualdom/items/Element/prototype/firstNode.js */
    var virtualdom_items_Element$firstNode = function Element$firstNode() {
        return this.node;
    };
 
    /* virtualdom/items/Element/prototype/getAttribute.js */
    var virtualdom_items_Element$getAttribute = function Element$getAttribute( name ) {
        if ( !this.attributes || !this.attributes[ name ] ) {
            return;
        }
        return this.attributes[ name ].value;
    };
 
    /* virtualdom/items/Element/shared/enforceCase.js */
    var enforceCase = function() {
 
        var svgCamelCaseElements, svgCamelCaseAttributes, createMap, map;
        svgCamelCaseElements = 'altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath vkern'.split( ' ' );
        svgCamelCaseAttributes = 'attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan'.split( ' ' );
        createMap = function( items ) {
            var map = {},
                i = items.length;
            while ( i-- ) {
                map[ items[ i ].toLowerCase() ] = items[ i ];
            }
            return map;
        };
        map = createMap( svgCamelCaseElements.concat( svgCamelCaseAttributes ) );
        return function( elementName ) {
            var lowerCaseElementName = elementName.toLowerCase();
            return map[ lowerCaseElementName ] || lowerCaseElementName;
        };
    }();
 
    /* virtualdom/items/Element/prototype/init/getElementNamespace.js */
    var virtualdom_items_Element$init_getElementNamespace = function( namespaces ) {
 
        var defaultNamespaces = {
            svg: namespaces.svg,
            foreignObject: namespaces.html
        };
        return function( template, parent ) {
            // if the element has an xmlns attribute, use that
            if ( template.a && template.a.xmlns ) {
                return template.a.xmlns;
            }
            // otherwise, guess namespace for svg/foreignObject elements, or inherit namespace from parent
            return defaultNamespaces[ template.e ] || parent && parent.namespace || namespaces.html;
        };
    }( namespaces );
 
    /* virtualdom/items/Element/Attribute/prototype/bubble.js */
    var virtualdom_items_Element_Attribute$bubble = function( runloop ) {
 
        return function Attribute$bubble() {
            var value = this.fragment.getValue();
            // TODO this can register the attribute multiple times (see render test
            // 'Attribute with nested mustaches')
            if ( value !== this.value ) {
                this.value = value;
                if ( this.name === 'value' && this.node ) {
                    // We need to store the value on the DOM like this so we
                    // can retrieve it later without it being coerced to a string
                    this.node._ractive.value = value;
                }
                if ( this.rendered ) {
                    runloop.addView( this );
                }
            }
        };
    }( runloop );
 
    /* virtualdom/items/Element/Attribute/helpers/determineNameAndNamespace.js */
    var determineNameAndNamespace = function( namespaces, enforceCase ) {
 
        return function( attribute, name ) {
            var colonIndex, namespacePrefix;
            // are we dealing with a namespaced attribute, e.g. xlink:href?
            colonIndex = name.indexOf( ':' );
            if ( colonIndex !== -1 ) {
                // looks like we are, yes...
                namespacePrefix = name.substr( 0, colonIndex );
                // ...unless it's a namespace *declaration*, which we ignore (on the assumption
                // that only valid namespaces will be used)
                if ( namespacePrefix !== 'xmlns' ) {
                    name = name.substring( colonIndex + 1 );
                    attribute.name = enforceCase( name );
                    attribute.namespace = namespaces[ namespacePrefix.toLowerCase() ];
                    if ( !attribute.namespace ) {
                        throw 'Unknown namespace ("' + namespacePrefix + '")';
                    }
                    return;
                }
            }
            // SVG attribute names are case sensitive
            attribute.name = attribute.element.namespace !== namespaces.html ? enforceCase( name ) : name;
        };
    }( namespaces, enforceCase );
 
    /* virtualdom/items/Element/Attribute/helpers/getInterpolator.js */
    var getInterpolator = function( types ) {
 
        return function getInterpolator( attribute ) {
            var items = attribute.fragment.items;
            if ( items.length !== 1 ) {
                return;
            }
            if ( items[ 0 ].type === types.INTERPOLATOR ) {
                return items[ 0 ];
            }
        };
    }( types );
 
    /* virtualdom/items/Element/Attribute/helpers/determinePropertyName.js */
    var determinePropertyName = function( namespaces ) {
 
        // the property name equivalents for element attributes, where they differ
        // from the lowercased attribute name
        var propertyNames = {
            'accept-charset': 'acceptCharset',
            accesskey: 'accessKey',
            bgcolor: 'bgColor',
            'class': 'className',
            codebase: 'codeBase',
            colspan: 'colSpan',
            contenteditable: 'contentEditable',
            datetime: 'dateTime',
            dirname: 'dirName',
            'for': 'htmlFor',
            'http-equiv': 'httpEquiv',
            ismap: 'isMap',
            maxlength: 'maxLength',
            novalidate: 'noValidate',
            pubdate: 'pubDate',
            readonly: 'readOnly',
            rowspan: 'rowSpan',
            tabindex: 'tabIndex',
            usemap: 'useMap'
        };
        return function( attribute, options ) {
            var propertyName;
            if ( attribute.pNode && !attribute.namespace && ( !options.pNode.namespaceURI || options.pNode.namespaceURI === namespaces.html ) ) {
                propertyName = propertyNames[ attribute.name ] || attribute.name;
                if ( options.pNode[ propertyName ] !== undefined ) {
                    attribute.propertyName = propertyName;
                }
                // is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
                // node.selected = true rather than node.setAttribute( 'selected', '' )
                if ( typeof options.pNode[ propertyName ] === 'boolean' || propertyName === 'value' ) {
                    attribute.useProperty = true;
                }
            }
        };
    }( namespaces );
 
    /* virtualdom/items/Element/Attribute/prototype/init.js */
    var virtualdom_items_Element_Attribute$init = function( types, determineNameAndNamespace, getInterpolator, determinePropertyName, circular ) {
 
        var Fragment;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        return function Attribute$init( options ) {
            this.type = types.ATTRIBUTE;
            this.element = options.element;
            this.root = options.root;
            determineNameAndNamespace( this, options.name );
            // if it's an empty attribute, or just a straight key-value pair, with no
            // mustache shenanigans, set the attribute accordingly and go home
            if ( !options.value || typeof options.value === 'string' ) {
                this.value = options.value || true;
                return;
            }
            // otherwise we need to do some work
            // share parentFragment with parent element
            this.parentFragment = this.element.parentFragment;
            this.fragment = new Fragment( {
                template: options.value,
                root: this.root,
                owner: this
            } );
            this.value = this.fragment.getValue();
            // Store a reference to this attribute's interpolator, if its fragment
            // takes the form `{{foo}}`. This is necessary for two-way binding and
            // for correctly rendering HTML later
            this.interpolator = getInterpolator( this );
            this.isBindable = !!this.interpolator;
            // can we establish this attribute's property name equivalent?
            determinePropertyName( this, options );
            // mark as ready
            this.ready = true;
        };
    }( types, determineNameAndNamespace, getInterpolator, determinePropertyName, circular );
 
    /* virtualdom/items/Element/Attribute/prototype/rebind.js */
    var virtualdom_items_Element_Attribute$rebind = function Attribute$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
        if ( this.fragment ) {
            this.fragment.rebind( indexRef, newIndex, oldKeypath, newKeypath );
        }
    };
 
    /* virtualdom/items/Element/Attribute/prototype/render.js */
    var virtualdom_items_Element_Attribute$render = function( namespaces ) {
 
        // the property name equivalents for element attributes, where they differ
        // from the lowercased attribute name
        var propertyNames = {
            'accept-charset': 'acceptCharset',
            'accesskey': 'accessKey',
            'bgcolor': 'bgColor',
            'class': 'className',
            'codebase': 'codeBase',
            'colspan': 'colSpan',
            'contenteditable': 'contentEditable',
            'datetime': 'dateTime',
            'dirname': 'dirName',
            'for': 'htmlFor',
            'http-equiv': 'httpEquiv',
            'ismap': 'isMap',
            'maxlength': 'maxLength',
            'novalidate': 'noValidate',
            'pubdate': 'pubDate',
            'readonly': 'readOnly',
            'rowspan': 'rowSpan',
            'tabindex': 'tabIndex',
            'usemap': 'useMap'
        };
        return function Attribute$render( node ) {
            var propertyName;
            this.node = node;
            // should we use direct property access, or setAttribute?
            if ( !node.namespaceURI || node.namespaceURI === namespaces.html ) {
                propertyName = propertyNames[ this.name ] || this.name;
                if ( node[ propertyName ] !== undefined ) {
                    this.propertyName = propertyName;
                }
                // is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
                // node.selected = true rather than node.setAttribute( 'selected', '' )
                if ( typeof node[ propertyName ] === 'boolean' || propertyName === 'value' ) {
                    this.useProperty = true;
                }
                if ( propertyName === 'value' ) {
                    this.useProperty = true;
                    node._ractive.value = this.value;
                }
            }
            this.rendered = true;
            this.update();
        };
    }( namespaces );
 
    /* virtualdom/items/Element/Attribute/prototype/toString.js */
    var virtualdom_items_Element_Attribute$toString = function() {
 
        return function Attribute$toString() {
            var name, value, interpolator;
            name = this.name;
            value = this.value;
            // Special case - select values (should not be stringified)
            if ( name === 'value' && this.element.name === 'select' ) {
                return;
            }
            // Special case - radio names
            if ( name === 'name' && this.element.name === 'input' && ( interpolator = this.interpolator ) ) {
                return 'name={{' + ( interpolator.keypath || interpolator.ref ) + '}}';
            }
            // Numbers
            if ( typeof value === 'number' ) {
                return name + '="' + value + '"';
            }
            // Strings
            if ( typeof value === 'string' ) {
                return name + '="' + escape( value ) + '"';
            }
            // Everything else
            return value ? name : '';
        };
 
        function escape( value ) {
            return value.replace( /&/g, '&amp;' ).replace( /"/g, '&quot;' ).replace( /'/g, '&#39;' );
        }
    }();
 
    /* virtualdom/items/Element/Attribute/prototype/unbind.js */
    var virtualdom_items_Element_Attribute$unbind = function Attribute$unbind() {
        // ignore non-dynamic attributes
        if ( this.fragment ) {
            this.fragment.unbind();
        }
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateSelectValue.js */
    var virtualdom_items_Element_Attribute$update_updateSelectValue = function Attribute$updateSelect() {
        var value = this.value,
            options, option, optionValue, i;
        if ( !this.locked ) {
            this.node._ractive.value = value;
            options = this.node.options;
            i = options.length;
            while ( i-- ) {
                option = options[ i ];
                optionValue = option._ractive ? option._ractive.value : option.value;
                // options inserted via a triple don't have _ractive
                if ( optionValue == value ) {
                    // double equals as we may be comparing numbers with strings
                    option.selected = true;
                    break;
                }
            }
        }
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateMultipleSelectValue.js */
    var virtualdom_items_Element_Attribute$update_updateMultipleSelectValue = function( isArray ) {
 
        return function Attribute$updateMultipleSelect() {
            var value = this.value,
                options, i, option, optionValue;
            if ( !isArray( value ) ) {
                value = [ value ];
            }
            options = this.node.options;
            i = options.length;
            while ( i-- ) {
                option = options[ i ];
                optionValue = option._ractive ? option._ractive.value : option.value;
                // options inserted via a triple don't have _ractive
                option.selected = value.indexOf( optionValue ) !== -1;
            }
        };
    }( isArray );
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateRadioName.js */
    var virtualdom_items_Element_Attribute$update_updateRadioName = function Attribute$updateRadioName() {
        var node = ( value = this ).node,
            value = value.value;
        node.checked = value == node._ractive.value;
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateRadioValue.js */
    var virtualdom_items_Element_Attribute$update_updateRadioValue = function( runloop ) {
 
        return function Attribute$updateRadioValue() {
            var wasChecked, node = this.node,
                binding, bindings, i;
            wasChecked = node.checked;
            node.value = this.element.getAttribute( 'value' );
            node.checked = this.element.getAttribute( 'value' ) === this.element.getAttribute( 'name' );
            // This is a special case - if the input was checked, and the value
            // changed so that it's no longer checked, the twoway binding is
            // most likely out of date. To fix it we have to jump through some
            // hoops... this is a little kludgy but it works
            if ( wasChecked && !node.checked && this.element.binding ) {
                bindings = this.element.binding.siblings;
                if ( i = bindings.length ) {
                    while ( i-- ) {
                        binding = bindings[ i ];
                        if ( !binding.element.node ) {
                            // this is the initial render, siblings are still rendering!
                            // we'll come back later...
                            return;
                        }
                        if ( binding.element.node.checked ) {
                            runloop.addViewmodel( binding.root.viewmodel );
                            return binding.handleChange();
                        }
                    }
                    runloop.addViewmodel( binding.root.viewmodel );
                    this.root.viewmodel.set( binding.keypath, undefined );
                }
            }
        };
    }( runloop );
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateCheckboxName.js */
    var virtualdom_items_Element_Attribute$update_updateCheckboxName = function( isArray ) {
 
        return function Attribute$updateCheckboxName() {
            var node, value;
            node = this.node;
            value = this.value;
            if ( !isArray( value ) ) {
                node.checked = value == node._ractive.value;
            } else {
                node.checked = value.indexOf( node._ractive.value ) !== -1;
            }
        };
    }( isArray );
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateClassName.js */
    var virtualdom_items_Element_Attribute$update_updateClassName = function Attribute$updateClassName() {
        var node, value;
        node = this.node;
        value = this.value;
        if ( value === undefined ) {
            value = '';
        }
        node.className = value;
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateIdAttribute.js */
    var virtualdom_items_Element_Attribute$update_updateIdAttribute = function Attribute$updateIdAttribute() {
        var node, value;
        node = this.node;
        value = this.value;
        if ( value !== undefined ) {
            this.root.nodes[ value ] = undefined;
        }
        this.root.nodes[ value ] = node;
        node.id = value;
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateIEStyleAttribute.js */
    var virtualdom_items_Element_Attribute$update_updateIEStyleAttribute = function Attribute$updateIEStyleAttribute() {
        var node, value;
        node = this.node;
        value = this.value;
        if ( value === undefined ) {
            value = '';
        }
        node.style.setAttribute( 'cssText', value );
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateContentEditableValue.js */
    var virtualdom_items_Element_Attribute$update_updateContentEditableValue = function Attribute$updateContentEditableValue() {
        var node, value;
        node = this.node;
        value = this.value;
        if ( value === undefined ) {
            value = '';
        }
        if ( !this.locked ) {
            node.innerHTML = value;
        }
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateValue.js */
    var virtualdom_items_Element_Attribute$update_updateValue = function Attribute$updateValue() {
        var node, value;
        node = this.node;
        value = this.value;
        // store actual value, so it doesn't get coerced to a string
        node._ractive.value = value;
        // with two-way binding, only update if the change wasn't initiated by the user
        // otherwise the cursor will often be sent to the wrong place
        if ( !this.locked ) {
            node.value = value == undefined ? '' : value;
        }
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateBoolean.js */
    var virtualdom_items_Element_Attribute$update_updateBoolean = function Attribute$updateBooleanAttribute() {
        // with two-way binding, only update if the change wasn't initiated by the user
        // otherwise the cursor will often be sent to the wrong place
        if ( !this.locked ) {
            this.node[ this.propertyName ] = this.value;
        }
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update/updateEverythingElse.js */
    var virtualdom_items_Element_Attribute$update_updateEverythingElse = function Attribute$updateEverythingElse() {
        var node, name, value;
        node = this.node;
        name = this.name;
        value = this.value;
        if ( this.namespace ) {
            node.setAttributeNS( this.namespace, name, value );
        } else if ( typeof value === 'string' || typeof value === 'number' ) {
            node.setAttribute( name, value );
        } else {
            if ( value ) {
                node.setAttribute( name, '' );
            } else {
                node.removeAttribute( name );
            }
        }
    };
 
    /* virtualdom/items/Element/Attribute/prototype/update.js */
    var virtualdom_items_Element_Attribute$update = function( namespaces, noop, updateSelectValue, updateMultipleSelectValue, updateRadioName, updateRadioValue, updateCheckboxName, updateClassName, updateIdAttribute, updateIEStyleAttribute, updateContentEditableValue, updateValue, updateBoolean, updateEverythingElse ) {
 
        // There are a few special cases when it comes to updating attributes. For this reason,
        // the prototype .update() method points to this method, which waits until the
        // attribute has finished initialising, then replaces the prototype method with a more
        // suitable one. That way, we save ourselves doing a bunch of tests on each call
        return function Attribute$update() {
            var name, element, node, type, updateMethod;
            name = this.name;
            element = this.element;
            node = this.node;
            if ( name === 'id' ) {
                updateMethod = updateIdAttribute;
            } else if ( name === 'value' ) {
                // special case - selects
                if ( element.name === 'select' && name === 'value' ) {
                    updateMethod = node.multiple ? updateMultipleSelectValue : updateSelectValue;
                } else if ( element.name === 'textarea' ) {
                    updateMethod = updateValue;
                } else if ( node.getAttribute( 'contenteditable' ) ) {
                    updateMethod = updateContentEditableValue;
                } else if ( element.name === 'input' ) {
                    type = element.getAttribute( 'type' );
                    // type='file' value='{{fileList}}'>
                    if ( type === 'file' ) {
                        updateMethod = noop;
                    } else if ( type === 'radio' && element.binding && element.binding.name === 'name' ) {
                        updateMethod = updateRadioValue;
                    } else {
                        updateMethod = updateValue;
                    }
                }
            } else if ( this.twoway && name === 'name' ) {
                if ( node.type === 'radio' ) {
                    updateMethod = updateRadioName;
                } else if ( node.type === 'checkbox' ) {
                    updateMethod = updateCheckboxName;
                }
            } else if ( name === 'style' && node.style.setAttribute ) {
                updateMethod = updateIEStyleAttribute;
            } else if ( name === 'class' && ( !node.namespaceURI || node.namespaceURI === namespaces.html ) ) {
                updateMethod = updateClassName;
            } else if ( this.useProperty ) {
                updateMethod = updateBoolean;
            }
            if ( !updateMethod ) {
                updateMethod = updateEverythingElse;
            }
            this.update = updateMethod;
            this.update();
        };
    }( namespaces, noop, virtualdom_items_Element_Attribute$update_updateSelectValue, virtualdom_items_Element_Attribute$update_updateMultipleSelectValue, virtualdom_items_Element_Attribute$update_updateRadioName, virtualdom_items_Element_Attribute$update_updateRadioValue, virtualdom_items_Element_Attribute$update_updateCheckboxName, virtualdom_items_Element_Attribute$update_updateClassName, virtualdom_items_Element_Attribute$update_updateIdAttribute, virtualdom_items_Element_Attribute$update_updateIEStyleAttribute, virtualdom_items_Element_Attribute$update_updateContentEditableValue, virtualdom_items_Element_Attribute$update_updateValue, virtualdom_items_Element_Attribute$update_updateBoolean, virtualdom_items_Element_Attribute$update_updateEverythingElse );
 
    /* virtualdom/items/Element/Attribute/_Attribute.js */
    var Attribute = function( bubble, init, rebind, render, toString, unbind, update ) {
 
        var Attribute = function( options ) {
            this.init( options );
        };
        Attribute.prototype = {
            bubble: bubble,
            init: init,
            rebind: rebind,
            render: render,
            toString: toString,
            unbind: unbind,
            update: update
        };
        return Attribute;
    }( virtualdom_items_Element_Attribute$bubble, virtualdom_items_Element_Attribute$init, virtualdom_items_Element_Attribute$rebind, virtualdom_items_Element_Attribute$render, virtualdom_items_Element_Attribute$toString, virtualdom_items_Element_Attribute$unbind, virtualdom_items_Element_Attribute$update );
 
    /* virtualdom/items/Element/prototype/init/createAttributes.js */
    var virtualdom_items_Element$init_createAttributes = function( Attribute ) {
 
        return function( element, attributes ) {
            var name, attribute, result = [];
            for ( name in attributes ) {
                if ( attributes.hasOwnProperty( name ) ) {
                    attribute = new Attribute( {
                        element: element,
                        name: name,
                        value: attributes[ name ],
                        root: element.root
                    } );
                    result.push( result[ name ] = attribute );
                }
            }
            return result;
        };
    }( Attribute );
 
    /* utils/extend.js */
    var extend = function( target ) {
        var SLICE$0 = Array.prototype.slice;
        var sources = SLICE$0.call( arguments, 1 );
        var prop, source;
        while ( source = sources.shift() ) {
            for ( prop in source ) {
                if ( source.hasOwnProperty( prop ) ) {
                    target[ prop ] = source[ prop ];
                }
            }
        }
        return target;
    };
 
    /* virtualdom/items/Element/Binding/Binding.js */
    var Binding = function( runloop, warn, create, extend, removeFromArray ) {
 
        var Binding = function( element ) {
            var interpolator, keypath, value;
            this.element = element;
            this.root = element.root;
            this.attribute = element.attributes[ this.name || 'value' ];
            interpolator = this.attribute.interpolator;
            interpolator.twowayBinding = this;
            if ( interpolator.keypath && interpolator.keypath.substr === '${' ) {
                warn( 'Two-way binding does not work with expressions: ' + interpolator.keypath );
                return false;
            }
            // A mustache may be *ambiguous*. Let's say we were given
            // `value="{{bar}}"`. If the context was `foo`, and `foo.bar`
            // *wasn't* `undefined`, the keypath would be `foo.bar`.
            // Then, any user input would result in `foo.bar` being updated.
            //
            // If, however, `foo.bar` *was* undefined, and so was `bar`, we would be
            // left with an unresolved partial keypath - so we are forced to make an
            // assumption. That assumption is that the input in question should
            // be forced to resolve to `bar`, and any user input would affect `bar`
            // and not `foo.bar`.
            //
            // Did that make any sense? No? Oh. Sorry. Well the moral of the story is
            // be explicit when using two-way data-binding about what keypath you're
            // updating. Using it in lists is probably a recipe for confusion...
            if ( !interpolator.keypath ) {
                if ( interpolator.ref ) {
                    interpolator.resolve( interpolator.ref );
                }
                // If we have a reference expression resolver, we have to force
                // members to attach themselves to the root
                if ( interpolator.resolver ) {
                    interpolator.resolver.forceResolution();
                }
            }
            this.keypath = keypath = interpolator.keypath;
            // initialise value, if it's undefined
            // TODO could we use a similar mechanism instead of the convoluted
            // select/checkbox init logic?
            if ( this.root.viewmodel.get( keypath ) === undefined && this.getInitialValue ) {
                value = this.getInitialValue();
                if ( value !== undefined ) {
                    this.root.viewmodel.set( keypath, value );
                }
            }
        };
        Binding.prototype = {
            handleChange: function() {
                var this$0 = this;
                runloop.start( this.root );
                this.attribute.locked = true;
                this.root.viewmodel.set( this.keypath, this.getValue() );
                runloop.scheduleTask( function() {
                    return this$0.attribute.locked = false;
                } );
                runloop.end();
            },
            rebound: function() {
                var bindings, oldKeypath, newKeypath;
                oldKeypath = this.keypath;
                newKeypath = this.attribute.interpolator.keypath;
                // The attribute this binding is linked to has already done the work
                if ( oldKeypath === newKeypath ) {
                    return;
                }
                removeFromArray( this.root._twowayBindings[ oldKeypath ], this );
                this.keypath = newKeypath;
                bindings = this.root._twowayBindings[ newKeypath ] || ( this.root._twowayBindings[ newKeypath ] = [] );
                bindings.push( this );
            },
            unbind: function() {}
        };
        Binding.extend = function( properties ) {
            var Parent = this,
                SpecialisedBinding;
            SpecialisedBinding = function( element ) {
                Binding.call( this, element );
                if ( this.init ) {
                    this.init();
                }
            };
            SpecialisedBinding.prototype = create( Parent.prototype );
            extend( SpecialisedBinding.prototype, properties );
            SpecialisedBinding.extend = Binding.extend;
            return SpecialisedBinding;
        };
        return Binding;
    }( runloop, warn, create, extend, removeFromArray );
 
    /* virtualdom/items/Element/Binding/shared/handleDomEvent.js */
    var handleDomEvent = function handleChange() {
        this._ractive.binding.handleChange();
    };
 
    /* virtualdom/items/Element/Binding/ContentEditableBinding.js */
    var ContentEditableBinding = function( Binding, handleDomEvent ) {
 
        var ContentEditableBinding = Binding.extend( {
            getInitialValue: function() {
                return this.element.fragment ? this.element.fragment.toString() : '';
            },
            render: function() {
                var node = this.element.node;
                node.addEventListener( 'change', handleDomEvent, false );
                if ( !this.root.lazy ) {
                    node.addEventListener( 'input', handleDomEvent, false );
                    if ( node.attachEvent ) {
                        node.addEventListener( 'keyup', handleDomEvent, false );
                    }
                }
            },
            unrender: function() {
                var node = this.element.node;
                node.removeEventListener( 'change', handleDomEvent, false );
                node.removeEventListener( 'input', handleDomEvent, false );
                node.removeEventListener( 'keyup', handleDomEvent, false );
            },
            getValue: function() {
                return this.element.node.innerHTML;
            }
        } );
        return ContentEditableBinding;
    }( Binding, handleDomEvent );
 
    /* virtualdom/items/Element/Binding/shared/getSiblings.js */
    var getSiblings = function() {
 
        var sets = {};
        return function getSiblings( id, group, keypath ) {
            var hash = id + group + keypath;
            return sets[ hash ] || ( sets[ hash ] = [] );
        };
    }();
 
    /* virtualdom/items/Element/Binding/RadioBinding.js */
    var RadioBinding = function( runloop, removeFromArray, Binding, getSiblings, handleDomEvent ) {
 
        var RadioBinding = Binding.extend( {
            name: 'checked',
            init: function() {
                this.siblings = getSiblings( this.root._guid, 'radio', this.element.getAttribute( 'name' ) );
                this.siblings.push( this );
            },
            render: function() {
                var node = this.element.node;
                node.addEventListener( 'change', handleDomEvent, false );
                if ( node.attachEvent ) {
                    node.addEventListener( 'click', handleDomEvent, false );
                }
            },
            unrender: function() {
                var node = this.element.node;
                node.removeEventListener( 'change', handleDomEvent, false );
                node.removeEventListener( 'click', handleDomEvent, false );
            },
            handleChange: function() {
                runloop.start( this.root );
                this.siblings.forEach( function( binding ) {
                    binding.root.viewmodel.set( binding.keypath, binding.getValue() );
                } );
                runloop.end();
            },
            getValue: function() {
                return this.element.node.checked;
            },
            unbind: function() {
                removeFromArray( this.siblings, this );
            }
        } );
        return RadioBinding;
    }( runloop, removeFromArray, Binding, getSiblings, handleDomEvent );
 
    /* virtualdom/items/Element/Binding/RadioNameBinding.js */
    var RadioNameBinding = function( removeFromArray, Binding, handleDomEvent, getSiblings ) {
 
        var RadioNameBinding = Binding.extend( {
            name: 'name',
            init: function() {
                this.siblings = getSiblings( this.root._guid, 'radioname', this.keypath );
                this.siblings.push( this );
                this.radioName = true;
                // so that ractive.updateModel() knows what to do with this
                this.attribute.twoway = true;
            },
            getInitialValue: function() {
                if ( this.element.getAttribute( 'checked' ) ) {
                    return this.element.getAttribute( 'value' );
                }
            },
            render: function() {
                var node = this.element.node;
                node.name = '{{' + this.keypath + '}}';
                node.checked = this.root.viewmodel.get( this.keypath ) == this.element.getAttribute( 'value' );
                node.addEventListener( 'change', handleDomEvent, false );
                if ( node.attachEvent ) {
                    node.addEventListener( 'click', handleDomEvent, false );
                }
            },
            unrender: function() {
                var node = this.element.node;
                node.removeEventListener( 'change', handleDomEvent, false );
                node.removeEventListener( 'click', handleDomEvent, false );
            },
            getValue: function() {
                var node = this.element.node;
                return node._ractive ? node._ractive.value : node.value;
            },
            handleChange: function() {
                // If this <input> is the one that's checked, then the value of its
                // `name` keypath gets set to its value
                if ( this.element.node.checked ) {
                    Binding.prototype.handleChange.call( this );
                }
            },
            rebound: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                var node;
                Binding.prototype.rebound.call( this, indexRef, newIndex, oldKeypath, newKeypath );
                if ( node = this.element.node ) {
                    node.name = '{{' + this.keypath + '}}';
                }
            },
            unbind: function() {
                removeFromArray( this.siblings, this );
            }
        } );
        return RadioNameBinding;
    }( removeFromArray, Binding, handleDomEvent, getSiblings );
 
    /* virtualdom/items/Element/Binding/CheckboxNameBinding.js */
    var CheckboxNameBinding = function( isArray, removeFromArray, Binding, getSiblings, handleDomEvent ) {
 
        var CheckboxNameBinding = Binding.extend( {
            name: 'name',
            getInitialValue: function() {
                // This only gets called once per group (of inputs that
                // share a name), because it only gets called if there
                // isn't an initial value. By the same token, we can make
                // a note of that fact that there was no initial value,
                // and populate it using any `checked` attributes that
                // exist (which users should avoid, but which we should
                // support anyway to avoid breaking expectations)
                this.noInitialValue = true;
                return [];
            },
            init: function() {
                var existingValue, bindingValue, noInitialValue;
                this.checkboxName = true;
                // so that ractive.updateModel() knows what to do with this
                // Each input has a reference to an array containing it and its
                // siblings, as two-way binding depends on being able to ascertain
                // the status of all inputs within the group
                this.siblings = getSiblings( this.root._guid, 'checkboxes', this.keypath );
                this.siblings.push( this );
                if ( this.noInitialValue ) {
                    this.siblings.noInitialValue = true;
                }
                noInitialValue = this.siblings.noInitialValue;
                existingValue = this.root.viewmodel.get( this.keypath );
                bindingValue = this.element.getAttribute( 'value' );
                if ( noInitialValue ) {
                    this.isChecked = this.element.getAttribute( 'checked' );
                    if ( this.isChecked ) {
                        existingValue.push( bindingValue );
                    }
                } else {
                    this.isChecked = isArray( existingValue ) ? existingValue.indexOf( bindingValue ) !== -1 : existingValue === bindingValue;
                }
            },
            unbind: function() {
                removeFromArray( this.siblings, this );
            },
            render: function() {
                var node = this.element.node;
                node.name = '{{' + this.keypath + '}}';
                node.checked = this.isChecked;
                node.addEventListener( 'change', handleDomEvent, false );
                // in case of IE emergency, bind to click event as well
                if ( node.attachEvent ) {
                    node.addEventListener( 'click', handleDomEvent, false );
                }
            },
            unrender: function() {
                var node = this.element.node;
                node.removeEventListener( 'change', handleDomEvent, false );
                node.removeEventListener( 'click', handleDomEvent, false );
            },
            changed: function() {
                var wasChecked = !!this.isChecked;
                this.isChecked = this.element.node.checked;
                return this.isChecked === wasChecked;
            },
            handleChange: function() {
                this.isChecked = this.element.node.checked;
                Binding.prototype.handleChange.call( this );
            },
            getValue: function() {
                return this.siblings.filter( isChecked ).map( getValue );
            }
        } );
 
        function isChecked( binding ) {
            return binding.isChecked;
        }
 
        function getValue( binding ) {
            return binding.element.getAttribute( 'value' );
        }
        return CheckboxNameBinding;
    }( isArray, removeFromArray, Binding, getSiblings, handleDomEvent );
 
    /* virtualdom/items/Element/Binding/CheckboxBinding.js */
    var CheckboxBinding = function( Binding, handleDomEvent ) {
 
        var CheckboxBinding = Binding.extend( {
            name: 'checked',
            render: function() {
                var node = this.element.node;
                node.addEventListener( 'change', handleDomEvent, false );
                if ( node.attachEvent ) {
                    node.addEventListener( 'click', handleDomEvent, false );
                }
            },
            unrender: function() {
                var node = this.element.node;
                node.removeEventListener( 'change', handleDomEvent, false );
                node.removeEventListener( 'click', handleDomEvent, false );
            },
            getValue: function() {
                return this.element.node.checked;
            }
        } );
        return CheckboxBinding;
    }( Binding, handleDomEvent );
 
    /* virtualdom/items/Element/Binding/SelectBinding.js */
    var SelectBinding = function( runloop, Binding, handleDomEvent ) {
 
        var SelectBinding = Binding.extend( {
            getInitialValue: function() {
                var options = this.element.options,
                    len, i;
                i = len = options.length;
                if ( !len ) {
                    return;
                }
                // take the final selected option...
                while ( i-- ) {
                    if ( options[ i ].getAttribute( 'selected' ) ) {
                        return options[ i ].getAttribute( 'value' );
                    }
                }
                // or the first non-disabled option, if none are selected
                while ( i++ < len ) {
                    if ( !options[ i ].getAttribute( 'disabled' ) ) {
                        return options[ i ].getAttribute( 'value' );
                    }
                }
            },
            render: function() {
                this.element.node.addEventListener( 'change', handleDomEvent, false );
            },
            unrender: function() {
                this.element.node.removeEventListener( 'change', handleDomEvent, false );
            },
            // TODO this method is an anomaly... is it necessary?
            setValue: function( value ) {
                runloop.addViewmodel( this.root.viewmodel );
                this.root.viewmodel.set( this.keypath, value );
            },
            getValue: function() {
                var options, i, len, option, optionValue;
                options = this.element.node.options;
                len = options.length;
                for ( i = 0; i < len; i += 1 ) {
                    option = options[ i ];
                    if ( options[ i ].selected ) {
                        optionValue = option._ractive ? option._ractive.value : option.value;
                        return optionValue;
                    }
                }
            },
            forceUpdate: function() {
                var this$0 = this;
                var value = this.getValue();
                if ( value !== undefined ) {
                    this.attribute.locked = true;
                    runloop.addViewmodel( this.root.viewmodel );
                    runloop.scheduleTask( function() {
                        return this$0.attribute.locked = false;
                    } );
                    this.root.viewmodel.set( this.keypath, value );
                }
            }
        } );
        return SelectBinding;
    }( runloop, Binding, handleDomEvent );
 
    /* utils/arrayContentsMatch.js */
    var arrayContentsMatch = function( isArray ) {
 
        return function( a, b ) {
            var i;
            if ( !isArray( a ) || !isArray( b ) ) {
                return false;
            }
            if ( a.length !== b.length ) {
                return false;
            }
            i = a.length;
            while ( i-- ) {
                if ( a[ i ] !== b[ i ] ) {
                    return false;
                }
            }
            return true;
        };
    }( isArray );
 
    /* virtualdom/items/Element/Binding/MultipleSelectBinding.js */
    var MultipleSelectBinding = function( runloop, arrayContentsMatch, SelectBinding, handleDomEvent ) {
 
        var MultipleSelectBinding = SelectBinding.extend( {
            getInitialValue: function() {
                return this.element.options.filter( function( option ) {
                    return option.getAttribute( 'selected' );
                } ).map( function( option ) {
                    return option.getAttribute( 'value' );
                } );
            },
            render: function() {
                var valueFromModel;
                this.element.node.addEventListener( 'change', handleDomEvent, false );
                valueFromModel = this.root.viewmodel.get( this.keypath );
                if ( valueFromModel === undefined ) {
                    // get value from DOM, if possible
                    this.handleChange();
                }
            },
            unrender: function() {
                this.element.node.removeEventListener( 'change', handleDomEvent, false );
            },
            setValue: function() {
                throw new Error( 'TODO not implemented yet' );
            },
            getValue: function() {
                var selectedValues, options, i, len, option, optionValue;
                selectedValues = [];
                options = this.element.node.options;
                len = options.length;
                for ( i = 0; i < len; i += 1 ) {
                    option = options[ i ];
                    if ( option.selected ) {
                        optionValue = option._ractive ? option._ractive.value : option.value;
                        selectedValues.push( optionValue );
                    }
                }
                return selectedValues;
            },
            handleChange: function() {
                var attribute, previousValue, value;
                attribute = this.attribute;
                previousValue = attribute.value;
                value = this.getValue();
                if ( previousValue === undefined || !arrayContentsMatch( value, previousValue ) ) {
                    SelectBinding.prototype.handleChange.call( this );
                }
                return this;
            },
            forceUpdate: function() {
                var this$0 = this;
                var value = this.getValue();
                if ( value !== undefined ) {
                    this.attribute.locked = true;
                    runloop.addViewmodel( this.root.viewmodel );
                    runloop.scheduleTask( function() {
                        return this$0.attribute.locked = false;
                    } );
                    this.root.viewmodel.set( this.keypath, value );
                }
            },
            updateModel: function() {
                if ( this.attribute.value === undefined || !this.attribute.value.length ) {
                    this.root.viewmodel.set( this.keypath, this.initialValue );
                }
            }
        } );
        return MultipleSelectBinding;
    }( runloop, arrayContentsMatch, SelectBinding, handleDomEvent );
 
    /* virtualdom/items/Element/Binding/FileListBinding.js */
    var FileListBinding = function( Binding, handleDomEvent ) {
 
        var FileListBinding = Binding.extend( {
            render: function() {
                this.element.node.addEventListener( 'change', handleDomEvent, false );
            },
            unrender: function() {
                this.element.node.removeEventListener( 'change', handleDomEvent, false );
            },
            getValue: function() {
                return this.element.node.files;
            }
        } );
        return FileListBinding;
    }( Binding, handleDomEvent );
 
    /* virtualdom/items/Element/Binding/GenericBinding.js */
    var GenericBinding = function( Binding, handleDomEvent ) {
 
        var GenericBinding, getOptions;
        getOptions = {
            evaluateWrapped: true
        };
        GenericBinding = Binding.extend( {
            getInitialValue: function() {
                return '';
            },
            getValue: function() {
                return this.element.node.value;
            },
            render: function() {
                var node = this.element.node;
                node.addEventListener( 'change', handleDomEvent, false );
                if ( !this.root.lazy ) {
                    node.addEventListener( 'input', handleDomEvent, false );
                    if ( node.attachEvent ) {
                        node.addEventListener( 'keyup', handleDomEvent, false );
                    }
                }
                node.addEventListener( 'blur', handleBlur, false );
            },
            unrender: function() {
                var node = this.element.node;
                node.removeEventListener( 'change', handleDomEvent, false );
                node.removeEventListener( 'input', handleDomEvent, false );
                node.removeEventListener( 'keyup', handleDomEvent, false );
                node.removeEventListener( 'blur', handleBlur, false );
            }
        } );
        return GenericBinding;
 
        function handleBlur() {
            var value;
            handleDomEvent.call( this );
            value = this._ractive.root.viewmodel.get( this._ractive.binding.keypath, getOptions );
            this.value = value == undefined ? '' : value;
        }
    }( Binding, handleDomEvent );
 
    /* virtualdom/items/Element/Binding/NumericBinding.js */
    var NumericBinding = function( GenericBinding ) {
 
        return GenericBinding.extend( {
            getInitialValue: function() {
                return undefined;
            },
            getValue: function() {
                var value = parseFloat( this.element.node.value );
                return isNaN( value ) ? undefined : value;
            }
        } );
    }( GenericBinding );
 
    /* virtualdom/items/Element/prototype/init/createTwowayBinding.js */
    var virtualdom_items_Element$init_createTwowayBinding = function( log, ContentEditableBinding, RadioBinding, RadioNameBinding, CheckboxNameBinding, CheckboxBinding, SelectBinding, MultipleSelectBinding, FileListBinding, NumericBinding, GenericBinding ) {
 
        return function createTwowayBinding( element ) {
            var attributes = element.attributes,
                type, Binding, bindName, bindChecked;
            // if this is a late binding, and there's already one, it
            // needs to be torn down
            if ( element.binding ) {
                element.binding.teardown();
                element.binding = null;
            }
            // contenteditable
            if ( element.getAttribute( 'contenteditable' ) && isBindable( attributes.value ) ) {
                Binding = ContentEditableBinding;
            } else if ( element.name === 'input' ) {
                type = element.getAttribute( 'type' );
                if ( type === 'radio' || type === 'checkbox' ) {
                    bindName = isBindable( attributes.name );
                    bindChecked = isBindable( attributes.checked );
                    // we can either bind the name attribute, or the checked attribute - not both
                    if ( bindName && bindChecked ) {
                        log.error( {
                            message: 'badRadioInputBinding'
                        } );
                    }
                    if ( bindName ) {
                        Binding = type === 'radio' ? RadioNameBinding : CheckboxNameBinding;
                    } else if ( bindChecked ) {
                        Binding = type === 'radio' ? RadioBinding : CheckboxBinding;
                    }
                } else if ( type === 'file' && isBindable( attributes.value ) ) {
                    Binding = FileListBinding;
                } else if ( isBindable( attributes.value ) ) {
                    Binding = type === 'number' || type === 'range' ? NumericBinding : GenericBinding;
                }
            } else if ( element.name === 'select' && isBindable( attributes.value ) ) {
                Binding = element.getAttribute( 'multiple' ) ? MultipleSelectBinding : SelectBinding;
            } else if ( element.name === 'textarea' && isBindable( attributes.value ) ) {
                Binding = GenericBinding;
            }
            if ( Binding ) {
                return new Binding( element );
            }
        };
 
        function isBindable( attribute ) {
            return attribute && attribute.isBindable;
        }
    }( log, ContentEditableBinding, RadioBinding, RadioNameBinding, CheckboxNameBinding, CheckboxBinding, SelectBinding, MultipleSelectBinding, FileListBinding, NumericBinding, GenericBinding );
 
    /* virtualdom/items/Element/EventHandler/prototype/fire.js */
    var virtualdom_items_Element_EventHandler$fire = function EventHandler$fire( event ) {
        this.root.fire( this.action.toString().trim(), event );
    };
 
    /* virtualdom/items/Element/EventHandler/prototype/init.js */
    var virtualdom_items_Element_EventHandler$init = function( circular ) {
 
        var Fragment, getValueOptions = {
            args: true
        };
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        return function EventHandler$init( element, name, template ) {
            var action;
            this.element = element;
            this.root = element.root;
            this.name = name;
            this.proxies = [];
            // Get action ('foo' in 'on-click='foo')
            action = template.n || template;
            if ( typeof action !== 'string' ) {
                action = new Fragment( {
                    template: action,
                    root: this.root,
                    owner: this.element
                } );
            }
            this.action = action;
            // Get parameters
            if ( template.d ) {
                this.dynamicParams = new Fragment( {
                    template: template.d,
                    root: this.root,
                    owner: this.element
                } );
                this.fire = fireEventWithDynamicParams;
            } else if ( template.a ) {
                this.params = template.a;
                this.fire = fireEventWithParams;
            }
        };
 
        function fireEventWithParams( event ) {
            this.root.fire.apply( this.root, [
                this.action.toString().trim(),
                event
            ].concat( this.params ) );
        }
 
        function fireEventWithDynamicParams( event ) {
            var args = this.dynamicParams.getValue( getValueOptions );
            // need to strip [] from ends if a string!
            if ( typeof args === 'string' ) {
                args = args.substr( 1, args.length - 2 );
            }
            this.root.fire.apply( this.root, [
                this.action.toString().trim(),
                event
            ].concat( args ) );
        }
    }( circular );
 
    /* virtualdom/items/Element/EventHandler/prototype/rebind.js */
    var virtualdom_items_Element_EventHandler$rebind = function EventHandler$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
        if ( typeof this.action !== 'string' ) {
            this.action.rebind( indexRef, newIndex, oldKeypath, newKeypath );
        }
        if ( this.dynamicParams ) {
            this.dynamicParams.rebind( indexRef, newIndex, oldKeypath, newKeypath );
        }
    };
 
    /* virtualdom/items/Element/EventHandler/prototype/render.js */
    var virtualdom_items_Element_EventHandler$render = function( warn, config ) {
 
        var alreadyWarned = {},
            customHandlers = {};
        return function EventHandler$render() {
            var name = this.name,
                definition;
            this.node = this.element.node;
            if ( definition = config.registries.events.find( this.root, name ) ) {
                this.custom = definition( this.node, getCustomHandler( name ) );
            } else {
                // Looks like we're dealing with a standard DOM event... but let's check
                if ( !( 'on' + name in this.node ) && !( window && 'on' + name in window ) ) {
                    if ( !alreadyWarned[ name ] ) {
                        warn( 'Missing "' + this.name + '" event. You may need to download a plugin via http://docs.ractivejs.org/latest/plugins#events' );
                        alreadyWarned[ name ] = true;
                    }
                }
                this.node.addEventListener( name, genericHandler, false );
            }
            // store this on the node itself, so it can be retrieved by a
            // universal handler
            this.node._ractive.events[ name ] = this;
        };
 
        function genericHandler( event ) {
            var storage, handler;
            storage = this._ractive;
            handler = storage.events[ event.type ];
            handler.fire( {
                node: this,
                original: event,
                index: storage.index,
                keypath: storage.keypath,
                context: storage.root.get( storage.keypath )
            } );
        }
 
        function getCustomHandler( name ) {
            if ( !customHandlers[ name ] ) {
                customHandlers[ name ] = function( event ) {
                    var storage = event.node._ractive;
                    event.index = storage.index;
                    event.keypath = storage.keypath;
                    event.context = storage.root.get( storage.keypath );
                    storage.events[ name ].fire( event );
                };
            }
            return customHandlers[ name ];
        }
    }( warn, config );
 
    /* virtualdom/items/Element/EventHandler/prototype/teardown.js */
    var virtualdom_items_Element_EventHandler$teardown = function EventHandler$teardown() {
        // Tear down dynamic name
        if ( typeof this.action !== 'string' ) {
            this.action.teardown();
        }
        // Tear down dynamic parameters
        if ( this.dynamicParams ) {
            this.dynamicParams.teardown();
        }
    };
 
    /* virtualdom/items/Element/EventHandler/prototype/unrender.js */
    var virtualdom_items_Element_EventHandler$unrender = function EventHandler$unrender() {};
 
    /* virtualdom/items/Element/EventHandler/_EventHandler.js */
    var EventHandler = function( fire, init, rebind, render, teardown, unrender ) {
 
        var EventHandler = function( element, name, template ) {
            this.init( element, name, template );
        };
        EventHandler.prototype = {
            fire: fire,
            init: init,
            rebind: rebind,
            render: render,
            teardown: teardown,
            unrender: unrender
        };
        return EventHandler;
    }( virtualdom_items_Element_EventHandler$fire, virtualdom_items_Element_EventHandler$init, virtualdom_items_Element_EventHandler$rebind, virtualdom_items_Element_EventHandler$render, virtualdom_items_Element_EventHandler$teardown, virtualdom_items_Element_EventHandler$unrender );
 
    /* virtualdom/items/Element/prototype/init/createEventHandlers.js */
    var virtualdom_items_Element$init_createEventHandlers = function( EventHandler ) {
 
        return function( element, template ) {
            var i, name, names, handler, result = [];
            for ( name in template ) {
                if ( template.hasOwnProperty( name ) ) {
                    names = name.split( '-' );
                    i = names.length;
                    while ( i-- ) {
                        handler = new EventHandler( element, names[ i ], template[ name ] );
                        result.push( handler );
                    }
                }
            }
            return result;
        };
    }( EventHandler );
 
    /* virtualdom/items/Element/Decorator/_Decorator.js */
    var Decorator = function( log, circular, config ) {
 
        var Fragment, getValueOptions, Decorator;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        getValueOptions = {
            args: true
        };
        Decorator = function( element, template ) {
            var decorator = this,
                ractive, name, fragment;
            decorator.element = element;
            decorator.root = ractive = element.root;
            name = template.n || template;
            if ( typeof name !== 'string' ) {
                fragment = new Fragment( {
                    template: name,
                    root: ractive,
                    owner: element
                } );
                name = fragment.toString();
                fragment.unbind();
            }
            if ( template.a ) {
                decorator.params = template.a;
            } else if ( template.d ) {
                decorator.fragment = new Fragment( {
                    template: template.d,
                    root: ractive,
                    owner: element
                } );
                decorator.params = decorator.fragment.getValue( getValueOptions );
                decorator.fragment.bubble = function() {
                    this.dirtyArgs = this.dirtyValue = true;
                    decorator.params = this.getValue( getValueOptions );
                    if ( decorator.ready ) {
                        decorator.update();
                    }
                };
            }
            decorator.fn = config.registries.decorators.find( ractive, name );
            if ( !decorator.fn ) {
                log.error( {
                    debug: ractive.debug,
                    message: 'missingPlugin',
                    args: {
                        plugin: 'decorator',
                        name: name
                    }
                } );
            }
        };
        Decorator.prototype = {
            init: function() {
                var decorator = this,
                    node, result, args;
                node = decorator.element.node;
                if ( decorator.params ) {
                    args = [ node ].concat( decorator.params );
                    result = decorator.fn.apply( decorator.root, args );
                } else {
                    result = decorator.fn.call( decorator.root, node );
                }
                if ( !result || !result.teardown ) {
                    throw new Error( 'Decorator definition must return an object with a teardown method' );
                }
                // TODO does this make sense?
                decorator.actual = result;
                decorator.ready = true;
            },
            update: function() {
                if ( this.actual.update ) {
                    this.actual.update.apply( this.root, this.params );
                } else {
                    this.actual.teardown( true );
                    this.init();
                }
            },
            teardown: function( updating ) {
                this.actual.teardown();
                if ( !updating && this.fragment ) {
                    this.fragment.unbind();
                }
            }
        };
        return Decorator;
    }( log, circular, config );
 
    /* virtualdom/items/Element/special/select/sync.js */
    var sync = function( toArray ) {
 
        return function syncSelect( selectElement ) {
            var selectNode, selectValue, isMultiple, options, optionWasSelected;
            selectNode = selectElement.node;
            if ( !selectNode ) {
                return;
            }
            options = toArray( selectNode.options );
            selectValue = selectElement.getAttribute( 'value' );
            isMultiple = selectElement.getAttribute( 'multiple' );
            // If the <select> has a specified value, that should override
            // these options
            if ( selectValue !== undefined ) {
                options.forEach( function( o ) {
                    var optionValue, shouldSelect;
                    optionValue = o._ractive ? o._ractive.value : o.value;
                    shouldSelect = isMultiple ? valueContains( selectValue, optionValue ) : selectValue == optionValue;
                    if ( shouldSelect ) {
                        optionWasSelected = true;
                    }
                    o.selected = shouldSelect;
                } );
                if ( !optionWasSelected ) {
                    if ( options[ 0 ] ) {
                        options[ 0 ].selected = true;
                    }
                    if ( selectElement.binding ) {
                        selectElement.binding.forceUpdate();
                    }
                }
            } else if ( selectElement.binding ) {
                selectElement.binding.forceUpdate();
            }
        };
 
        function valueContains( selectValue, optionValue ) {
            var i = selectValue.length;
            while ( i-- ) {
                if ( selectValue[ i ] == optionValue ) {
                    return true;
                }
            }
        }
    }( toArray );
 
    /* virtualdom/items/Element/special/select/bubble.js */
    var bubble = function( runloop, syncSelect ) {
 
        return function bubbleSelect() {
            var this$0 = this;
            if ( !this.dirty ) {
                this.dirty = true;
                runloop.scheduleTask( function() {
                    syncSelect( this$0 );
                    this$0.dirty = false;
                } );
            }
            this.parentFragment.bubble();
        };
    }( runloop, sync );
 
    /* virtualdom/items/Element/special/option/findParentSelect.js */
    var findParentSelect = function findParentSelect( element ) {
        do {
            if ( element.name === 'select' ) {
                return element;
            }
        } while ( element = element.parent );
    };
 
    /* virtualdom/items/Element/special/option/init.js */
    var init = function( findParentSelect ) {
 
        return function initOption( option, template ) {
            option.select = findParentSelect( option.parent );
            option.select.options.push( option );
            // If the value attribute is missing, use the element's content
            if ( !template.a ) {
                template.a = {};
            }
            // ...as long as it isn't disabled
            if ( !template.a.value && !template.a.hasOwnProperty( 'disabled' ) ) {
                template.a.value = template.f;
            }
            // If there is a `selected` attribute, but the <select>
            // already has a value, delete it
            if ( 'selected' in template.a && option.select.getAttribute( 'value' ) !== undefined ) {
                delete template.a.selected;
            }
        };
    }( findParentSelect );
 
    /* virtualdom/items/Element/prototype/init.js */
    var virtualdom_items_Element$init = function( types, namespaces, enforceCase, getElementNamespace, createAttributes, createTwowayBinding, createEventHandlers, Decorator, bubbleSelect, initOption, circular ) {
 
        var Fragment;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        return function Element$init( options ) {
            var parentFragment, template, namespace, ractive, binding, bindings;
            this.type = types.ELEMENT;
            // stuff we'll need later
            parentFragment = this.parentFragment = options.parentFragment;
            template = this.template = options.template;
            this.parent = options.pElement || parentFragment.pElement;
            this.root = ractive = parentFragment.root;
            this.index = options.index;
            this.namespace = getElementNamespace( template, this.parent );
            this.name = namespace !== namespaces.html ? enforceCase( template.e ) : template.e;
            // Special case - <option> elements
            if ( this.name === 'option' ) {
                initOption( this, template );
            }
            // Special case - <select> elements
            if ( this.name === 'select' ) {
                this.options = [];
                this.bubble = bubbleSelect;
            }
            // create attributes
            this.attributes = createAttributes( this, template.a );
            // append children, if there are any
            if ( template.f ) {
                this.fragment = new Fragment( {
                    template: template.f,
                    root: ractive,
                    owner: this,
                    pElement: this
                } );
            }
            // create twoway binding
            if ( ractive.twoway && ( binding = createTwowayBinding( this, template.a ) ) ) {
                this.binding = binding;
                // register this with the root, so that we can do ractive.updateModel()
                bindings = this.root._twowayBindings[ binding.keypath ] || ( this.root._twowayBindings[ binding.keypath ] = [] );
                bindings.push( binding );
            }
            // create event proxies
            if ( template.v ) {
                this.eventHandlers = createEventHandlers( this, template.v );
            }
            // create decorator
            if ( template.o ) {
                this.decorator = new Decorator( this, template.o );
            }
            // create transitions
            this.intro = template.t0 || template.t1;
            this.outro = template.t0 || template.t2;
        };
    }( types, namespaces, enforceCase, virtualdom_items_Element$init_getElementNamespace, virtualdom_items_Element$init_createAttributes, virtualdom_items_Element$init_createTwowayBinding, virtualdom_items_Element$init_createEventHandlers, Decorator, bubble, init, circular );
 
    /* virtualdom/items/shared/utils/startsWith.js */
    var startsWith = function( startsWithKeypath ) {
 
        return function startsWith( target, keypath ) {
            return target === keypath || startsWithKeypath( target, keypath );
        };
    }( startsWithKeypath );
 
    /* virtualdom/items/shared/utils/assignNewKeypath.js */
    var assignNewKeypath = function( startsWith, getNewKeypath ) {
 
        return function assignNewKeypath( target, property, oldKeypath, newKeypath ) {
            var existingKeypath = target[ property ];
            if ( !existingKeypath || startsWith( existingKeypath, newKeypath ) || !startsWith( existingKeypath, oldKeypath ) ) {
                return;
            }
            target[ property ] = getNewKeypath( existingKeypath, oldKeypath, newKeypath );
        };
    }( startsWith, getNewKeypath );
 
    /* virtualdom/items/Element/prototype/rebind.js */
    var virtualdom_items_Element$rebind = function( assignNewKeypath ) {
 
        return function Element$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
            var i, storage, liveQueries, ractive;
            if ( this.attributes ) {
                this.attributes.forEach( rebind );
            }
            if ( this.eventHandlers ) {
                this.eventHandlers.forEach( rebind );
            }
            // rebind children
            if ( this.fragment ) {
                rebind( this.fragment );
            }
            // Update live queries, if necessary
            if ( liveQueries = this.liveQueries ) {
                ractive = this.root;
                i = liveQueries.length;
                while ( i-- ) {
                    liveQueries[ i ]._makeDirty();
                }
            }
            if ( this.node && ( storage = this.node._ractive ) ) {
                // adjust keypath if needed
                assignNewKeypath( storage, 'keypath', oldKeypath, newKeypath );
                if ( indexRef != undefined ) {
                    storage.index[ indexRef ] = newIndex;
                }
            }
 
            function rebind( thing ) {
                thing.rebind( indexRef, newIndex, oldKeypath, newKeypath );
            }
        };
    }( assignNewKeypath );
 
    /* virtualdom/items/Element/special/img/render.js */
    var render = function renderImage( img ) {
        var width, height, loadHandler;
        // if this is an <img>, and we're in a crap browser, we may need to prevent it
        // from overriding width and height when it loads the src
        if ( ( width = img.getAttribute( 'width' ) ) || ( height = img.getAttribute( 'height' ) ) ) {
            img.node.addEventListener( 'load', loadHandler = function() {
                if ( width ) {
                    img.node.width = width.value;
                }
                if ( height ) {
                    img.node.height = height.value;
                }
                img.node.removeEventListener( 'load', loadHandler, false );
            }, false );
        }
    };
 
    /* virtualdom/items/Element/Transition/prototype/init.js */
    var virtualdom_items_Element_Transition$init = function( log, config, circular ) {
 
        var Fragment, getValueOptions = {};
        // TODO what are the options?
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        return function Transition$init( element, template, isIntro ) {
            var t = this,
                ractive, name, fragment;
            t.element = element;
            t.root = ractive = element.root;
            t.isIntro = isIntro;
            name = template.n || template;
            if ( typeof name !== 'string' ) {
                fragment = new Fragment( {
                    template: name,
                    root: ractive,
                    owner: element
                } );
                name = fragment.toString();
                fragment.unbind();
            }
            t.name = name;
            if ( template.a ) {
                t.params = template.a;
            } else if ( template.d ) {
                // TODO is there a way to interpret dynamic arguments without all the
                // 'dependency thrashing'?
                fragment = new Fragment( {
                    template: template.d,
                    root: ractive,
                    owner: element
                } );
                t.params = fragment.getValue( getValueOptions );
                fragment.unbind();
            }
            t._fn = config.registries.transitions.find( ractive, name );
            if ( !t._fn ) {
                log.error( {
                    debug: ractive.debug,
                    message: 'missingPlugin',
                    args: {
                        plugin: 'transition',
                        name: name
                    }
                } );
                return;
            }
        };
    }( log, config, circular );
 
    /* utils/camelCase.js */
    var camelCase = function( hyphenatedStr ) {
        return hyphenatedStr.replace( /-([a-zA-Z])/g, function( match, $1 ) {
            return $1.toUpperCase();
        } );
    };
 
    /* virtualdom/items/Element/Transition/helpers/prefix.js */
    var prefix = function( isClient, vendors, createElement, camelCase ) {
 
        var prefix, prefixCache, testStyle;
        if ( !isClient ) {
            prefix = null;
        } else {
            prefixCache = {};
            testStyle = createElement( 'div' ).style;
            prefix = function( prop ) {
                var i, vendor, capped;
                prop = camelCase( prop );
                if ( !prefixCache[ prop ] ) {
                    if ( testStyle[ prop ] !== undefined ) {
                        prefixCache[ prop ] = prop;
                    } else {
                        // test vendors...
                        capped = prop.charAt( 0 ).toUpperCase() + prop.substring( 1 );
                        i = vendors.length;
                        while ( i-- ) {
                            vendor = vendors[ i ];
                            if ( testStyle[ vendor + capped ] !== undefined ) {
                                prefixCache[ prop ] = vendor + capped;
                                break;
                            }
                        }
                    }
                }
                return prefixCache[ prop ];
            };
        }
        return prefix;
    }( isClient, vendors, createElement, camelCase );
 
    /* virtualdom/items/Element/Transition/prototype/getStyle.js */
    var virtualdom_items_Element_Transition$getStyle = function( legacy, isClient, isArray, prefix ) {
 
        var getStyle, getComputedStyle;
        if ( !isClient ) {
            getStyle = null;
        } else {
            getComputedStyle = window.getComputedStyle || legacy.getComputedStyle;
            getStyle = function( props ) {
                var computedStyle, styles, i, prop, value;
                computedStyle = getComputedStyle( this.node );
                if ( typeof props === 'string' ) {
                    value = computedStyle[ prefix( props ) ];
                    if ( value === '0px' ) {
                        value = 0;
                    }
                    return value;
                }
                if ( !isArray( props ) ) {
                    throw new Error( 'Transition$getStyle must be passed a string, or an array of strings representing CSS properties' );
                }
                styles = {};
                i = props.length;
                while ( i-- ) {
                    prop = props[ i ];
                    value = computedStyle[ prefix( prop ) ];
                    if ( value === '0px' ) {
                        value = 0;
                    }
                    styles[ prop ] = value;
                }
                return styles;
            };
        }
        return getStyle;
    }( legacy, isClient, isArray, prefix );
 
    /* virtualdom/items/Element/Transition/prototype/setStyle.js */
    var virtualdom_items_Element_Transition$setStyle = function( prefix ) {
 
        return function( style, value ) {
            var prop;
            if ( typeof style === 'string' ) {
                this.node.style[ prefix( style ) ] = value;
            } else {
                for ( prop in style ) {
                    if ( style.hasOwnProperty( prop ) ) {
                        this.node.style[ prefix( prop ) ] = style[ prop ];
                    }
                }
            }
            return this;
        };
    }( prefix );
 
    /* shared/Ticker.js */
    var Ticker = function( warn, getTime, animations ) {
 
        // TODO what happens if a transition is aborted?
        // TODO use this with Animation to dedupe some code?
        var Ticker = function( options ) {
            var easing;
            this.duration = options.duration;
            this.step = options.step;
            this.complete = options.complete;
            // easing
            if ( typeof options.easing === 'string' ) {
                easing = options.root.easing[ options.easing ];
                if ( !easing ) {
                    warn( 'Missing easing function ("' + options.easing + '"). You may need to download a plugin from [TODO]' );
                    easing = linear;
                }
            } else if ( typeof options.easing === 'function' ) {
                easing = options.easing;
            } else {
                easing = linear;
            }
            this.easing = easing;
            this.start = getTime();
            this.end = this.start + this.duration;
            this.running = true;
            animations.add( this );
        };
        Ticker.prototype = {
            tick: function( now ) {
                var elapsed, eased;
                if ( !this.running ) {
                    return false;
                }
                if ( now > this.end ) {
                    if ( this.step ) {
                        this.step( 1 );
                    }
                    if ( this.complete ) {
                        this.complete( 1 );
                    }
                    return false;
                }
                elapsed = now - this.start;
                eased = this.easing( elapsed / this.duration );
                if ( this.step ) {
                    this.step( eased );
                }
                return true;
            },
            stop: function() {
                if ( this.abort ) {
                    this.abort();
                }
                this.running = false;
            }
        };
        return Ticker;
 
        function linear( t ) {
            return t;
        }
    }( warn, getTime, animations );
 
    /* virtualdom/items/Element/Transition/helpers/unprefix.js */
    var unprefix = function( vendors ) {
 
        var unprefixPattern = new RegExp( '^-(?:' + vendors.join( '|' ) + ')-' );
        return function( prop ) {
            return prop.replace( unprefixPattern, '' );
        };
    }( vendors );
 
    /* virtualdom/items/Element/Transition/helpers/hyphenate.js */
    var hyphenate = function( vendors ) {
 
        var vendorPattern = new RegExp( '^(?:' + vendors.join( '|' ) + ')([A-Z])' );
        return function( str ) {
            var hyphenated;
            if ( !str ) {
                return '';
            }
            if ( vendorPattern.test( str ) ) {
                str = '-' + str;
            }
            hyphenated = str.replace( /[A-Z]/g, function( match ) {
                return '-' + match.toLowerCase();
            } );
            return hyphenated;
        };
    }( vendors );
 
    /* virtualdom/items/Element/Transition/prototype/animateStyle/createTransitions.js */
    var virtualdom_items_Element_Transition$animateStyle_createTransitions = function( isClient, warn, createElement, camelCase, interpolate, Ticker, prefix, unprefix, hyphenate ) {
 
        var createTransitions, testStyle, TRANSITION, TRANSITIONEND, CSS_TRANSITIONS_ENABLED, TRANSITION_DURATION, TRANSITION_PROPERTY, TRANSITION_TIMING_FUNCTION, canUseCssTransitions = {},
            cannotUseCssTransitions = {};
        if ( !isClient ) {
            createTransitions = null;
        } else {
            testStyle = createElement( 'div' ).style;
            // determine some facts about our environment
            ( function() {
                if ( testStyle.transition !== undefined ) {
                    TRANSITION = 'transition';
                    TRANSITIONEND = 'transitionend';
                    CSS_TRANSITIONS_ENABLED = true;
                } else if ( testStyle.webkitTransition !== undefined ) {
                    TRANSITION = 'webkitTransition';
                    TRANSITIONEND = 'webkitTransitionEnd';
                    CSS_TRANSITIONS_ENABLED = true;
                } else {
                    CSS_TRANSITIONS_ENABLED = false;
                }
            }() );
            if ( TRANSITION ) {
                TRANSITION_DURATION = TRANSITION + 'Duration';
                TRANSITION_PROPERTY = TRANSITION + 'Property';
                TRANSITION_TIMING_FUNCTION = TRANSITION + 'TimingFunction';
            }
            createTransitions = function( t, to, options, changedProperties, resolve ) {
                // Wait a beat (otherwise the target styles will be applied immediately)
                // TODO use a fastdom-style mechanism?
                setTimeout( function() {
                    var hashPrefix, jsTransitionsComplete, cssTransitionsComplete, checkComplete, transitionEndHandler;
                    checkComplete = function() {
                        if ( jsTransitionsComplete && cssTransitionsComplete ) {
                            t.root.fire( t.name + ':end', t.node, t.isIntro );
                            resolve();
                        }
                    };
                    // this is used to keep track of which elements can use CSS to animate
                    // which properties
                    hashPrefix = ( t.node.namespaceURI || '' ) + t.node.tagName;
                    t.node.style[ TRANSITION_PROPERTY ] = changedProperties.map( prefix ).map( hyphenate ).join( ',' );
                    t.node.style[ TRANSITION_TIMING_FUNCTION ] = hyphenate( options.easing || 'linear' );
                    t.node.style[ TRANSITION_DURATION ] = options.duration / 1000 + 's';
                    transitionEndHandler = function( event ) {
                        var index;
                        index = changedProperties.indexOf( camelCase( unprefix( event.propertyName ) ) );
                        if ( index !== -1 ) {
                            changedProperties.splice( index, 1 );
                        }
                        if ( changedProperties.length ) {
                            // still transitioning...
                            return;
                        }
                        t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
                        cssTransitionsComplete = true;
                        checkComplete();
                    };
                    t.node.addEventListener( TRANSITIONEND, transitionEndHandler, false );
                    setTimeout( function() {
                        var i = changedProperties.length,
                            hash, originalValue, index, propertiesToTransitionInJs = [],
                            prop, suffix;
                        while ( i-- ) {
                            prop = changedProperties[ i ];
                            hash = hashPrefix + prop;
                            if ( CSS_TRANSITIONS_ENABLED && !cannotUseCssTransitions[ hash ] ) {
                                t.node.style[ prefix( prop ) ] = to[ prop ];
                                // If we're not sure if CSS transitions are supported for
                                // this tag/property combo, find out now
                                if ( !canUseCssTransitions[ hash ] ) {
                                    originalValue = t.getStyle( prop );
                                    // if this property is transitionable in this browser,
                                    // the current style will be different from the target style
                                    canUseCssTransitions[ hash ] = t.getStyle( prop ) != to[ prop ];
                                    cannotUseCssTransitions[ hash ] = !canUseCssTransitions[ hash ];
                                    // Reset, if we're going to use timers after all
                                    if ( cannotUseCssTransitions[ hash ] ) {
                                        t.node.style[ prefix( prop ) ] = originalValue;
                                    }
                                }
                            }
                            if ( !CSS_TRANSITIONS_ENABLED || cannotUseCssTransitions[ hash ] ) {
                                // we need to fall back to timer-based stuff
                                if ( originalValue === undefined ) {
                                    originalValue = t.getStyle( prop );
                                }
                                // need to remove this from changedProperties, otherwise transitionEndHandler
                                // will get confused
                                index = changedProperties.indexOf( prop );
                                if ( index === -1 ) {
                                    warn( 'Something very strange happened with transitions. If you see this message, please let @RactiveJS know. Thanks!' );
                                } else {
                                    changedProperties.splice( index, 1 );
                                }
                                // TODO Determine whether this property is animatable at all
                                suffix = /[^\d]*$/.exec( to[ prop ] )[ 0 ];
                                // ...then kick off a timer-based transition
                                propertiesToTransitionInJs.push( {
                                    name: prefix( prop ),
                                    interpolator: interpolate( parseFloat( originalValue ), parseFloat( to[ prop ] ) ),
                                    suffix: suffix
                                } );
                            }
                        }
                        // javascript transitions
                        if ( propertiesToTransitionInJs.length ) {
                            new Ticker( {
                                root: t.root,
                                duration: options.duration,
                                easing: camelCase( options.easing || '' ),
                                step: function( pos ) {
                                    var prop, i;
                                    i = propertiesToTransitionInJs.length;
                                    while ( i-- ) {
                                        prop = propertiesToTransitionInJs[ i ];
                                        t.node.style[ prop.name ] = prop.interpolator( pos ) + prop.suffix;
                                    }
                                },
                                complete: function() {
                                    jsTransitionsComplete = true;
                                    checkComplete();
                                }
                            } );
                        } else {
                            jsTransitionsComplete = true;
                        }
                        if ( !changedProperties.length ) {
                            // We need to cancel the transitionEndHandler, and deal with
                            // the fact that it will never fire
                            t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
                            cssTransitionsComplete = true;
                            checkComplete();
                        }
                    }, 0 );
                }, options.delay || 0 );
            };
        }
        return createTransitions;
    }( isClient, warn, createElement, camelCase, interpolate, Ticker, prefix, unprefix, hyphenate );
 
    /* virtualdom/items/Element/Transition/prototype/animateStyle/visibility.js */
    var virtualdom_items_Element_Transition$animateStyle_visibility = function( vendors ) {
 
        var hidden, vendor, prefix, i, visibility;
        if ( typeof document !== 'undefined' ) {
            hidden = 'hidden';
            visibility = {};
            if ( hidden in document ) {
                prefix = '';
            } else {
                i = vendors.length;
                while ( i-- ) {
                    vendor = vendors[ i ];
                    hidden = vendor + 'Hidden';
                    if ( hidden in document ) {
                        prefix = vendor;
                    }
                }
            }
            if ( prefix !== undefined ) {
                document.addEventListener( prefix + 'visibilitychange', onChange );
                // initialise
                onChange();
            } else {
                // gah, we're in an old browser
                if ( 'onfocusout' in document ) {
                    document.addEventListener( 'focusout', onHide );
                    document.addEventListener( 'focusin', onShow );
                } else {
                    window.addEventListener( 'pagehide', onHide );
                    window.addEventListener( 'blur', onHide );
                    window.addEventListener( 'pageshow', onShow );
                    window.addEventListener( 'focus', onShow );
                }
                visibility.hidden = false;
            }
        }
 
        function onChange() {
            visibility.hidden = document[ hidden ];
        }
 
        function onHide() {
            visibility.hidden = true;
        }
 
        function onShow() {
            visibility.hidden = false;
        }
        return visibility;
    }( vendors );
 
    /* virtualdom/items/Element/Transition/prototype/animateStyle/_animateStyle.js */
    var virtualdom_items_Element_Transition$animateStyle__animateStyle = function( legacy, isClient, warn, Promise, prefix, createTransitions, visibility ) {
 
        var animateStyle, getComputedStyle, resolved;
        if ( !isClient ) {
            animateStyle = null;
        } else {
            getComputedStyle = window.getComputedStyle || legacy.getComputedStyle;
            animateStyle = function( style, value, options, complete ) {
                var t = this,
                    to;
                // Special case - page isn't visible. Don't animate anything, because
                // that way you'll never get CSS transitionend events
                if ( visibility.hidden ) {
                    this.setStyle( style, value );
                    return resolved || ( resolved = Promise.resolve() );
                }
                if ( typeof style === 'string' ) {
                    to = {};
                    to[ style ] = value;
                } else {
                    to = style;
                    // shuffle arguments
                    complete = options;
                    options = value;
                }
                // As of 0.3.9, transition authors should supply an `option` object with
                // `duration` and `easing` properties (and optional `delay`), plus a
                // callback function that gets called after the animation completes
                // TODO remove this check in a future version
                if ( !options ) {
                    warn( 'The "' + t.name + '" transition does not supply an options object to `t.animateStyle()`. This will break in a future version of Ractive. For more info see https://github.com/RactiveJS/Ractive/issues/340' );
                    options = t;
                    complete = t.complete;
                }
                var promise = new Promise( function( resolve ) {
                    var propertyNames, changedProperties, computedStyle, current, from, i, prop;
                    // Edge case - if duration is zero, set style synchronously and complete
                    if ( !options.duration ) {
                        t.setStyle( to );
                        resolve();
                        return;
                    }
                    // Get a list of the properties we're animating
                    propertyNames = Object.keys( to );
                    changedProperties = [];
                    // Store the current styles
                    computedStyle = getComputedStyle( t.node );
                    from = {};
                    i = propertyNames.length;
                    while ( i-- ) {
                        prop = propertyNames[ i ];
                        current = computedStyle[ prefix( prop ) ];
                        if ( current === '0px' ) {
                            current = 0;
                        }
                        // we need to know if we're actually changing anything
                        if ( current != to[ prop ] ) {
                            // use != instead of !==, so we can compare strings with numbers
                            changedProperties.push( prop );
                            // make the computed style explicit, so we can animate where
                            // e.g. height='auto'
                            t.node.style[ prefix( prop ) ] = current;
                        }
                    }
                    // If we're not actually changing anything, the transitionend event
                    // will never fire! So we complete early
                    if ( !changedProperties.length ) {
                        resolve();
                        return;
                    }
                    createTransitions( t, to, options, changedProperties, resolve );
                } );
                // If a callback was supplied, do the honours
                // TODO remove this check in future
                if ( complete ) {
                    warn( 't.animateStyle returns a Promise as of 0.4.0. Transition authors should do t.animateStyle(...).then(callback)' );
                    promise.then( complete );
                }
                return promise;
            };
        }
        return animateStyle;
    }( legacy, isClient, warn, Promise, prefix, virtualdom_items_Element_Transition$animateStyle_createTransitions, virtualdom_items_Element_Transition$animateStyle_visibility );
 
    /* utils/fillGaps.js */
    var fillGaps = function( target, source ) {
        var key;
        for ( key in source ) {
            if ( source.hasOwnProperty( key ) && !( key in target ) ) {
                target[ key ] = source[ key ];
            }
        }
        return target;
    };
 
    /* virtualdom/items/Element/Transition/prototype/processParams.js */
    var virtualdom_items_Element_Transition$processParams = function( fillGaps ) {
 
        return function( params, defaults ) {
            if ( typeof params === 'number' ) {
                params = {
                    duration: params
                };
            } else if ( typeof params === 'string' ) {
                if ( params === 'slow' ) {
                    params = {
                        duration: 600
                    };
                } else if ( params === 'fast' ) {
                    params = {
                        duration: 200
                    };
                } else {
                    params = {
                        duration: 400
                    };
                }
            } else if ( !params ) {
                params = {};
            }
            return fillGaps( params, defaults );
        };
    }( fillGaps );
 
    /* virtualdom/items/Element/Transition/prototype/start.js */
    var virtualdom_items_Element_Transition$start = function() {
 
        return function Transition$start() {
            var t = this,
                node, originalStyle;
            node = t.node = t.element.node;
            originalStyle = node.getAttribute( 'style' );
            // create t.complete() - we don't want this on the prototype,
            // because we don't want `this` silliness when passing it as
            // an argument
            t.complete = function( noReset ) {
                if ( !noReset && t.isIntro ) {
                    resetStyle( node, originalStyle );
                }
                node._ractive.transition = null;
                t._manager.remove( t );
            };
            // If the transition function doesn't exist, abort
            if ( !t._fn ) {
                t.complete();
                return;
            }
            t._fn.apply( t.root, [ t ].concat( t.params ) );
        };
 
        function resetStyle( node, style ) {
            if ( style ) {
                node.setAttribute( 'style', style );
            } else {
                // Next line is necessary, to remove empty style attribute!
                // See http://stackoverflow.com/a/7167553
                node.getAttribute( 'style' );
                node.removeAttribute( 'style' );
            }
        }
    }();
 
    /* virtualdom/items/Element/Transition/_Transition.js */
    var Transition = function( init, getStyle, setStyle, animateStyle, processParams, start, circular ) {
 
        var Fragment, getValueOptions, Transition;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        getValueOptions = {
            args: true
        };
        Transition = function( owner, template, isIntro ) {
            this.init( owner, template, isIntro );
        };
        Transition.prototype = {
            init: init,
            start: start,
            getStyle: getStyle,
            setStyle: setStyle,
            animateStyle: animateStyle,
            processParams: processParams
        };
        return Transition;
    }( virtualdom_items_Element_Transition$init, virtualdom_items_Element_Transition$getStyle, virtualdom_items_Element_Transition$setStyle, virtualdom_items_Element_Transition$animateStyle__animateStyle, virtualdom_items_Element_Transition$processParams, virtualdom_items_Element_Transition$start, circular );
 
    /* virtualdom/items/Element/prototype/render.js */
    var virtualdom_items_Element$render = function( isArray, warn, create, createElement, defineProperty, noop, runloop, getInnerContext, renderImage, Transition ) {
 
        var updateCss, updateScript;
        updateCss = function() {
            var node = this.node,
                content = this.fragment.toString( false );
            if ( node.styleSheet ) {
                node.styleSheet.cssText = content;
            } else {
                while ( node.hasChildNodes() ) {
                    node.removeChild( node.firstChild );
                }
                node.appendChild( document.createTextNode( content ) );
            }
        };
        updateScript = function() {
            if ( !this.node.type || this.node.type === 'text/javascript' ) {
                warn( 'Script tag was updated. This does not cause the code to be re-evaluated!' );
            }
            this.node.text = this.fragment.toString( false );
        };
        return function Element$render() {
            var this$0 = this;
            var root = this.root,
                node;
            node = this.node = createElement( this.name, this.namespace );
            // Is this a top-level node of a component? If so, we may need to add
            // a data-rvcguid attribute, for CSS encapsulation
            // NOTE: css no longer copied to instance, so we check constructor.css -
            // we can enhance to handle instance, but this is more "correct" with current
            // functionality
            if ( root.constructor.css && this.parentFragment.getNode() === root.el ) {
                this.node.setAttribute( 'data-rvcguid', root.constructor._guid );
            }
            // Add _ractive property to the node - we use this object to store stuff
            // related to proxy events, two-way bindings etc
            defineProperty( this.node, '_ractive', {
                value: {
                    proxy: this,
                    keypath: getInnerContext( this.parentFragment ),
                    index: this.parentFragment.indexRefs,
                    events: create( null ),
                    root: root
                }
            } );
            // Render attributes
            this.attributes.forEach( function( a ) {
                return a.render( node );
            } );
            // Render children
            if ( this.fragment ) {
                // Special case - <script> element
                if ( this.name === 'script' ) {
                    this.bubble = updateScript;
                    this.node.text = this.fragment.toString( false );
                    // bypass warning initially
                    this.fragment.unrender = noop;
                } else if ( this.name === 'style' ) {
                    this.bubble = updateCss;
                    this.bubble();
                    this.fragment.unrender = noop;
                } else if ( this.binding && this.getAttribute( 'contenteditable' ) ) {
                    this.fragment.unrender = noop;
                } else {
                    this.node.appendChild( this.fragment.render() );
                }
            }
            // Add proxy event handlers
            if ( this.eventHandlers ) {
                this.eventHandlers.forEach( function( h ) {
                    return h.render();
                } );
            }
            // deal with two-way bindings
            if ( this.binding ) {
                this.binding.render();
                this.node._ractive.binding = this.binding;
            }
            // Special case: if this is an <img>, and we're in a crap browser, we may
            // need to prevent it from overriding width and height when it loads the src
            if ( this.name === 'img' ) {
                renderImage( this );
            }
            // apply decorator(s)
            if ( this.decorator && this.decorator.fn ) {
                runloop.scheduleTask( function() {
                    this$0.decorator.init();
                } );
            }
            // trigger intro transition
            if ( root.transitionsEnabled && this.intro ) {
                var transition = new Transition( this, this.intro, true );
                runloop.registerTransition( transition );
                runloop.scheduleTask( function() {
                    return transition.start();
                } );
            }
            if ( this.name === 'option' ) {
                processOption( this );
            }
            if ( this.node.autofocus ) {
                // Special case. Some browsers (*cough* Firefix *cough*) have a problem
                // with dynamically-generated elements having autofocus, and they won't
                // allow you to programmatically focus the element until it's in the DOM
                runloop.scheduleTask( function() {
                    return this$0.node.focus();
                } );
            }
            updateLiveQueries( this );
            return this.node;
        };
 
        function processOption( option ) {
            var optionValue, selectValue, i;
            selectValue = option.select.getAttribute( 'value' );
            if ( selectValue === undefined ) {
                return;
            }
            optionValue = option.getAttribute( 'value' );
            if ( option.select.node.multiple && isArray( selectValue ) ) {
                i = selectValue.length;
                while ( i-- ) {
                    if ( optionValue == selectValue[ i ] ) {
                        option.node.selected = true;
                        break;
                    }
                }
            } else {
                option.node.selected = optionValue == selectValue;
            }
        }
 
        function updateLiveQueries( element ) {
            var instance, liveQueries, i, selector, query;
            // Does this need to be added to any live queries?
            instance = element.root;
            do {
                liveQueries = instance._liveQueries;
                i = liveQueries.length;
                while ( i-- ) {
                    selector = liveQueries[ i ];
                    query = liveQueries[ '_' + selector ];
                    if ( query._test( element ) ) {
                        // keep register of applicable selectors, for when we teardown
                        ( element.liveQueries || ( element.liveQueries = [] ) ).push( query );
                    }
                }
            } while ( instance = instance._parent );
        }
    }( isArray, warn, create, createElement, defineProperty, noop, runloop, getInnerContext, render, Transition );
 
    /* config/voidElementNames.js */
    var voidElementNames = function() {
 
        var voidElementNames = /^(?:area|base|br|col|command|doctype|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
        return voidElementNames;
    }();
 
    /* virtualdom/items/Element/prototype/toString.js */
    var virtualdom_items_Element$toString = function( voidElementNames, isArray ) {
 
        return function() {
            var str, escape;
            str = '<' + ( this.template.y ? '!DOCTYPE' : this.template.e );
            str += this.attributes.map( stringifyAttribute ).join( '' );
            // Special case - selected options
            if ( this.name === 'option' && optionIsSelected( this ) ) {
                str += ' selected';
            }
            // Special case - two-way radio name bindings
            if ( this.name === 'input' && inputIsCheckedRadio( this ) ) {
                str += ' checked';
            }
            str += '>';
            if ( this.fragment ) {
                escape = this.name !== 'script' && this.name !== 'style';
                str += this.fragment.toString( escape );
            }
            // add a closing tag if this isn't a void element
            if ( !voidElementNames.test( this.template.e ) ) {
                str += '</' + this.template.e + '>';
            }
            return str;
        };
 
        function optionIsSelected( element ) {
            var optionValue, selectValue, i;
            optionValue = element.getAttribute( 'value' );
            if ( optionValue === undefined ) {
                return false;
            }
            selectValue = element.select.getAttribute( 'value' );
            if ( selectValue == optionValue ) {
                return true;
            }
            if ( element.select.getAttribute( 'multiple' ) && isArray( selectValue ) ) {
                i = selectValue.length;
                while ( i-- ) {
                    if ( selectValue[ i ] == optionValue ) {
                        return true;
                    }
                }
            }
        }
 
        function inputIsCheckedRadio( element ) {
            var attributes, typeAttribute, valueAttribute, nameAttribute;
            attributes = element.attributes;
            typeAttribute = attributes.type;
            valueAttribute = attributes.value;
            nameAttribute = attributes.name;
            if ( !typeAttribute || typeAttribute.value !== 'radio' || !valueAttribute || !nameAttribute.interpolator ) {
                return;
            }
            if ( valueAttribute.value === nameAttribute.interpolator.value ) {
                return true;
            }
        }
 
        function stringifyAttribute( attribute ) {
            var str = attribute.toString();
            return str ? ' ' + str : '';
        }
    }( voidElementNames, isArray );
 
    /* virtualdom/items/Element/special/option/unbind.js */
    var virtualdom_items_Element_special_option_unbind = function( removeFromArray ) {
 
        return function unbindOption( option ) {
            removeFromArray( option.select.options, option );
        };
    }( removeFromArray );
 
    /* virtualdom/items/Element/prototype/unbind.js */
    var virtualdom_items_Element$unbind = function( unbindOption ) {
 
        return function Element$unbind() {
            if ( this.fragment ) {
                this.fragment.unbind();
            }
            if ( this.binding ) {
                this.binding.unbind();
            }
            // Special case - <option>
            if ( this.name === 'option' ) {
                unbindOption( this );
            }
            this.attributes.forEach( unbindAttribute );
        };
 
        function unbindAttribute( attribute ) {
            attribute.unbind();
        }
    }( virtualdom_items_Element_special_option_unbind );
 
    /* virtualdom/items/Element/prototype/unrender.js */
    var virtualdom_items_Element$unrender = function( runloop, Transition ) {
 
        return function Element$unrender( shouldDestroy ) {
            var binding, bindings;
            // Detach as soon as we can
            if ( this.name === 'option' ) {
                // <option> elements detach immediately, so that
                // their parent <select> element syncs correctly, and
                // since option elements can't have transitions anyway
                this.detach();
            } else if ( shouldDestroy ) {
                this.willDetach = true;
                runloop.detachWhenReady( this );
            }
            // Children first. that way, any transitions on child elements will be
            // handled by the current transitionManager
            if ( this.fragment ) {
                this.fragment.unrender( false );
            }
            if ( binding = this.binding ) {
                this.binding.unrender();
                this.node._ractive.binding = null;
                bindings = this.root._twowayBindings[ binding.keypath ];
                bindings.splice( bindings.indexOf( binding ), 1 );
            }
            // Remove event handlers
            if ( this.eventHandlers ) {
                this.eventHandlers.forEach( function( h ) {
                    return h.unrender();
                } );
            }
            if ( this.decorator ) {
                this.decorator.teardown();
            }
            // trigger outro transition if necessary
            if ( this.root.transitionsEnabled && this.outro ) {
                var transition = new Transition( this, this.outro, false );
                runloop.registerTransition( transition );
                runloop.scheduleTask( function() {
                    return transition.start();
                } );
            }
            // Remove this node from any live queries
            if ( this.liveQueries ) {
                removeFromLiveQueries( this );
            }
        };
 
        function removeFromLiveQueries( element ) {
            var query, selector, i;
            i = element.liveQueries.length;
            while ( i-- ) {
                query = element.liveQueries[ i ];
                selector = query.selector;
                query._remove( element.node );
            }
        }
    }( runloop, Transition );
 
    /* virtualdom/items/Element/_Element.js */
    var Element = function( bubble, detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, getAttribute, init, rebind, render, toString, unbind, unrender ) {
 
        var Element = function( options ) {
            this.init( options );
        };
        Element.prototype = {
            bubble: bubble,
            detach: detach,
            find: find,
            findAll: findAll,
            findAllComponents: findAllComponents,
            findComponent: findComponent,
            findNextNode: findNextNode,
            firstNode: firstNode,
            getAttribute: getAttribute,
            init: init,
            rebind: rebind,
            render: render,
            toString: toString,
            unbind: unbind,
            unrender: unrender
        };
        return Element;
    }( virtualdom_items_Element$bubble, virtualdom_items_Element$detach, virtualdom_items_Element$find, virtualdom_items_Element$findAll, virtualdom_items_Element$findAllComponents, virtualdom_items_Element$findComponent, virtualdom_items_Element$findNextNode, virtualdom_items_Element$firstNode, virtualdom_items_Element$getAttribute, virtualdom_items_Element$init, virtualdom_items_Element$rebind, virtualdom_items_Element$render, virtualdom_items_Element$toString, virtualdom_items_Element$unbind, virtualdom_items_Element$unrender );
 
    /* virtualdom/items/Partial/deIndent.js */
    var deIndent = function() {
 
        var empty = /^\s*$/,
            leadingWhitespace = /^\s*/;
        return function( str ) {
            var lines, firstLine, lastLine, minIndent;
            lines = str.split( '\n' );
            // remove first and last line, if they only contain whitespace
            firstLine = lines[ 0 ];
            if ( firstLine !== undefined && empty.test( firstLine ) ) {
                lines.shift();
            }
            lastLine = lines[ lines.length - 1 ];
            if ( lastLine !== undefined && empty.test( lastLine ) ) {
                lines.pop();
            }
            minIndent = lines.reduce( reducer, null );
            if ( minIndent ) {
                str = lines.map( function( line ) {
                    return line.replace( minIndent, '' );
                } ).join( '\n' );
            }
            return str;
        };
 
        function reducer( previous, line ) {
            var lineIndent = leadingWhitespace.exec( line )[ 0 ];
            if ( previous === null || lineIndent.length < previous.length ) {
                return lineIndent;
            }
            return previous;
        }
    }();
 
    /* virtualdom/items/Partial/getPartialDescriptor.js */
    var getPartialDescriptor = function( log, config, parser, deIndent ) {
 
        return function getPartialDescriptor( ractive, name ) {
            var partial;
            // If the partial in instance or view heirarchy instances, great
            if ( partial = getPartialFromRegistry( ractive, name ) ) {
                return partial;
            }
            // Does it exist on the page as a script tag?
            partial = parser.fromId( name, {
                noThrow: true
            } );
            if ( partial ) {
                // is this necessary?
                partial = deIndent( partial );
                // parse and register to this ractive instance
                var parsed = parser.parse( partial, parser.getParseOptions( ractive ) );
                // register (and return main partial if there are others in the template)
                return ractive.partials[ name ] = parsed.t;
            }
            log.error( {
                debug: ractive.debug,
                message: 'noTemplateForPartial',
                args: {
                    name: name
                }
            } );
            // No match? Return an empty array
            return [];
        };
 
        function getPartialFromRegistry( ractive, name ) {
            var partials = config.registries.partials;
            // find first instance in the ractive or view hierarchy that has this partial
            var instance = partials.findInstance( ractive, name );
            if ( !instance ) {
                return;
            }
            var partial = instance.partials[ name ],
                fn;
            // partial is a function?
            if ( typeof partial === 'function' ) {
                fn = partial.bind( instance );
                fn.isOwner = instance.partials.hasOwnProperty( name );
                partial = fn( instance.data );
            }
            if ( !partial ) {
                log.warn( {
                    debug: ractive.debug,
                    message: 'noRegistryFunctionReturn',
                    args: {
                        registry: 'partial',
                        name: name
                    }
                } );
                return;
            }
            // If this was added manually to the registry,
            // but hasn't been parsed, parse it now
            if ( !parser.isParsed( partial ) ) {
                // use the parseOptions of the ractive instance on which it was found
                var parsed = parser.parse( partial, parser.getParseOptions( instance ) );
                // Partials cannot contain nested partials!
                // TODO add a test for this
                if ( parsed.p ) {
                    log.warn( {
                        debug: ractive.debug,
                        message: 'noNestedPartials',
                        args: {
                            rname: name
                        }
                    } );
                }
                // if fn, use instance to store result, otherwise needs to go
                // in the correct point in prototype chain on instance or constructor
                var target = fn ? instance : partials.findOwner( instance, name );
                // may be a template with partials, which need to be registered and main template extracted
                target.partials[ name ] = partial = parsed.t;
            }
            // store for reset
            if ( fn ) {
                partial._fn = fn;
            }
            return partial;
        }
    }( log, config, parser, deIndent );
 
    /* virtualdom/items/Partial/applyIndent.js */
    var applyIndent = function( string, indent ) {
        var indented;
        if ( !indent ) {
            return string;
        }
        indented = string.split( '\n' ).map( function( line, notFirstLine ) {
            return notFirstLine ? indent + line : line;
        } ).join( '\n' );
        return indented;
    };
 
    /* virtualdom/items/Partial/_Partial.js */
    var Partial = function( types, getPartialDescriptor, applyIndent, circular ) {
 
        var Partial, Fragment;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        Partial = function( options ) {
            var parentFragment = this.parentFragment = options.parentFragment,
                template;
            this.type = types.PARTIAL;
            this.name = options.template.r;
            this.index = options.index;
            if ( !options.template.r ) {
                // TODO support dynamic partial switching
                throw new Error( 'Partials must have a static reference (no expressions). This may change in a future version of Ractive.' );
            }
            template = getPartialDescriptor( parentFragment.root, options.template.r );
            this.fragment = new Fragment( {
                template: template,
                root: parentFragment.root,
                owner: this,
                pElement: parentFragment.pElement
            } );
        };
        Partial.prototype = {
            bubble: function() {
                this.parentFragment.bubble();
            },
            firstNode: function() {
                return this.fragment.firstNode();
            },
            findNextNode: function() {
                return this.parentFragment.findNextNode( this );
            },
            detach: function() {
                return this.fragment.detach();
            },
            render: function() {
                return this.fragment.render();
            },
            unrender: function( shouldDestroy ) {
                this.fragment.unrender( shouldDestroy );
            },
            rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                return this.fragment.rebind( indexRef, newIndex, oldKeypath, newKeypath );
            },
            unbind: function() {
                this.fragment.unbind();
            },
            toString: function( toString ) {
                var string, previousItem, lastLine, match;
                string = this.fragment.toString( toString );
                previousItem = this.parentFragment.items[ this.index - 1 ];
                if ( !previousItem || previousItem.type !== types.TEXT ) {
                    return string;
                }
                lastLine = previousItem.template.split( '\n' ).pop();
                if ( match = /^\s+$/.exec( lastLine ) ) {
                    return applyIndent( string, match[ 0 ] );
                }
                return string;
            },
            find: function( selector ) {
                return this.fragment.find( selector );
            },
            findAll: function( selector, query ) {
                return this.fragment.findAll( selector, query );
            },
            findComponent: function( selector ) {
                return this.fragment.findComponent( selector );
            },
            findAllComponents: function( selector, query ) {
                return this.fragment.findAllComponents( selector, query );
            }
        };
        return Partial;
    }( types, getPartialDescriptor, applyIndent, circular );
 
    /* virtualdom/items/Component/getComponent.js */
    var getComponent = function( config, log, circular ) {
 
        var Ractive;
        circular.push( function() {
            Ractive = circular.Ractive;
        } );
        // finds the component constructor in the registry or view hierarchy registries
        return function getComponent( ractive, name ) {
            var component, instance = config.registries.components.findInstance( ractive, name );
            if ( instance ) {
                component = instance.components[ name ];
                // best test we have for not Ractive.extend
                if ( !component._parent ) {
                    // function option, execute and store for reset
                    var fn = component.bind( instance );
                    fn.isOwner = instance.components.hasOwnProperty( name );
                    component = fn( instance.data );
                    if ( !component ) {
                        log.warn( {
                            debug: ractive.debug,
                            message: 'noRegistryFunctionReturn',
                            args: {
                                registry: 'component',
                                name: name
                            }
                        } );
                        return;
                    }
                    if ( typeof component === 'string' ) {
                        //allow string lookup
                        component = getComponent( ractive, component );
                    }
                    component._fn = fn;
                    instance.components[ name ] = component;
                }
            }
            return component;
        };
    }( config, log, circular );
 
    /* virtualdom/items/Component/prototype/detach.js */
    var virtualdom_items_Component$detach = function Component$detach() {
        return this.instance.fragment.detach();
    };
 
    /* virtualdom/items/Component/prototype/find.js */
    var virtualdom_items_Component$find = function Component$find( selector ) {
        return this.instance.fragment.find( selector );
    };
 
    /* virtualdom/items/Component/prototype/findAll.js */
    var virtualdom_items_Component$findAll = function Component$findAll( selector, query ) {
        return this.instance.fragment.findAll( selector, query );
    };
 
    /* virtualdom/items/Component/prototype/findAllComponents.js */
    var virtualdom_items_Component$findAllComponents = function Component$findAllComponents( selector, query ) {
        query._test( this, true );
        if ( this.instance.fragment ) {
            this.instance.fragment.findAllComponents( selector, query );
        }
    };
 
    /* virtualdom/items/Component/prototype/findComponent.js */
    var virtualdom_items_Component$findComponent = function Component$findComponent( selector ) {
        if ( !selector || selector === this.name ) {
            return this.instance;
        }
        if ( this.instance.fragment ) {
            return this.instance.fragment.findComponent( selector );
        }
        return null;
    };
 
    /* virtualdom/items/Component/prototype/findNextNode.js */
    var virtualdom_items_Component$findNextNode = function Component$findNextNode() {
        return this.parentFragment.findNextNode( this );
    };
 
    /* virtualdom/items/Component/prototype/firstNode.js */
    var virtualdom_items_Component$firstNode = function Component$firstNode() {
        if ( this.rendered ) {
            return this.instance.fragment.firstNode();
        }
        return null;
    };
 
    /* virtualdom/items/Component/initialise/createModel/ComponentParameter.js */
    var ComponentParameter = function( runloop, circular ) {
 
        var Fragment, getValueOptions, ComponentParameter;
        circular.push( function() {
            Fragment = circular.Fragment;
        } );
        getValueOptions = {
            parse: true
        };
        ComponentParameter = function( component, key, value ) {
            this.parentFragment = component.parentFragment;
            this.component = component;
            this.key = key;
            this.fragment = new Fragment( {
                template: value,
                root: component.root,
                owner: this
            } );
            this.value = this.fragment.getValue( getValueOptions );
        };
        ComponentParameter.prototype = {
            bubble: function() {
                if ( !this.dirty ) {
                    this.dirty = true;
                    runloop.addView( this );
                }
            },
            update: function() {
                var value = this.fragment.getValue( getValueOptions );
                this.component.instance.viewmodel.set( this.key, value );
                runloop.addViewmodel( this.component.instance.viewmodel );
                this.value = value;
                this.dirty = false;
            },
            rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
                this.fragment.rebind( indexRef, newIndex, oldKeypath, newKeypath );
            },
            unbind: function() {
                this.fragment.unbind();
            }
        };
        return ComponentParameter;
    }( runloop, circular );
 
    /* virtualdom/items/Component/initialise/createModel/_createModel.js */
    var createModel = function( types, parseJSON, resolveRef, ComponentParameter ) {
 
        return function( component, defaultData, attributes, toBind ) {
            var data = {},
                key, value;
            // some parameters, e.g. foo="The value is {{bar}}", are 'complex' - in
            // other words, we need to construct a string fragment to watch
            // when they change. We store these so they can be torn down later
            component.complexParameters = [];
            for ( key in attributes ) {
                if ( attributes.hasOwnProperty( key ) ) {
                    value = getValue( component, key, attributes[ key ], toBind );
                    if ( value !== undefined || defaultData[ key ] === undefined ) {
                        data[ key ] = value;
                    }
                }
            }
            return data;
        };
 
        function getValue( component, key, template, toBind ) {
            var parameter, parsed, parentInstance, parentFragment, keypath, indexRef;
            parentInstance = component.root;
            parentFragment = component.parentFragment;
            // If this is a static value, great
            if ( typeof template === 'string' ) {
                parsed = parseJSON( template );
                if ( !parsed ) {
                    return template;
                }
                return parsed.value;
            }
            // If null, we treat it as a boolean attribute (i.e. true)
            if ( template === null ) {
                return true;
            }
            // If a regular interpolator, we bind to it
            if ( template.length === 1 && template[ 0 ].t === types.INTERPOLATOR && template[ 0 ].r ) {
                // Is it an index reference?
                if ( parentFragment.indexRefs && parentFragment.indexRefs[ indexRef = template[ 0 ].r ] !== undefined ) {
                    component.indexRefBindings[ indexRef ] = key;
                    return parentFragment.indexRefs[ indexRef ];
                }
                // TODO what about references that resolve late? Should these be considered?
                keypath = resolveRef( parentInstance, template[ 0 ].r, parentFragment ) || template[ 0 ].r;
                // We need to set up bindings between parent and child, but
                // we can't do it yet because the child instance doesn't exist
                // yet - so we make a note instead
                toBind.push( {
                    childKeypath: key,
                    parentKeypath: keypath
                } );
                return parentInstance.viewmodel.get( keypath );
            }
            // We have a 'complex parameter' - we need to create a full-blown string
            // fragment in order to evaluate and observe its value
            parameter = new ComponentParameter( component, key, template );
            component.complexParameters.push( parameter );
            return parameter.value;
        }
    }( types, parseJSON, resolveRef, ComponentParameter );
 
    /* virtualdom/items/Component/initialise/createInstance.js */
    var createInstance = function( component, Component, data, contentDescriptor ) {
        var instance, parentFragment, partials, root;
        parentFragment = component.parentFragment;
        root = component.root;
        // Make contents available as a {{>content}} partial
        partials = {
            content: contentDescriptor || []
        };
        instance = new Component( {
            append: true,
            data: data,
            partials: partials,
            magic: root.magic || Component.defaults.magic,
            modifyArrays: root.modifyArrays,
            _parent: root,
            _component: component,
            // need to inherit runtime parent adaptors
            adapt: root.adapt
        } );
        return instance;
    };
 
    /* virtualdom/items/Component/initialise/createBindings.js */
    var createBindings = function( createComponentBinding ) {
 
        return function createInitialComponentBindings( component, toBind ) {
            toBind.forEach( function createInitialComponentBinding( pair ) {
                var childValue, parentValue;
                createComponentBinding( component, component.root, pair.parentKeypath, pair.childKeypath );
                childValue = component.instance.viewmodel.get( pair.childKeypath );
                parentValue = component.root.viewmodel.get( pair.parentKeypath );
                if ( childValue !== undefined && parentValue === undefined ) {
                    component.root.viewmodel.set( pair.parentKeypath, childValue );
                }
            } );
        };
    }( createComponentBinding );
 
    /* virtualdom/items/Component/initialise/propagateEvents.js */
    var propagateEvents = function( log ) {
 
        // TODO how should event arguments be handled? e.g.
        // <widget on-foo='bar:1,2,3'/>
        // The event 'bar' will be fired on the parent instance
        // when 'foo' fires on the child, but the 1,2,3 arguments
        // will be lost
        return function( component, eventsDescriptor ) {
            var eventName;
            for ( eventName in eventsDescriptor ) {
                if ( eventsDescriptor.hasOwnProperty( eventName ) ) {
                    propagateEvent( component.instance, component.root, eventName, eventsDescriptor[ eventName ] );
                }
            }
        };
 
        function propagateEvent( childInstance, parentInstance, eventName, proxyEventName ) {
            if ( typeof proxyEventName !== 'string' ) {
                log.error( {
                    debug: parentInstance.debug,
                    message: 'noComponentEventArguments'
                } );
            }
            childInstance.on( eventName, function() {
                var args = Array.prototype.slice.call( arguments );
                args.unshift( proxyEventName );
                parentInstance.fire.apply( parentInstance, args );
            } );
        }
    }( log );
 
    /* virtualdom/items/Component/initialise/updateLiveQueries.js */
    var updateLiveQueries = function( component ) {
        var ancestor, query;
        // If there's a live query for this component type, add it
        ancestor = component.root;
        while ( ancestor ) {
            if ( query = ancestor._liveComponentQueries[ '_' + component.name ] ) {
                query.push( component.instance );
            }
            ancestor = ancestor._parent;
        }
    };
 
    /* virtualdom/items/Component/prototype/init.js */
    var virtualdom_items_Component$init = function( types, warn, createModel, createInstance, createBindings, propagateEvents, updateLiveQueries ) {
 
        return function Component$init( options, Component ) {
            var parentFragment, root, data, toBind;
            parentFragment = this.parentFragment = options.parentFragment;
            root = parentFragment.root;
            this.root = root;
            this.type = types.COMPONENT;
            this.name = options.template.e;
            this.index = options.index;
            this.indexRefBindings = {};
            this.bindings = [];
            if ( !Component ) {
                throw new Error( 'Component "' + this.name + '" not found' );
            }
            // First, we need to create a model for the component - e.g. if we
            // encounter <widget foo='bar'/> then we need to create a widget
            // with `data: { foo: 'bar' }`.
            //
            // This may involve setting up some bindings, but we can't do it
            // yet so we take some notes instead
            toBind = [];
            data = createModel( this, Component.defaults.data || {}, options.template.a, toBind );
            createInstance( this, Component, data, options.template.f );
            createBindings( this, toBind );
            propagateEvents( this, options.template.v );
            // intro, outro and decorator directives have no effect
            if ( options.template.t1 || options.template.t2 || options.template.o ) {
                warn( 'The "intro", "outro" and "decorator" directives have no effect on components' );
            }
            updateLiveQueries( this );
        };
    }( types, warn, createModel, createInstance, createBindings, propagateEvents, updateLiveQueries );
 
    /* virtualdom/items/Component/prototype/rebind.js */
    var virtualdom_items_Component$rebind = function( runloop, getNewKeypath ) {
 
        return function Component$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
            var childInstance = this.instance,
                parentInstance = childInstance._parent,
                indexRefAlias, query;
            this.bindings.forEach( function( binding ) {
                var updated;
                if ( binding.root !== parentInstance ) {
                    return;
                }
                if ( updated = getNewKeypath( binding.keypath, oldKeypath, newKeypath ) ) {
                    binding.rebind( updated );
                }
            } );
            this.complexParameters.forEach( function( parameter ) {
                parameter.rebind( indexRef, newIndex, oldKeypath, newKeypath );
            } );
            if ( indexRefAlias = this.indexRefBindings[ indexRef ] ) {
                runloop.addViewmodel( childInstance.viewmodel );
                childInstance.viewmodel.set( indexRefAlias, newIndex );
            }
            if ( query = this.root._liveComponentQueries[ '_' + this.name ] ) {
                query._makeDirty();
            }
        };
    }( runloop, getNewKeypath );
 
    /* virtualdom/items/Component/prototype/render.js */
    var virtualdom_items_Component$render = function Component$render() {
        var instance = this.instance;
        instance.render( this.parentFragment.getNode() );
        this.rendered = true;
        return instance.detach();
    };
 
    /* virtualdom/items/Component/prototype/toString.js */
    var virtualdom_items_Component$toString = function Component$toString() {
        return this.instance.fragment.toString();
    };
 
    /* virtualdom/items/Component/prototype/unbind.js */
    var virtualdom_items_Component$unbind = function() {
 
        return function Component$unbind() {
            this.complexParameters.forEach( unbind );
            this.bindings.forEach( unbind );
            removeFromLiveComponentQueries( this );
            this.instance.fragment.unbind();
        };
 
        function unbind( thing ) {
            thing.unbind();
        }
 
        function removeFromLiveComponentQueries( component ) {
            var instance, query;
            instance = component.root;
            do {
                if ( query = instance._liveComponentQueries[ '_' + component.name ] ) {
                    query._remove( component );
                }
            } while ( instance = instance._parent );
        }
    }();
 
    /* virtualdom/items/Component/prototype/unrender.js */
    var virtualdom_items_Component$unrender = function Component$unrender( shouldDestroy ) {
        this.instance.fire( 'teardown' );
        this.shouldDestroy = shouldDestroy;
        this.instance.unrender();
    };
 
    /* virtualdom/items/Component/_Component.js */
    var Component = function( detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, init, rebind, render, toString, unbind, unrender ) {
 
        var Component = function( options, Constructor ) {
            this.init( options, Constructor );
        };
        Component.prototype = {
            detach: detach,
            find: find,
            findAll: findAll,
            findAllComponents: findAllComponents,
            findComponent: findComponent,
            findNextNode: findNextNode,
            firstNode: firstNode,
            init: init,
            rebind: rebind,
            render: render,
            toString: toString,
            unbind: unbind,
            unrender: unrender
        };
        return Component;
    }( virtualdom_items_Component$detach, virtualdom_items_Component$find, virtualdom_items_Component$findAll, virtualdom_items_Component$findAllComponents, virtualdom_items_Component$findComponent, virtualdom_items_Component$findNextNode, virtualdom_items_Component$firstNode, virtualdom_items_Component$init, virtualdom_items_Component$rebind, virtualdom_items_Component$render, virtualdom_items_Component$toString, virtualdom_items_Component$unbind, virtualdom_items_Component$unrender );
 
    /* virtualdom/items/Comment.js */
    var Comment = function( types, detach ) {
 
        var Comment = function( options ) {
            this.type = types.COMMENT;
            this.value = options.template.c;
        };
        Comment.prototype = {
            detach: detach,
            firstNode: function() {
                return this.node;
            },
            render: function() {
                if ( !this.node ) {
                    this.node = document.createComment( this.value );
                }
                return this.node;
            },
            toString: function() {
                return '<!--' + this.value + '-->';
            },
            unrender: function( shouldDestroy ) {
                if ( shouldDestroy ) {
                    this.node.parentNode.removeChild( this.node );
                }
            }
        };
        return Comment;
    }( types, detach );
 
    /* virtualdom/Fragment/prototype/init/createItem.js */
    var virtualdom_Fragment$init_createItem = function( types, Text, Interpolator, Section, Triple, Element, Partial, getComponent, Component, Comment ) {
 
        return function createItem( options ) {
            if ( typeof options.template === 'string' ) {
                return new Text( options );
            }
            switch ( options.template.t ) {
                case types.INTERPOLATOR:
                    return new Interpolator( options );
                case types.SECTION:
                    return new Section( options );
                case types.TRIPLE:
                    return new Triple( options );
                case types.ELEMENT:
                    var constructor;
                    if ( constructor = getComponent( options.parentFragment.root, options.template.e ) ) {
                        return new Component( options, constructor );
                    }
                    return new Element( options );
                case types.PARTIAL:
                    return new Partial( options );
                case types.COMMENT:
                    return new Comment( options );
                default:
                    throw new Error( 'Something very strange happened. Please file an issue at https://github.com/ractivejs/ractive/issues. Thanks!' );
            }
        };
    }( types, Text, Interpolator, Section, Triple, Element, Partial, getComponent, Component, Comment );
 
    /* virtualdom/Fragment/prototype/init.js */
    var virtualdom_Fragment$init = function( types, create, createItem ) {
 
        return function Fragment$init( options ) {
            var this$0 = this;
            var parentFragment, parentRefs, ref;
            // The item that owns this fragment - an element, section, partial, or attribute
            this.owner = options.owner;
            parentFragment = this.parent = this.owner.parentFragment;
            // inherited properties
            this.root = options.root;
            this.pElement = options.pElement;
            this.context = options.context;
            // If parent item is a section, this may not be the only fragment
            // that belongs to it - we need to make a note of the index
            if ( this.owner.type === types.SECTION ) {
                this.index = options.index;
            }
            // index references (the 'i' in {{#section:i}}...{{/section}}) need to cascade
            // down the tree
            if ( parentFragment ) {
                parentRefs = parentFragment.indexRefs;
                if ( parentRefs ) {
                    this.indexRefs = create( null );
                    // avoids need for hasOwnProperty
                    for ( ref in parentRefs ) {
                        this.indexRefs[ ref ] = parentRefs[ ref ];
                    }
                }
            }
            // inherit priority
            this.priority = parentFragment ? parentFragment.priority + 1 : 1;
            if ( options.indexRef ) {
                if ( !this.indexRefs ) {
                    this.indexRefs = {};
                }
                this.indexRefs[ options.indexRef ] = options.index;
            }
            // Time to create this fragment's child items
            // TEMP should this be happening?
            if ( typeof options.template === 'string' ) {
                options.template = [ options.template ];
            } else if ( !options.template ) {
                options.template = [];
            }
            this.items = options.template.map( function( template, i ) {
                return createItem( {
                    parentFragment: this$0,
                    pElement: options.pElement,
                    template: template,
                    index: i
                } );
            } );
            this.inited = true;
        };
    }( types, create, virtualdom_Fragment$init_createItem );
 
    /* virtualdom/Fragment/prototype/rebind.js */
    var virtualdom_Fragment$rebind = function( assignNewKeypath ) {
 
        return function Fragment$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
            // assign new context keypath if needed
            assignNewKeypath( this, 'context', oldKeypath, newKeypath );
            if ( this.indexRefs && this.indexRefs[ indexRef ] !== undefined ) {
                this.indexRefs[ indexRef ] = newIndex;
            }
            this.items.forEach( function( item ) {
                if ( item.rebind ) {
                    item.rebind( indexRef, newIndex, oldKeypath, newKeypath );
                }
            } );
        };
    }( assignNewKeypath );
 
    /* virtualdom/Fragment/prototype/render.js */
    var virtualdom_Fragment$render = function Fragment$render() {
        var result;
        if ( this.items.length === 1 ) {
            result = this.items[ 0 ].render();
        } else {
            result = document.createDocumentFragment();
            this.items.forEach( function( item ) {
                result.appendChild( item.render() );
            } );
        }
        this.rendered = true;
        return result;
    };
 
    /* virtualdom/Fragment/prototype/toString.js */
    var virtualdom_Fragment$toString = function Fragment$toString( escape ) {
        if ( !this.items ) {
            return '';
        }
        return this.items.map( function( item ) {
            return item.toString( escape );
        } ).join( '' );
    };
 
    /* virtualdom/Fragment/prototype/unbind.js */
    var virtualdom_Fragment$unbind = function() {
 
        return function Fragment$unbind() {
            this.items.forEach( unbindItem );
        };
 
        function unbindItem( item ) {
            if ( item.unbind ) {
                item.unbind();
            }
        }
    }();
 
    /* virtualdom/Fragment/prototype/unrender.js */
    var virtualdom_Fragment$unrender = function Fragment$unrender( shouldDestroy ) {
        if ( !this.rendered ) {
            throw new Error( 'Attempted to unrender a fragment that was not rendered' );
        }
        this.items.forEach( function( i ) {
            return i.unrender( shouldDestroy );
        } );
    };
 
    /* virtualdom/Fragment.js */
    var Fragment = function( bubble, detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, getNode, getValue, init, rebind, render, toString, unbind, unrender, circular ) {
 
        var Fragment = function( options ) {
            this.init( options );
        };
        Fragment.prototype = {
            bubble: bubble,
            detach: detach,
            find: find,
            findAll: findAll,
            findAllComponents: findAllComponents,
            findComponent: findComponent,
            findNextNode: findNextNode,
            firstNode: firstNode,
            getNode: getNode,
            getValue: getValue,
            init: init,
            rebind: rebind,
            render: render,
            toString: toString,
            unbind: unbind,
            unrender: unrender
        };
        circular.Fragment = Fragment;
        return Fragment;
    }( virtualdom_Fragment$bubble, virtualdom_Fragment$detach, virtualdom_Fragment$find, virtualdom_Fragment$findAll, virtualdom_Fragment$findAllComponents, virtualdom_Fragment$findComponent, virtualdom_Fragment$findNextNode, virtualdom_Fragment$firstNode, virtualdom_Fragment$getNode, virtualdom_Fragment$getValue, virtualdom_Fragment$init, virtualdom_Fragment$rebind, virtualdom_Fragment$render, virtualdom_Fragment$toString, virtualdom_Fragment$unbind, virtualdom_Fragment$unrender, circular );
 
    /* Ractive/prototype/reset.js */
    var Ractive$reset = function( runloop, Fragment, config ) {
 
        var shouldRerender = [
            'template',
            'partials',
            'components',
            'decorators',
            'events'
        ];
        return function Ractive$reset( data, callback ) {
            var promise, wrapper, changes, i, rerender;
            if ( typeof data === 'function' && !callback ) {
                callback = data;
                data = {};
            } else {
                data = data || {};
            }
            if ( typeof data !== 'object' ) {
                throw new Error( 'The reset method takes either no arguments, or an object containing new data' );
            }
            // If the root object is wrapped, try and use the wrapper's reset value
            if ( ( wrapper = this.viewmodel.wrapped[ '' ] ) && wrapper.reset ) {
                if ( wrapper.reset( data ) === false ) {
                    // reset was rejected, we need to replace the object
                    this.data = data;
                }
            } else {
                this.data = data;
            }
            // reset config items and track if need to rerender
            changes = config.reset( this );
            i = changes.length;
            while ( i-- ) {
                if ( shouldRerender.indexOf( changes[ i ] > -1 ) ) {
                    rerender = true;
                    break;
                }
            }
            if ( rerender ) {
                this.viewmodel.mark( '' );
                this.unrender();
                // If the template changed, we need to destroy the parallel DOM
                // TODO if we're here, presumably it did?
                if ( this.fragment.template !== this.template ) {
                    this.fragment.unbind();
                    this.fragment = new Fragment( {
                        template: this.template,
                        root: this,
                        owner: this
                    } );
                }
                promise = this.render( this.el, this.anchor );
            } else {
                promise = runloop.start( this, true );
                this.viewmodel.mark( '' );
                runloop.end();
            }
            this.fire( 'reset', data );
            if ( callback ) {
                promise.then( callback );
            }
            return promise;
        };
    }( runloop, Fragment, config );
 
    /* Ractive/prototype/resetTemplate.js */
    var Ractive$resetTemplate = function( config, Fragment ) {
 
        // TODO should resetTemplate be asynchronous? i.e. should it be a case
        // of outro, update template, intro? I reckon probably not, since that
        // could be achieved with unrender-resetTemplate-render. Also, it should
        // conceptually be similar to resetPartial, which couldn't be async
        return function Ractive$resetTemplate( template ) {
            var transitionsEnabled, component;
            config.template.init( null, this, {
                template: template
            } );
            transitionsEnabled = this.transitionsEnabled;
            this.transitionsEnabled = false;
            // Is this is a component, we need to set the `shouldDestroy`
            // flag, otherwise it will assume by default that a parent node
            // will be detached, and therefore it doesn't need to bother
            // detaching its own nodes
            if ( component = this.component ) {
                component.shouldDestroy = true;
            }
            this.unrender();
            if ( component ) {
                component.shouldDestroy = false;
            }
            // remove existing fragment and create new one
            this.fragment.unbind();
            this.fragment = new Fragment( {
                template: this.template,
                root: this,
                owner: this
            } );
            this.render( this.el, this.anchor );
            this.transitionsEnabled = transitionsEnabled;
        };
    }( config, Fragment );
 
    /* Ractive/prototype/reverse.js */
    var Ractive$reverse = function( makeArrayMethod ) {
 
        return makeArrayMethod( 'reverse' );
    }( Ractive$shared_makeArrayMethod );
 
    /* Ractive/prototype/set.js */
    var Ractive$set = function( runloop, isObject, normaliseKeypath, getMatchingKeypaths ) {
 
        var wildcard = /\*/;
        return function Ractive$set( keypath, value, callback ) {
            var this$0 = this;
            var map, promise;
            promise = runloop.start( this, true );
            // Set multiple keypaths in one go
            if ( isObject( keypath ) ) {
                map = keypath;
                callback = value;
                for ( keypath in map ) {
                    if ( map.hasOwnProperty( keypath ) ) {
                        value = map[ keypath ];
                        keypath = normaliseKeypath( keypath );
                        this.viewmodel.set( keypath, value );
                    }
                }
            } else {
                keypath = normaliseKeypath( keypath );
                if ( wildcard.test( keypath ) ) {
                    getMatchingKeypaths( this, keypath ).forEach( function( keypath ) {
                        this$0.viewmodel.set( keypath, value );
                    } );
                } else {
                    this.viewmodel.set( keypath, value );
                }
            }
            runloop.end();
            if ( callback ) {
                promise.then( callback.bind( this ) );
            }
            return promise;
        };
    }( runloop, isObject, normaliseKeypath, getMatchingKeypaths );
 
    /* Ractive/prototype/shift.js */
    var Ractive$shift = function( makeArrayMethod ) {
 
        return makeArrayMethod( 'shift' );
    }( Ractive$shared_makeArrayMethod );
 
    /* Ractive/prototype/sort.js */
    var Ractive$sort = function( makeArrayMethod ) {
 
        return makeArrayMethod( 'sort' );
    }( Ractive$shared_makeArrayMethod );
 
    /* Ractive/prototype/splice.js */
    var Ractive$splice = function( makeArrayMethod ) {
 
        return makeArrayMethod( 'splice' );
    }( Ractive$shared_makeArrayMethod );
 
    /* Ractive/prototype/subtract.js */
    var Ractive$subtract = function( add ) {
 
        return function Ractive$subtract( keypath, d ) {
            return add( this, keypath, d === undefined ? -1 : -d );
        };
    }( Ractive$shared_add );
 
    /* Ractive/prototype/teardown.js */
    var Ractive$teardown = function( Promise ) {
 
        // Teardown. This goes through the root fragment and all its children, removing observers
        // and generally cleaning up after itself
        return function Ractive$teardown( callback ) {
            var promise;
            this.fire( 'teardown' );
            this.fragment.unbind();
            this.viewmodel.teardown();
            promise = this.rendered ? this.unrender() : Promise.resolve();
            if ( callback ) {
                // TODO deprecate this?
                promise.then( callback.bind( this ) );
            }
            return promise;
        };
    }( Promise );
 
    /* Ractive/prototype/toggle.js */
    var Ractive$toggle = function( log ) {
 
        return function Ractive$toggle( keypath, callback ) {
            var value;
            if ( typeof keypath !== 'string' ) {
                log.errorOnly( {
                    debug: this.debug,
                    messsage: 'badArguments',
                    arg: {
                        arguments: keypath
                    }
                } );
            }
            value = this.get( keypath );
            return this.set( keypath, !value, callback );
        };
    }( log );
 
    /* Ractive/prototype/toHTML.js */
    var Ractive$toHTML = function Ractive$toHTML() {
        return this.fragment.toString( true );
    };
 
    /* Ractive/prototype/unrender.js */
    var Ractive$unrender = function( removeFromArray, runloop, css ) {
 
        return function Ractive$unrender() {
            var this$0 = this;
            var promise, shouldDestroy;
            if ( !this.rendered ) {
                throw new Error( 'ractive.unrender() was called on a Ractive instance that was not rendered' );
            }
            promise = runloop.start( this, true );
            // If this is a component, and the component isn't marked for destruction,
            // don't detach nodes from the DOM unnecessarily
            shouldDestroy = !this.component || this.component.shouldDestroy;
            if ( this.constructor.css ) {
                promise.then( function() {
                    css.remove( this$0.constructor );
                } );
            }
            // Cancel any animations in progress
            while ( this._animations[ 0 ] ) {
                this._animations[ 0 ].stop();
            }
            this.fragment.unrender( shouldDestroy );
            this.rendered = false;
            removeFromArray( this.el.__ractive_instances__, this );
            runloop.end();
            return promise;
        };
    }( removeFromArray, runloop, global_css );
 
    /* Ractive/prototype/unshift.js */
    var Ractive$unshift = function( makeArrayMethod ) {
 
        return makeArrayMethod( 'unshift' );
    }( Ractive$shared_makeArrayMethod );
 
    /* Ractive/prototype/update.js */
    var Ractive$update = function( runloop ) {
 
        return function Ractive$update( keypath, callback ) {
            var promise;
            if ( typeof keypath === 'function' ) {
                callback = keypath;
                keypath = '';
            } else {
                keypath = keypath || '';
            }
            promise = runloop.start( this, true );
            this.viewmodel.mark( keypath );
            runloop.end();
            this.fire( 'update', keypath );
            if ( callback ) {
                promise.then( callback.bind( this ) );
            }
            return promise;
        };
    }( runloop );
 
    /* Ractive/prototype/updateModel.js */
    var Ractive$updateModel = function( arrayContentsMatch, isEqual ) {
 
        return function Ractive$updateModel( keypath, cascade ) {
            var values;
            if ( typeof keypath !== 'string' ) {
                keypath = '';
                cascade = true;
            }
            consolidateChangedValues( this, keypath, values = {}, cascade );
            return this.set( values );
        };
 
        function consolidateChangedValues( ractive, keypath, values, cascade ) {
            var bindings, childDeps, i, binding, oldValue, newValue, checkboxGroups = [];
            bindings = ractive._twowayBindings[ keypath ];
            if ( bindings && ( i = bindings.length ) ) {
                while ( i-- ) {
                    binding = bindings[ i ];
                    // special case - radio name bindings
                    if ( binding.radioName && !binding.element.node.checked ) {
                        continue;
                    }
                    // special case - checkbox name bindings come in groups, so
                    // we want to get the value once at most
                    if ( binding.checkboxName ) {
                        if ( !checkboxGroups[ binding.keypath ] && !binding.changed() ) {
                            checkboxGroups.push( binding.keypath );
                            checkboxGroups[ binding.keypath ] = binding;
                        }
                        continue;
                    }
                    oldValue = binding.attribute.value;
                    newValue = binding.getValue();
                    if ( arrayContentsMatch( oldValue, newValue ) ) {
                        continue;
                    }
                    if ( !isEqual( oldValue, newValue ) ) {
                        values[ keypath ] = newValue;
                    }
                }
            }
            // Handle groups of `<input type='checkbox' name='{{foo}}' ...>`
            if ( checkboxGroups.length ) {
                checkboxGroups.forEach( function( keypath ) {
                    var binding, oldValue, newValue;
                    binding = checkboxGroups[ keypath ];
                    // one to represent the entire group
                    oldValue = binding.attribute.value;
                    newValue = binding.getValue();
                    if ( !arrayContentsMatch( oldValue, newValue ) ) {
                        values[ keypath ] = newValue;
                    }
                } );
            }
            if ( !cascade ) {
                return;
            }
            // cascade
            childDeps = ractive.viewmodel.depsMap[ 'default' ][ keypath ];
            if ( childDeps ) {
                i = childDeps.length;
                while ( i-- ) {
                    consolidateChangedValues( ractive, childDeps[ i ], values, cascade );
                }
            }
        }
    }( arrayContentsMatch, isEqual );
 
    /* Ractive/prototype.js */
    var prototype = function( add, animate, detach, find, findAll, findAllComponents, findComponent, fire, get, insert, merge, observe, off, on, pop, push, render, reset, resetTemplate, reverse, set, shift, sort, splice, subtract, teardown, toggle, toHTML, unrender, unshift, update, updateModel ) {
 
        return {
            add: add,
            animate: animate,
            detach: detach,
            find: find,
            findAll: findAll,
            findAllComponents: findAllComponents,
            findComponent: findComponent,
            fire: fire,
            get: get,
            insert: insert,
            merge: merge,
            observe: observe,
            off: off,
            on: on,
            pop: pop,
            push: push,
            render: render,
            reset: reset,
            resetTemplate: resetTemplate,
            reverse: reverse,
            set: set,
            shift: shift,
            sort: sort,
            splice: splice,
            subtract: subtract,
            teardown: teardown,
            toggle: toggle,
            toHTML: toHTML,
            unrender: unrender,
            unshift: unshift,
            update: update,
            updateModel: updateModel
        };
    }( Ractive$add, Ractive$animate, Ractive$detach, Ractive$find, Ractive$findAll, Ractive$findAllComponents, Ractive$findComponent, Ractive$fire, Ractive$get, Ractive$insert, Ractive$merge, Ractive$observe, Ractive$off, Ractive$on, Ractive$pop, Ractive$push, Ractive$render, Ractive$reset, Ractive$resetTemplate, Ractive$reverse, Ractive$set, Ractive$shift, Ractive$sort, Ractive$splice, Ractive$subtract, Ractive$teardown, Ractive$toggle, Ractive$toHTML, Ractive$unrender, Ractive$unshift, Ractive$update, Ractive$updateModel );
 
    /* utils/getGuid.js */
    var getGuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
            var r, v;
            r = Math.random() * 16 | 0;
            v = c == 'x' ? r : r & 3 | 8;
            return v.toString( 16 );
        } );
    };
 
    /* utils/getNextNumber.js */
    var getNextNumber = function() {
 
        var i = 0;
        return function() {
            return 'r-' + i++;
        };
    }();
 
    /* viewmodel/prototype/get/arrayAdaptor/processWrapper.js */
    var viewmodel$get_arrayAdaptor_processWrapper = function( wrapper, array, methodName, spliceSummary ) {
        var root = wrapper.root,
            keypath = wrapper.keypath;
        // If this is a sort or reverse, we just do root.set()...
        // TODO use merge logic?
        if ( methodName === 'sort' || methodName === 'reverse' ) {
            root.viewmodel.set( keypath, array );
            return;
        }
        if ( !spliceSummary ) {
            // (presumably we tried to pop from an array of zero length.
            // in which case there's nothing to do)
            return;
        }
        root.viewmodel.splice( keypath, spliceSummary );
    };
 
    /* viewmodel/prototype/get/arrayAdaptor/patch.js */
    var viewmodel$get_arrayAdaptor_patch = function( runloop, defineProperty, getSpliceEquivalent, summariseSpliceOperation, processWrapper ) {
 
        var patchedArrayProto = [],
            mutatorMethods = [
                'pop',
                'push',
                'reverse',
                'shift',
                'sort',
                'splice',
                'unshift'
            ],
            testObj, patchArrayMethods, unpatchArrayMethods;
        mutatorMethods.forEach( function( methodName ) {
            var method = function() {
                var spliceEquivalent, spliceSummary, result, wrapper, i;
                // push, pop, shift and unshift can all be represented as a splice operation.
                // this makes life easier later
                spliceEquivalent = getSpliceEquivalent( this, methodName, Array.prototype.slice.call( arguments ) );
                spliceSummary = summariseSpliceOperation( this, spliceEquivalent );
                // apply the underlying method
                result = Array.prototype[ methodName ].apply( this, arguments );
                // trigger changes
                this._ractive.setting = true;
                i = this._ractive.wrappers.length;
                while ( i-- ) {
                    wrapper = this._ractive.wrappers[ i ];
                    runloop.start( wrapper.root );
                    processWrapper( wrapper, this, methodName, spliceSummary );
                    runloop.end();
                }
                this._ractive.setting = false;
                return result;
            };
            defineProperty( patchedArrayProto, methodName, {
                value: method
            } );
        } );
        // can we use prototype chain injection?
        // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection
        testObj = {};
        if ( testObj.__proto__ ) {
            // yes, we can
            patchArrayMethods = function( array ) {
                array.__proto__ = patchedArrayProto;
            };
            unpatchArrayMethods = function( array ) {
                array.__proto__ = Array.prototype;
            };
        } else {
            // no, we can't
            patchArrayMethods = function( array ) {
                var i, methodName;
                i = mutatorMethods.length;
                while ( i-- ) {
                    methodName = mutatorMethods[ i ];
                    defineProperty( array, methodName, {
                        value: patchedArrayProto[ methodName ],
                        configurable: true
                    } );
                }
            };
            unpatchArrayMethods = function( array ) {
                var i;
                i = mutatorMethods.length;
                while ( i-- ) {
                    delete array[ mutatorMethods[ i ] ];
                }
            };
        }
        patchArrayMethods.unpatch = unpatchArrayMethods;
        return patchArrayMethods;
    }( runloop, defineProperty, getSpliceEquivalent, summariseSpliceOperation, viewmodel$get_arrayAdaptor_processWrapper );
 
    /* viewmodel/prototype/get/arrayAdaptor.js */
    var viewmodel$get_arrayAdaptor = function( defineProperty, isArray, patch ) {
 
        var arrayAdaptor,
            // helpers
            ArrayWrapper, errorMessage;
        arrayAdaptor = {
            filter: function( object ) {
                // wrap the array if a) b) it's an array, and b) either it hasn't been wrapped already,
                // or the array didn't trigger the get() itself
                return isArray( object ) && ( !object._ractive || !object._ractive.setting );
            },
            wrap: function( ractive, array, keypath ) {
                return new ArrayWrapper( ractive, array, keypath );
            }
        };
        ArrayWrapper = function( ractive, array, keypath ) {
            this.root = ractive;
            this.value = array;
            this.keypath = keypath;
            // if this array hasn't already been ractified, ractify it
            if ( !array._ractive ) {
                // define a non-enumerable _ractive property to store the wrappers
                defineProperty( array, '_ractive', {
                    value: {
                        wrappers: [],
                        instances: [],
                        setting: false
                    },
                    configurable: true
                } );
                patch( array );
            }
            // store the ractive instance, so we can handle transitions later
            if ( !array._ractive.instances[ ractive._guid ] ) {
                array._ractive.instances[ ractive._guid ] = 0;
                array._ractive.instances.push( ractive );
            }
            array._ractive.instances[ ractive._guid ] += 1;
            array._ractive.wrappers.push( this );
        };
        ArrayWrapper.prototype = {
            get: function() {
                return this.value;
            },
            teardown: function() {
                var array, storage, wrappers, instances, index;
                array = this.value;
                storage = array._ractive;
                wrappers = storage.wrappers;
                instances = storage.instances;
                // if teardown() was invoked because we're clearing the cache as a result of
                // a change that the array itself triggered, we can save ourselves the teardown
                // and immediate setup
                if ( storage.setting ) {
                    return false;
                }
                index = wrappers.indexOf( this );
                if ( index === -1 ) {
                    throw new Error( errorMessage );
                }
                wrappers.splice( index, 1 );
                // if nothing else depends on this array, we can revert it to its
                // natural state
                if ( !wrappers.length ) {
                    delete array._ractive;
                    patch.unpatch( this.value );
                } else {
                    // remove ractive instance if possible
                    instances[ this.root._guid ] -= 1;
                    if ( !instances[ this.root._guid ] ) {
                        index = instances.indexOf( this.root );
                        if ( index === -1 ) {
                            throw new Error( errorMessage );
                        }
                        instances.splice( index, 1 );
                    }
                }
            }
        };
        errorMessage = 'Something went wrong in a rather interesting way';
        return arrayAdaptor;
    }( defineProperty, isArray, viewmodel$get_arrayAdaptor_patch );
 
    /* viewmodel/prototype/get/magicArrayAdaptor.js */
    var viewmodel$get_magicArrayAdaptor = function( magicAdaptor, arrayAdaptor ) {
 
        var magicArrayAdaptor, MagicArrayWrapper;
        if ( magicAdaptor ) {
            magicArrayAdaptor = {
                filter: function( object, keypath, ractive ) {
                    return magicAdaptor.filter( object, keypath, ractive ) && arrayAdaptor.filter( object );
                },
                wrap: function( ractive, array, keypath ) {
                    return new MagicArrayWrapper( ractive, array, keypath );
                }
            };
            MagicArrayWrapper = function( ractive, array, keypath ) {
                this.value = array;
                this.magic = true;
                this.magicWrapper = magicAdaptor.wrap( ractive, array, keypath );
                this.arrayWrapper = arrayAdaptor.wrap( ractive, array, keypath );
            };
            MagicArrayWrapper.prototype = {
                get: function() {
                    return this.value;
                },
                teardown: function() {
                    this.arrayWrapper.teardown();
                    this.magicWrapper.teardown();
                },
                reset: function( value ) {
                    return this.magicWrapper.reset( value );
                }
            };
        }
        return magicArrayAdaptor;
    }( viewmodel$get_magicAdaptor, viewmodel$get_arrayAdaptor );
 
    /* viewmodel/prototype/adapt.js */
    var viewmodel$adapt = function( config, arrayAdaptor, magicAdaptor, magicArrayAdaptor ) {
 
        var prefixers = {};
        return function Viewmodel$adapt( keypath, value ) {
            var ractive = this.ractive,
                len, i, adaptor, wrapped;
            // Do we have an adaptor for this value?
            len = ractive.adapt.length;
            for ( i = 0; i < len; i += 1 ) {
                adaptor = ractive.adapt[ i ];
                // Adaptors can be specified as e.g. [ 'Backbone.Model', 'Backbone.Collection' ] -
                // we need to get the actual adaptor if that's the case
                if ( typeof adaptor === 'string' ) {
                    var found = config.registries.adaptors.find( ractive, adaptor );
                    if ( !found ) {
                        throw new Error( 'Missing adaptor "' + adaptor + '"' );
                    }
                    adaptor = ractive.adapt[ i ] = found;
                }
                if ( adaptor.filter( value, keypath, ractive ) ) {
                    wrapped = this.wrapped[ keypath ] = adaptor.wrap( ractive, value, keypath, getPrefixer( keypath ) );
                    wrapped.value = value;
                    return value;
                }
            }
            if ( ractive.magic ) {
                if ( magicArrayAdaptor.filter( value, keypath, ractive ) ) {
                    this.wrapped[ keypath ] = magicArrayAdaptor.wrap( ractive, value, keypath );
                } else if ( magicAdaptor.filter( value, keypath, ractive ) ) {
                    this.wrapped[ keypath ] = magicAdaptor.wrap( ractive, value, keypath );
                }
            } else if ( ractive.modifyArrays && arrayAdaptor.filter( value, keypath, ractive ) ) {
                this.wrapped[ keypath ] = arrayAdaptor.wrap( ractive, value, keypath );
            }
            return value;
        };
 
        function prefixKeypath( obj, prefix ) {
            var prefixed = {},
                key;
            if ( !prefix ) {
                return obj;
            }
            prefix += '.';
            for ( key in obj ) {
                if ( obj.hasOwnProperty( key ) ) {
                    prefixed[ prefix + key ] = obj[ key ];
                }
            }
            return prefixed;
        }
 
        function getPrefixer( rootKeypath ) {
            var rootDot;
            if ( !prefixers[ rootKeypath ] ) {
                rootDot = rootKeypath ? rootKeypath + '.' : '';
                prefixers[ rootKeypath ] = function( relativeKeypath, value ) {
                    var obj;
                    if ( typeof relativeKeypath === 'string' ) {
                        obj = {};
                        obj[ rootDot + relativeKeypath ] = value;
                        return obj;
                    }
                    if ( typeof relativeKeypath === 'object' ) {
                        // 'relativeKeypath' is in fact a hash, not a keypath
                        return rootDot ? prefixKeypath( relativeKeypath, rootKeypath ) : relativeKeypath;
                    }
                };
            }
            return prefixers[ rootKeypath ];
        }
    }( config, viewmodel$get_arrayAdaptor, viewmodel$get_magicAdaptor, viewmodel$get_magicArrayAdaptor );
 
    /* viewmodel/helpers/getUpstreamChanges.js */
    var getUpstreamChanges = function getUpstreamChanges( changes ) {
        var upstreamChanges = [ '' ],
            i, keypath, keys, upstreamKeypath;
        i = changes.length;
        while ( i-- ) {
            keypath = changes[ i ];
            keys = keypath.split( '.' );
            while ( keys.length > 1 ) {
                keys.pop();
                upstreamKeypath = keys.join( '.' );
                if ( upstreamChanges.indexOf( upstreamKeypath ) === -1 ) {
                    upstreamChanges.push( upstreamKeypath );
                }
            }
        }
        return upstreamChanges;
    };
 
    /* viewmodel/prototype/applyChanges/getPotentialWildcardMatches.js */
    var viewmodel$applyChanges_getPotentialWildcardMatches = function() {
 
        var starMaps = {};
        // This function takes a keypath such as 'foo.bar.baz', and returns
        // all the variants of that keypath that include a wildcard in place
        // of a key, such as 'foo.bar.*', 'foo.*.baz', 'foo.*.*' and so on.
        // These are then checked against the dependants map (ractive.viewmodel.depsMap)
        // to see if any pattern observers are downstream of one or more of
        // these wildcard keypaths (e.g. 'foo.bar.*.status')
        return function getPotentialWildcardMatches( keypath ) {
            var keys, starMap, mapper, result;
            keys = keypath.split( '.' );
            starMap = getStarMap( keys.length );
            mapper = function( star, i ) {
                return star ? '*' : keys[ i ];
            };
            result = starMap.map( function( mask ) {
                return mask.map( mapper ).join( '.' );
            } );
            return result;
        };
        // This function returns all the possible true/false combinations for
        // a given number - e.g. for two, the possible combinations are
        // [ true, true ], [ true, false ], [ false, true ], [ false, false ].
        // It does so by getting all the binary values between 0 and e.g. 11
        function getStarMap( length ) {
            var ones = '',
                max, binary, starMap, mapper, i;
            if ( !starMaps[ length ] ) {
                starMap = [];
                while ( ones.length < length ) {
                    ones += 1;
                }
                max = parseInt( ones, 2 );
                mapper = function( digit ) {
                    return digit === '1';
                };
                for ( i = 0; i <= max; i += 1 ) {
                    binary = i.toString( 2 );
                    while ( binary.length < length ) {
                        binary = '0' + binary;
                    }
                    starMap[ i ] = Array.prototype.map.call( binary, mapper );
                }
                starMaps[ length ] = starMap;
            }
            return starMaps[ length ];
        }
    }();
 
    /* viewmodel/prototype/applyChanges/notifyPatternObservers.js */
    var viewmodel$applyChanges_notifyPatternObservers = function( getPotentialWildcardMatches ) {
 
        var lastKey = /[^\.]+$/;
        return notifyPatternObservers;
 
        function notifyPatternObservers( viewmodel, keypath, onlyDirect ) {
            var potentialWildcardMatches;
            updateMatchingPatternObservers( viewmodel, keypath );
            if ( onlyDirect ) {
                return;
            }
            potentialWildcardMatches = getPotentialWildcardMatches( keypath );
            potentialWildcardMatches.forEach( function( upstreamPattern ) {
                cascade( viewmodel, upstreamPattern, keypath );
            } );
        }
 
        function cascade( viewmodel, upstreamPattern, keypath ) {
            var group, map, actualChildKeypath;
            group = viewmodel.depsMap.patternObservers;
            map = group[ upstreamPattern ];
            if ( map ) {
                map.forEach( function( childKeypath ) {
                    var key = lastKey.exec( childKeypath )[ 0 ];
                    // 'baz'
                    actualChildKeypath = keypath ? keypath + '.' + key : key;
                    // 'foo.bar.baz'
                    updateMatchingPatternObservers( viewmodel, actualChildKeypath );
                    cascade( viewmodel, childKeypath, actualChildKeypath );
                } );
            }
        }
 
        function updateMatchingPatternObservers( viewmodel, keypath ) {
            viewmodel.patternObservers.forEach( function( observer ) {
                if ( observer.regex.test( keypath ) ) {
                    observer.update( keypath );
                }
            } );
        }
    }( viewmodel$applyChanges_getPotentialWildcardMatches );
 
    /* viewmodel/prototype/applyChanges.js */
    var viewmodel$applyChanges = function( getUpstreamChanges, notifyPatternObservers ) {
 
        var unwrap = {
                evaluateWrapped: true
            },
            dependantGroups = [
                'observers',
                'default'
            ];
        return function Viewmodel$applyChanges() {
            var this$0 = this;
            var self = this,
                changes, upstreamChanges, allChanges = [],
                computations, addComputations, cascade, hash = {};
            if ( !this.changes.length ) {
                // TODO we end up here on initial render. Perhaps we shouldn't?
                return;
            }
            addComputations = function( keypath ) {
                var newComputations;
                if ( newComputations = self.deps.computed[ keypath ] ) {
                    addNewItems( computations, newComputations );
                }
            };
            cascade = function( keypath ) {
                var map;
                addComputations( keypath );
                if ( map = self.depsMap.computed[ keypath ] ) {
                    map.forEach( cascade );
                }
            };
            // Find computations and evaluators that are invalidated by
            // these changes. If they have changed, add them to the
            // list of changes. Lather, rinse and repeat until the
            // system is settled
            do {
                changes = this.changes;
                addNewItems( allChanges, changes );
                this.changes = [];
                computations = [];
                upstreamChanges = getUpstreamChanges( changes );
                upstreamChanges.forEach( addComputations );
                changes.forEach( cascade );
                computations.forEach( updateComputation );
            } while ( this.changes.length );
            upstreamChanges = getUpstreamChanges( allChanges );
            // Pattern observers are a weird special case
            if ( this.patternObservers.length ) {
                upstreamChanges.forEach( function( keypath ) {
                    return notifyPatternObservers( this$0, keypath, true );
                } );
                allChanges.forEach( function( keypath ) {
                    return notifyPatternObservers( this$0, keypath );
                } );
            }
            dependantGroups.forEach( function( group ) {
                if ( !this$0.deps[ group ] ) {
                    return;
                }
                upstreamChanges.forEach( function( keypath ) {
                    return notifyUpstreamDependants( this$0, keypath, group );
                } );
                notifyAllDependants( this$0, allChanges, group );
            } );
            // Return a hash of keypaths to updated values
            allChanges.forEach( function( keypath ) {
                hash[ keypath ] = this$0.get( keypath );
            } );
            this.implicitChanges = {};
            return hash;
        };
 
        function updateComputation( computation ) {
            computation.update();
        }
 
        function notifyUpstreamDependants( viewmodel, keypath, groupName ) {
            var dependants, value;
            if ( dependants = findDependants( viewmodel, keypath, groupName ) ) {
                value = viewmodel.get( keypath, unwrap );
                dependants.forEach( function( d ) {
                    return d.setValue( value );
                } );
            }
        }
 
        function notifyAllDependants( viewmodel, keypaths, groupName ) {
            var queue = [];
            addKeypaths( keypaths );
            queue.forEach( dispatch );
 
            function addKeypaths( keypaths ) {
                keypaths.forEach( addKeypath );
                keypaths.forEach( cascade );
            }
 
            function addKeypath( keypath ) {
                var deps = findDependants( viewmodel, keypath, groupName );
                if ( deps ) {
                    queue.push( {
                        keypath: keypath,
                        deps: deps
                    } );
                }
            }
 
            function cascade( keypath ) {
                var childDeps;
                if ( childDeps = viewmodel.depsMap[ groupName ][ keypath ] ) {
                    addKeypaths( childDeps );
                }
            }
 
            function dispatch( set ) {
                var value = viewmodel.get( set.keypath, unwrap );
                set.deps.forEach( function( d ) {
                    return d.setValue( value );
                } );
            }
        }
 
        function findDependants( viewmodel, keypath, groupName ) {
            var group = viewmodel.deps[ groupName ];
            return group ? group[ keypath ] : null;
        }
 
        function addNewItems( arr, items ) {
            items.forEach( function( item ) {
                if ( arr.indexOf( item ) === -1 ) {
                    arr.push( item );
                }
            } );
        }
    }( getUpstreamChanges, viewmodel$applyChanges_notifyPatternObservers );
 
    /* viewmodel/prototype/capture.js */
    var viewmodel$capture = function Viewmodel$capture() {
        this.capturing = true;
        this.captured = [];
    };
 
    /* viewmodel/prototype/clearCache.js */
    var viewmodel$clearCache = function Viewmodel$clearCache( keypath, dontTeardownWrapper ) {
        var cacheMap, wrapper, computation;
        if ( !dontTeardownWrapper ) {
            // Is there a wrapped property at this keypath?
            if ( wrapper = this.wrapped[ keypath ] ) {
                // Did we unwrap it?
                if ( wrapper.teardown() !== false ) {
                    this.wrapped[ keypath ] = null;
                }
            }
        }
        if ( computation = this.computations[ keypath ] ) {
            computation.compute();
        }
        this.cache[ keypath ] = undefined;
        if ( cacheMap = this.cacheMap[ keypath ] ) {
            while ( cacheMap.length ) {
                this.clearCache( cacheMap.pop() );
            }
        }
    };
 
    /* viewmodel/prototype/get/FAILED_LOOKUP.js */
    var viewmodel$get_FAILED_LOOKUP = {
        FAILED_LOOKUP: true
    };
 
    /* viewmodel/prototype/get/UnresolvedImplicitDependency.js */
    var viewmodel$get_UnresolvedImplicitDependency = function( removeFromArray, runloop ) {
 
        var empty = {};
        var UnresolvedImplicitDependency = function( viewmodel, keypath ) {
            this.viewmodel = viewmodel;
            this.root = viewmodel.ractive;
            // TODO eliminate this
            this.ref = keypath;
            this.parentFragment = empty;
            viewmodel.unresolvedImplicitDependencies[ keypath ] = true;
            viewmodel.unresolvedImplicitDependencies.push( this );
            runloop.addUnresolved( this );
        };
        UnresolvedImplicitDependency.prototype = {
            resolve: function() {
                this.viewmodel.mark( this.ref );
                this.viewmodel.unresolvedImplicitDependencies[ this.ref ] = false;
                removeFromArray( this.viewmodel.unresolvedImplicitDependencies, this );
            },
            teardown: function() {
                runloop.removeUnresolved( this );
            }
        };
        return UnresolvedImplicitDependency;
    }( removeFromArray, runloop );
 
    /* viewmodel/prototype/get.js */
    var viewmodel$get = function( FAILED_LOOKUP, UnresolvedImplicitDependency ) {
 
        var empty = {};
        return function Viewmodel$get( keypath ) {
            var options = arguments[ 1 ];
            if ( options === void 0 )
                options = empty;
            var ractive = this.ractive,
                cache = this.cache,
                value, computation, wrapped, evaluator;
            if ( cache[ keypath ] === undefined ) {
                // Is this a computed property?
                if ( computation = this.computations[ keypath ] ) {
                    value = computation.value;
                } else if ( wrapped = this.wrapped[ keypath ] ) {
                    value = wrapped.value;
                } else if ( !keypath ) {
                    this.adapt( '', ractive.data );
                    value = ractive.data;
                } else if ( evaluator = this.evaluators[ keypath ] ) {
                    value = evaluator.value;
                } else {
                    value = retrieve( this, keypath );
                }
                cache[ keypath ] = value;
            } else {
                value = cache[ keypath ];
            }
            if ( options.evaluateWrapped && ( wrapped = this.wrapped[ keypath ] ) ) {
                value = wrapped.get();
            }
            // capture the keypath, if we're inside a computation or evaluator
            if ( options.capture && this.capturing && this.captured.indexOf( keypath ) === -1 ) {
                this.captured.push( keypath );
                // if we couldn't resolve the keypath, we need to make it as a failed
                // lookup, so that the evaluator updates correctly once we CAN
                // resolve the keypath
                if ( value === FAILED_LOOKUP && this.unresolvedImplicitDependencies[ keypath ] !== true ) {
                    new UnresolvedImplicitDependency( this, keypath );
                }
            }
            return value === FAILED_LOOKUP ? void 0 : value;
        };
 
        function retrieve( viewmodel, keypath ) {
            var keys, key, parentKeypath, parentValue, cacheMap, value, wrapped;
            keys = keypath.split( '.' );
            key = keys.pop();
            parentKeypath = keys.join( '.' );
            parentValue = viewmodel.get( parentKeypath );
            if ( wrapped = viewmodel.wrapped[ parentKeypath ] ) {
                parentValue = wrapped.get();
            }
            if ( parentValue === null || parentValue === undefined ) {
                return;
            }
            // update cache map
            if ( !( cacheMap = viewmodel.cacheMap[ parentKeypath ] ) ) {
                viewmodel.cacheMap[ parentKeypath ] = [ keypath ];
            } else {
                if ( cacheMap.indexOf( keypath ) === -1 ) {
                    cacheMap.push( keypath );
                }
            }
            // If this property doesn't exist, we return a sentinel value
            // so that we know to query parent scope (if such there be)
            if ( typeof parentValue === 'object' && !( key in parentValue ) ) {
                return viewmodel.cache[ keypath ] = FAILED_LOOKUP;
            }
            value = parentValue[ key ];
            // Do we have an adaptor for this value?
            viewmodel.adapt( keypath, value, false );
            // Update cache
            viewmodel.cache[ keypath ] = value;
            return value;
        }
    }( viewmodel$get_FAILED_LOOKUP, viewmodel$get_UnresolvedImplicitDependency );
 
    /* viewmodel/prototype/mark.js */
    var viewmodel$mark = function Viewmodel$mark( keypath, isImplicitChange ) {
        // implicit changes (i.e. `foo.length` on `ractive.push('foo',42)`)
        // should not be picked up by pattern observers
        if ( isImplicitChange ) {
            this.implicitChanges[ keypath ] = true;
        }
        if ( this.changes.indexOf( keypath ) === -1 ) {
            this.changes.push( keypath );
            this.clearCache( keypath );
        }
    };
 
    /* viewmodel/prototype/merge/mapOldToNewIndex.js */
    var viewmodel$merge_mapOldToNewIndex = function( oldArray, newArray ) {
        var usedIndices, firstUnusedIndex, newIndices, changed;
        usedIndices = {};
        firstUnusedIndex = 0;
        newIndices = oldArray.map( function( item, i ) {
            var index, start, len;
            start = firstUnusedIndex;
            len = newArray.length;
            do {
                index = newArray.indexOf( item, start );
                if ( index === -1 ) {
                    changed = true;
                    return -1;
                }
                start = index + 1;
            } while ( usedIndices[ index ] && start < len );
            // keep track of the first unused index, so we don't search
            // the whole of newArray for each item in oldArray unnecessarily
            if ( index === firstUnusedIndex ) {
                firstUnusedIndex += 1;
            }
            if ( index !== i ) {
                changed = true;
            }
            usedIndices[ index ] = true;
            return index;
        } );
        newIndices.unchanged = !changed;
        return newIndices;
    };
 
    /* viewmodel/prototype/merge.js */
    var viewmodel$merge = function( warn, mapOldToNewIndex ) {
 
        var comparators = {};
        return function Viewmodel$merge( keypath, currentArray, array, options ) {
            var this$0 = this;
            var oldArray, newArray, comparator, newIndices, dependants;
            this.mark( keypath );
            if ( options && options.compare ) {
                comparator = getComparatorFunction( options.compare );
                try {
                    oldArray = currentArray.map( comparator );
                    newArray = array.map( comparator );
                } catch ( err ) {
                    // fallback to an identity check - worst case scenario we have
                    // to do more DOM manipulation than we thought...
                    // ...unless we're in debug mode of course
                    if ( this.debug ) {
                        throw err;
                    } else {
                        warn( 'Merge operation: comparison failed. Falling back to identity checking' );
                    }
                    oldArray = currentArray;
                    newArray = array;
                }
            } else {
                oldArray = currentArray;
                newArray = array;
            }
            // find new indices for members of oldArray
            newIndices = mapOldToNewIndex( oldArray, newArray );
            // Indices that are being removed should be marked as dirty
            newIndices.forEach( function( newIndex, oldIndex ) {
                if ( newIndex === -1 ) {
                    this$0.mark( keypath + '.' + oldIndex );
                }
            } );
            // Update the model
            // TODO allow existing array to be updated in place, rather than replaced?
            this.set( keypath, array, true );
            if ( dependants = this.deps[ 'default' ][ keypath ] ) {
                dependants.filter( canMerge ).forEach( function( dependant ) {
                    return dependant.merge( newIndices );
                } );
            }
            if ( currentArray.length !== array.length ) {
                this.mark( keypath + '.length', true );
            }
        };
 
        function canMerge( dependant ) {
            return typeof dependant.merge === 'function';
        }
 
        function stringify( item ) {
            return JSON.stringify( item );
        }
 
        function getComparatorFunction( comparator ) {
            // If `compare` is `true`, we use JSON.stringify to compare
            // objects that are the same shape, but non-identical - i.e.
            // { foo: 'bar' } !== { foo: 'bar' }
            if ( comparator === true ) {
                return stringify;
            }
            if ( typeof comparator === 'string' ) {
                if ( !comparators[ comparator ] ) {
                    comparators[ comparator ] = function( item ) {
                        return item[ comparator ];
                    };
                }
                return comparators[ comparator ];
            }
            if ( typeof comparator === 'function' ) {
                return comparator;
            }
            throw new Error( 'The `compare` option must be a function, or a string representing an identifying field (or `true` to use JSON.stringify)' );
        }
    }( warn, viewmodel$merge_mapOldToNewIndex );
 
    /* viewmodel/prototype/register.js */
    var viewmodel$register = function() {
 
        return function Viewmodel$register( keypath, dependant ) {
            var group = arguments[ 2 ];
            if ( group === void 0 )
                group = 'default';
            var depsByKeypath, deps, evaluator;
            if ( dependant.isStatic ) {
                return;
            }
            depsByKeypath = this.deps[ group ] || ( this.deps[ group ] = {} );
            deps = depsByKeypath[ keypath ] || ( depsByKeypath[ keypath ] = [] );
            deps.push( dependant );
            if ( !keypath ) {
                return;
            }
            if ( evaluator = this.evaluators[ keypath ] ) {
                if ( !evaluator.dependants ) {
                    evaluator.wake();
                }
                evaluator.dependants += 1;
            }
            updateDependantsMap( this, keypath, group );
        };
 
        function updateDependantsMap( viewmodel, keypath, group ) {
            var keys, parentKeypath, map, parent;
            // update dependants map
            keys = keypath.split( '.' );
            while ( keys.length ) {
                keys.pop();
                parentKeypath = keys.join( '.' );
                map = viewmodel.depsMap[ group ] || ( viewmodel.depsMap[ group ] = {} );
                parent = map[ parentKeypath ] || ( map[ parentKeypath ] = [] );
                if ( parent[ keypath ] === undefined ) {
                    parent[ keypath ] = 0;
                    parent.push( keypath );
                }
                parent[ keypath ] += 1;
                keypath = parentKeypath;
            }
        }
    }();
 
    /* viewmodel/prototype/release.js */
    var viewmodel$release = function Viewmodel$release() {
        this.capturing = false;
        return this.captured;
    };
 
    /* viewmodel/prototype/set.js */
    var viewmodel$set = function( isEqual, createBranch ) {
 
        return function Viewmodel$set( keypath, value, silent ) {
            var keys, lastKey, parentKeypath, parentValue, computation, wrapper, evaluator, dontTeardownWrapper;
            if ( isEqual( this.cache[ keypath ], value ) ) {
                return;
            }
            computation = this.computations[ keypath ];
            wrapper = this.wrapped[ keypath ];
            evaluator = this.evaluators[ keypath ];
            if ( computation && !computation.setting ) {
                computation.set( value );
            }
            // If we have a wrapper with a `reset()` method, we try and use it. If the
            // `reset()` method returns false, the wrapper should be torn down, and
            // (most likely) a new one should be created later
            if ( wrapper && wrapper.reset ) {
                dontTeardownWrapper = wrapper.reset( value ) !== false;
                if ( dontTeardownWrapper ) {
                    value = wrapper.get();
                }
            }
            // Update evaluator value. This may be from the evaluator itself, or
            // it may be from the wrapper that wraps an evaluator's result - it
            // doesn't matter
            if ( evaluator ) {
                evaluator.value = value;
            }
            if ( !computation && !evaluator && !dontTeardownWrapper ) {
                keys = keypath.split( '.' );
                lastKey = keys.pop();
                parentKeypath = keys.join( '.' );
                wrapper = this.wrapped[ parentKeypath ];
                if ( wrapper && wrapper.set ) {
                    wrapper.set( lastKey, value );
                } else {
                    parentValue = wrapper ? wrapper.get() : this.get( parentKeypath );
                    if ( !parentValue ) {
                        parentValue = createBranch( lastKey );
                        this.set( parentKeypath, parentValue, true );
                    }
                    parentValue[ lastKey ] = value;
                }
            }
            if ( !silent ) {
                this.mark( keypath );
            } else {
                // We're setting a parent of the original target keypath (i.e.
                // creating a fresh branch) - we need to clear the cache, but
                // not mark it as a change
                this.clearCache( keypath );
            }
        };
    }( isEqual, createBranch );
 
    /* viewmodel/prototype/splice.js */
    var viewmodel$splice = function( types ) {
 
        return function Viewmodel$splice( keypath, spliceSummary ) {
            var viewmodel = this,
                i, dependants;
            // Mark changed keypaths
            for ( i = spliceSummary.rangeStart; i < spliceSummary.rangeEnd; i += 1 ) {
                viewmodel.mark( keypath + '.' + i );
            }
            if ( spliceSummary.balance ) {
                viewmodel.mark( keypath + '.length', true );
            }
            // Trigger splice operations
            if ( dependants = viewmodel.deps[ 'default' ][ keypath ] ) {
                dependants.filter( canSplice ).forEach( function( dependant ) {
                    return dependant.splice( spliceSummary );
                } );
            }
        };
 
        function canSplice( dependant ) {
            return dependant.type === types.SECTION && !dependant.inverted && dependant.rendered;
        }
    }( types );
 
    /* viewmodel/prototype/teardown.js */
    var viewmodel$teardown = function Viewmodel$teardown() {
        var this$0 = this;
        var unresolvedImplicitDependency;
        // Clear entire cache - this has the desired side-effect
        // of unwrapping adapted values (e.g. arrays)
        Object.keys( this.cache ).forEach( function( keypath ) {
            return this$0.clearCache( keypath );
        } );
        // Teardown any failed lookups - we don't need them to resolve any more
        while ( unresolvedImplicitDependency = this.unresolvedImplicitDependencies.pop() ) {
            unresolvedImplicitDependency.teardown();
        }
    };
 
    /* viewmodel/prototype/unregister.js */
    var viewmodel$unregister = function() {
 
        return function Viewmodel$unregister( keypath, dependant ) {
            var group = arguments[ 2 ];
            if ( group === void 0 )
                group = 'default';
            var deps, index, evaluator;
            if ( dependant.isStatic ) {
                return;
            }
            deps = this.deps[ group ][ keypath ];
            index = deps.indexOf( dependant );
            if ( index === -1 ) {
                throw new Error( 'Attempted to remove a dependant that was no longer registered! This should not happen. If you are seeing this bug in development please raise an issue at https://github.com/RactiveJS/Ractive/issues - thanks' );
            }
            deps.splice( index, 1 );
            if ( !keypath ) {
                return;
            }
            if ( evaluator = this.evaluators[ keypath ] ) {
                evaluator.dependants -= 1;
                if ( !evaluator.dependants ) {
                    evaluator.sleep();
                }
            }
            updateDependantsMap( this, keypath, group );
        };
 
        function updateDependantsMap( viewmodel, keypath, group ) {
            var keys, parentKeypath, map, parent;
            // update dependants map
            keys = keypath.split( '.' );
            while ( keys.length ) {
                keys.pop();
                parentKeypath = keys.join( '.' );
                map = viewmodel.depsMap[ group ];
                parent = map[ parentKeypath ];
                parent[ keypath ] -= 1;
                if ( !parent[ keypath ] ) {
                    // remove from parent deps map
                    parent.splice( parent.indexOf( keypath ), 1 );
                    parent[ keypath ] = undefined;
                }
                keypath = parentKeypath;
            }
        }
    }();
 
    /* viewmodel/Computation/getComputationSignature.js */
    var getComputationSignature = function() {
 
        var pattern = /\$\{([^\}]+)\}/g;
        return function( signature ) {
            if ( typeof signature === 'function' ) {
                return {
                    get: signature
                };
            }
            if ( typeof signature === 'string' ) {
                return {
                    get: createFunctionFromString( signature )
                };
            }
            if ( typeof signature === 'object' && typeof signature.get === 'string' ) {
                signature = {
                    get: createFunctionFromString( signature.get ),
                    set: signature.set
                };
            }
            return signature;
        };
 
        function createFunctionFromString( signature ) {
            var functionBody = 'var __ractive=this;return(' + signature.replace( pattern, function( match, keypath ) {
                return '__ractive.get("' + keypath + '")';
            } ) + ')';
            return new Function( functionBody );
        }
    }();
 
    /* viewmodel/Computation/Computation.js */
    var Computation = function( log, isEqual, diff ) {
 
        var Computation = function( ractive, key, signature ) {
            this.ractive = ractive;
            this.viewmodel = ractive.viewmodel;
            this.key = key;
            this.getter = signature.get;
            this.setter = signature.set;
            this.dependencies = [];
            this.update();
        };
        Computation.prototype = {
            set: function( value ) {
                if ( this.setting ) {
                    this.value = value;
                    return;
                }
                if ( !this.setter ) {
                    throw new Error( 'Computed properties without setters are read-only. (This may change in a future version of Ractive!)' );
                }
                this.setter.call( this.ractive, value );
            },
            // returns `false` if the computation errors
            compute: function() {
                var ractive, errored, newDependencies;
                ractive = this.ractive;
                ractive.viewmodel.capture();
                try {
                    this.value = this.getter.call( ractive );
                } catch ( err ) {
                    log.warn( {
                        debug: ractive.debug,
                        message: 'failedComputation',
                        args: {
                            key: this.key,
                            err: err.message || err
                        }
                    } );
                    errored = true;
                }
                newDependencies = ractive.viewmodel.release();
                diff( this, this.dependencies, newDependencies );
                return errored ? false : true;
            },
            update: function() {
                var oldValue = this.value;
                if ( this.compute() && !isEqual( this.value, oldValue ) ) {
                    this.ractive.viewmodel.mark( this.key );
                }
            }
        };
        return Computation;
    }( log, isEqual, diff );
 
    /* viewmodel/Computation/createComputations.js */
    var createComputations = function( getComputationSignature, Computation ) {
 
        return function createComputations( ractive, computed ) {
            var key, signature;
            for ( key in computed ) {
                signature = getComputationSignature( computed[ key ] );
                ractive.viewmodel.computations[ key ] = new Computation( ractive, key, signature );
            }
        };
    }( getComputationSignature, Computation );
 
    /* viewmodel/adaptConfig.js */
    var adaptConfig = function() {
 
        // should this be combined with prototype/adapt.js?
        var configure = {
            lookup: function( target, adaptors ) {
                var i, adapt = target.adapt;
                if ( !adapt || !adapt.length ) {
                    return adapt;
                }
                if ( adaptors && Object.keys( adaptors ).length && ( i = adapt.length ) ) {
                    while ( i-- ) {
                        var adaptor = adapt[ i ];
                        if ( typeof adaptor === 'string' ) {
                            adapt[ i ] = adaptors[ adaptor ] || adaptor;
                        }
                    }
                }
                return adapt;
            },
            combine: function( parent, adapt ) {
                // normalize 'Foo' to [ 'Foo' ]
                parent = arrayIfString( parent );
                adapt = arrayIfString( adapt );
                // no parent? return adapt
                if ( !parent || !parent.length ) {
                    return adapt;
                }
                // no adapt? return 'copy' of parent
                if ( !adapt || !adapt.length ) {
                    return parent.slice();
                }
                // add parent adaptors to options
                parent.forEach( function( a ) {
                    // don't put in duplicates
                    if ( adapt.indexOf( a ) === -1 ) {
                        adapt.push( a );
                    }
                } );
                return adapt;
            }
        };
 
        function arrayIfString( adapt ) {
            if ( typeof adapt === 'string' ) {
                adapt = [ adapt ];
            }
            return adapt;
        }
        return configure;
    }();
 
    /* viewmodel/Viewmodel.js */
    var Viewmodel = function( create, adapt, applyChanges, capture, clearCache, get, mark, merge, register, release, set, splice, teardown, unregister, createComputations, adaptConfig ) {
 
        // TODO: fix our ES6 modules so we can have multiple exports
        // then this magic check can be reused by magicAdaptor
        var noMagic;
        try {
            Object.defineProperty( {}, 'test', {
                value: 0
            } );
        } catch ( err ) {
            noMagic = true;
        }
        var Viewmodel = function( ractive ) {
            this.ractive = ractive;
            // TODO eventually, we shouldn't need this reference
            Viewmodel.extend( ractive.constructor, ractive );
            //this.ractive.data
            this.cache = {};
            // we need to be able to use hasOwnProperty, so can't inherit from null
            this.cacheMap = create( null );
            this.deps = {
                computed: {},
                'default': {}
            };
            this.depsMap = {
                computed: {},
                'default': {}
            };
            this.patternObservers = [];
            this.wrapped = create( null );
            // TODO these are conceptually very similar. Can they be merged somehow?
            this.evaluators = create( null );
            this.computations = create( null );
            this.captured = null;
            this.unresolvedImplicitDependencies = [];
            this.changes = [];
            this.implicitChanges = {};
        };
        Viewmodel.extend = function( Parent, instance ) {
            if ( instance.magic && noMagic ) {
                throw new Error( 'Getters and setters (magic mode) are not supported in this browser' );
            }
            instance.adapt = adaptConfig.combine( Parent.prototype.adapt, instance.adapt ) || [];
            instance.adapt = adaptConfig.lookup( instance, instance.adaptors );
        };
        Viewmodel.prototype = {
            adapt: adapt,
            applyChanges: applyChanges,
            capture: capture,
            clearCache: clearCache,
            get: get,
            mark: mark,
            merge: merge,
            register: register,
            release: release,
            set: set,
            splice: splice,
            teardown: teardown,
            unregister: unregister,
            // createComputations, in the computations, may call back through get or set
            // of ractive. So, for now, we delay creation of computed from constructor.
            // on option would be to have the Computed class be lazy about using .update()
            compute: function() {
                createComputations( this.ractive, this.ractive.computed );
            }
        };
        return Viewmodel;
    }( create, viewmodel$adapt, viewmodel$applyChanges, viewmodel$capture, viewmodel$clearCache, viewmodel$get, viewmodel$mark, viewmodel$merge, viewmodel$register, viewmodel$release, viewmodel$set, viewmodel$splice, viewmodel$teardown, viewmodel$unregister, createComputations, adaptConfig );
 
    /* Ractive/initialise.js */
    var Ractive_initialise = function( config, create, getElement, getNextNumber, Viewmodel, Fragment ) {
 
        return function initialiseRactiveInstance( ractive ) {
            var options = arguments[ 1 ];
            if ( options === void 0 )
                options = {};
            initialiseProperties( ractive, options );
            // init config from Parent and options
            config.init( ractive.constructor, ractive, options );
            // TEMPORARY. This is so we can implement Viewmodel gradually
            ractive.viewmodel = new Viewmodel( ractive );
            // hacky circular problem until we get this sorted out
            // if viewmodel immediately processes computed properties,
            // they may call ractive.get, which calls ractive.viewmodel,
            // which hasn't been set till line above finishes.
            ractive.viewmodel.compute();
            // Render our *root fragment*
            if ( ractive.template ) {
                ractive.fragment = new Fragment( {
                    template: ractive.template,
                    root: ractive,
                    owner: ractive
                } );
            }
            ractive.viewmodel.applyChanges();
            // render automatically ( if `el` is specified )
            tryRender( ractive );
        };
 
        function tryRender( ractive ) {
            var el;
            if ( el = getElement( ractive.el ) ) {
                var wasEnabled = ractive.transitionsEnabled;
                // Temporarily disable transitions, if `noIntro` flag is set
                if ( ractive.noIntro ) {
                    ractive.transitionsEnabled = false;
                }
                // If the target contains content, and `append` is falsy, clear it
                if ( el && !ractive.append ) {
                    // Tear down any existing instances on this element
                    if ( el.__ractive_instances__ ) {
                        try {
                            el.__ractive_instances__.splice( 0, el.__ractive_instances__.length ).forEach( function( r ) {
                                return r.teardown();
                            } );
                        } catch ( err ) {}
                    }
                    el.innerHTML = '';
                }
                ractive.render( el, ractive.append );
                // reset transitionsEnabled
                ractive.transitionsEnabled = wasEnabled;
            }
        }
 
        function initialiseProperties( ractive, options ) {
            // Generate a unique identifier, for places where you'd use a weak map if it
            // existed
            ractive._guid = getNextNumber();
            // events
            ractive._subs = create( null );
            // storage for item configuration from instantiation to reset,
            // like dynamic functions or original values
            ractive._config = {};
            // two-way bindings
            ractive._twowayBindings = create( null );
            // animations (so we can stop any in progress at teardown)
            ractive._animations = [];
            // nodes registry
            ractive.nodes = {};
            // live queries
            ractive._liveQueries = [];
            ractive._liveComponentQueries = [];
            // If this is a component, store a reference to the parent
            if ( options._parent && options._component ) {
                ractive._parent = options._parent;
                ractive.component = options._component;
                // And store a reference to the instance on the component
                options._component.instance = ractive;
            }
        }
    }( config, create, getElement, getNextNumber, Viewmodel, Fragment );
 
    /* extend/initChildInstance.js */
    var initChildInstance = function( initialise ) {
 
        // The Child constructor contains the default init options for this class
        return function initChildInstance( child, Child, options ) {
            if ( child.beforeInit ) {
                child.beforeInit( options );
            }
            initialise( child, options );
        };
    }( Ractive_initialise );
 
    /* extend/childOptions.js */
    var childOptions = function( wrapPrototype, wrap, config, circular ) {
 
        var Ractive,
            // would be nice to not have these here,
            // they get added during initialise, so for now we have
            // to make sure not to try and extend them.
            // Possibly, we could re-order and not add till later
            // in process.
            blacklisted = {
                '_parent': true,
                '_component': true
            },
            childOptions = {
                toPrototype: toPrototype,
                toOptions: toOptions
            },
            registries = config.registries;
        config.keys.forEach( function( key ) {
            return blacklisted[ key ] = true;
        } );
        circular.push( function() {
            Ractive = circular.Ractive;
        } );
        return childOptions;
 
        function toPrototype( parent, proto, options ) {
            for ( var key in options ) {
                if ( !( key in blacklisted ) && options.hasOwnProperty( key ) ) {
                    var member = options[ key ];
                    // if this is a method that overwrites a method, wrap it:
                    if ( typeof member === 'function' ) {
                        member = wrapPrototype( parent, key, member );
                    }
                    proto[ key ] = member;
                }
            }
        }
 
        function toOptions( Child ) {
            if ( !( Child.prototype instanceof Ractive ) ) {
                return Child;
            }
            var options = {};
            while ( Child ) {
                registries.forEach( function( r ) {
                    addRegistry( r.useDefaults ? Child.prototype : Child, options, r.name );
                } );
                Object.keys( Child.prototype ).forEach( function( key ) {
                    if ( key === 'computed' ) {
                        return;
                    }
                    var value = Child.prototype[ key ];
                    if ( !( key in options ) ) {
                        options[ key ] = value._method ? value._method : value;
                    } else if ( typeof options[ key ] === 'function' && typeof value === 'function' && options[ key ]._method ) {
                        var result, needsSuper = value._method;
                        if ( needsSuper ) {
                            value = value._method;
                        }
                        // rewrap bound directly to parent fn
                        result = wrap( options[ key ]._method, value );
                        if ( needsSuper ) {
                            result._method = result;
                        }
                        options[ key ] = result;
                    }
                } );
                if ( Child._parent !== Ractive ) {
                    Child = Child._parent;
                } else {
                    Child = false;
                }
            }
            return options;
        }
 
        function addRegistry( target, options, name ) {
            var registry, keys = Object.keys( target[ name ] );
            if ( !keys.length ) {
                return;
            }
            if ( !( registry = options[ name ] ) ) {
                registry = options[ name ] = {};
            }
            keys.filter( function( key ) {
                return !( key in registry );
            } ).forEach( function( key ) {
                return registry[ key ] = target[ name ][ key ];
            } );
        }
    }( wrapPrototypeMethod, wrapMethod, config, circular );
 
    /* extend/_extend.js */
    var Ractive_extend = function( create, defineProperties, getGuid, config, initChildInstance, Viewmodel, childOptions ) {
 
        return function extend() {
            var options = arguments[ 0 ];
            if ( options === void 0 )
                options = {};
            var Parent = this,
                Child, proto, staticProperties;
            // if we're extending with another Ractive instance, inherit its
            // prototype methods and default options as well
            options = childOptions.toOptions( options );
            // create Child constructor
            Child = function( options ) {
                initChildInstance( this, Child, options );
            };
            proto = create( Parent.prototype );
            proto.constructor = Child;
            staticProperties = {
                // each component needs a guid, for managing CSS etc
                _guid: {
                    value: getGuid()
                },
                // alias prototype as defaults
                defaults: {
                    value: proto
                },
                // extendable
                extend: {
                    value: extend,
                    writable: true,
                    configurable: true
                },
                // Parent - for IE8, can't use Object.getPrototypeOf
                _parent: {
                    value: Parent
                }
            };
            defineProperties( Child, staticProperties );
            // extend configuration
            config.extend( Parent, proto, options );
            Viewmodel.extend( Parent, proto );
            // and any other properties or methods on options...
            childOptions.toPrototype( Parent.prototype, proto, options );
            Child.prototype = proto;
            return Child;
        };
    }( create, defineProperties, getGuid, config, initChildInstance, Viewmodel, childOptions );
 
    /* Ractive.js */
    var Ractive = function( defaults, easing, interpolators, svg, magic, defineProperties, proto, Promise, extendObj, extend, parse, initialise, circular ) {
 
        var Ractive, properties;
        // Main Ractive required object
        Ractive = function( options ) {
            initialise( this, options );
        };
        // Ractive properties
        properties = {
            // static methods:
            extend: {
                value: extend
            },
            parse: {
                value: parse
            },
            // Namespaced constructors
            Promise: {
                value: Promise
            },
            // support
            svg: {
                value: svg
            },
            magic: {
                value: magic
            },
            // version
            VERSION: {
                value: '0.5.3'
            },
            // Plugins
            adaptors: {
                writable: true,
                value: {}
            },
            components: {
                writable: true,
                value: {}
            },
            decorators: {
                writable: true,
                value: {}
            },
            easing: {
                writable: true,
                value: easing
            },
            events: {
                writable: true,
                value: {}
            },
            interpolators: {
                writable: true,
                value: interpolators
            },
            partials: {
                writable: true,
                value: {}
            },
            transitions: {
                writable: true,
                value: {}
            }
        };
        // Ractive properties
        defineProperties( Ractive, properties );
        Ractive.prototype = extendObj( proto, defaults );
        Ractive.prototype.constructor = Ractive;
        // alias prototype as defaults
        Ractive.defaults = Ractive.prototype;
        // Certain modules have circular dependencies. If we were bundling a
        // module loader, e.g. almond.js, this wouldn't be a problem, but we're
        // not - we're using amdclean as part of the build process. Because of
        // this, we need to wait until all modules have loaded before those
        // circular dependencies can be required.
        circular.Ractive = Ractive;
        while ( circular.length ) {
            circular.pop()();
        }
        // Ractive.js makes liberal use of things like Array.prototype.indexOf. In
        // older browsers, these are made available via a shim - here, we do a quick
        // pre-flight check to make sure that either a) we're not in a shit browser,
        // or b) we're using a Ractive-legacy.js build
        var FUNCTION = 'function';
        if ( typeof Date.now !== FUNCTION || typeof String.prototype.trim !== FUNCTION || typeof Object.keys !== FUNCTION || typeof Array.prototype.indexOf !== FUNCTION || typeof Array.prototype.forEach !== FUNCTION || typeof Array.prototype.map !== FUNCTION || typeof Array.prototype.filter !== FUNCTION || typeof window !== 'undefined' && typeof window.addEventListener !== FUNCTION ) {
            throw new Error( 'It looks like you\'re attempting to use Ractive.js in an older browser. You\'ll need to use one of the \'legacy builds\' in order to continue - see http://docs.ractivejs.org/latest/legacy-builds for more information.' );
        }
        return Ractive;
    }( options, easing, interpolators, svg, magic, defineProperties, prototype, Promise, extend, Ractive_extend, parse, Ractive_initialise, circular );
 
 
    // export as Common JS module...
    if ( typeof module !== "undefined" && module.exports ) {
        module.exports = Ractive;
    }
 
    // ... or as AMD module
    else if ( typeof define === "function" && define.amd ) {
        define( function() {
            return Ractive;
        } );
    }
 
    // ... or as browser global
    global.Ractive = Ractive;
 
    Ractive.noConflict = function() {
        global.Ractive = noConflict;
        return Ractive;
    };
 
}( typeof window !== 'undefined' ? window : this ) );
