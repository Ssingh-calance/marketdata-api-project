const array = require('@barchart/common-js/lang/array'),
  assert = require('@barchart/common-js/lang/assert'),
  object = require('@barchart/common-js/lang/object');

const ConnectionBase = require('../../connection/ConnectionBase'),
  parseMessage = require('./../utilities/parse/ddf/message');

const retrieveExchanges = require('./snapshots/exchanges/retrieveExchanges'),
  retrieveProfileExtensions = require('./snapshots/profiles/retrieveExtensions'),
  retrieveQuoteSnapshots = require('./snapshots/quotes/retrieveSnapshots'),
  retrieveQuoteExtensions = require('./snapshots/quotes/retrieveExtensions'),
  SymbolParser = require('./../utilities/parsers/SymbolParser');

const DiagnosticsControllerBase = require('./diagnostics/DiagnosticsControllerBase');

const LoggerFactory = require('./../logging/LoggerFactory');

module.exports = (() => {
  'use strict';

  const _API_VERSION = 4;

  const mode = {
    credentials: 'credentials',
    token: 'token'
  };

  const state = {
    connecting: 'CONNECTING',
    authenticating: 'LOGGING_IN',
    authenticated: 'LOGGED_IN',
    disconnected: 'DISCONNECTED'
  };

  const ascii = {
    soh: '\x01',
    etx: '\x03',
    lf: '\x0A',
    dc4: '\x14'
  };

  const subscriptionTypes = {
    events: { requiresSymbol: false },
    marketDepth: { requiresSymbol: true },
    marketUpdate: { requiresSymbol: true },
    cumulativeVolume: { requiresSymbol: true },
    timestamp: { requiresSymbol: false }
  };

  const _RECONNECT_INTERVAL = 5000;
  const _WATCHDOG_INTERVAL = 10000;

  const regex = { };
  regex.hostname = /^(?:(wss|ws):\/\/)?(.+?)(?::(\d+))?$/i;

  function ConnectionInternal(marketState, instance) {
    const __logger = LoggerFactory.getLogger('@barchart/marketdata-api-js');

    const __instance = instance;

    const __marketState = marketState;

    let __connectionFactory = null;

    let __xmlParserFactory = null;
    let __xmlParser = null;

    let __connection = null;
    let __connectionState = state.disconnected;
    let __connectionCount = 0;

    let __paused = false;

    let __reconnectAllowed = false;
    let __reconnectToken = null;
    
    let __pollingFrequency = null;

    let __extendedProfile = false;
    let __extendedQuote = false;

    let __processOptions = { };

    let __watchdogToken = null;
    let __watchdogAwake = false;

    let __exchangeMetadataPromise = null;

    let __inboundMessages = [];
    let __marketMessages = [];
    let __pendingTasks = [];
    let __outboundMessages = [];

    let __knownConsumerSymbols = {};
    let __pendingProfileSymbols = {};
    let __completedProfileExtensions = [];

    const __listeners = {
      marketDepth: {},
      marketUpdate: {},
      cumulativeVolume: {},
      events: [],
      timestamp: []
    };

    const __loginInfo = {
      mode: null,
      hostname: null,
      username: null,
      password: null,
      jwtProvider: null,
      jwtPromise: null
    };

    let __decoder = null;

    let __diagnosticsController = null;

    //
    // Functions used to configure the connection.
    //

    /**
     * Changes the subscription mode to use either "polling" or "streaming" mode. To
     * use "polling" mode, pass the number of milliseconds -- any number less than 1,000
     * will be ignored. To use "streaming" mode, pass a null value or an undefined value.
     *
     * @private
     * @param {Number|undefined|null} pollingFrequency
     */
    function setPollingFrequency(pollingFrequency) {
      if (__paused) {
        resume();
      }

      if (pollingFrequency === null || pollingFrequency === undefined) {
        __logger.log(`Connection [ ${__instance} ]: Switching to streaming mode.`);

        __pollingFrequency = null;
      } else if (typeof(pollingFrequency) === 'number' && !isNaN(pollingFrequency) && !(pollingFrequency < 1000)) {
        __logger.log(`Connection [ ${__instance} ]: Switching to polling mode.`);

        __pollingFrequency = pollingFrequency;
      }
    }

    function setExtendedProfileMode(mode) {
      if (__extendedProfile !== mode) {
        __extendedProfile = mode;
      }
    }

    function setExtendedQuoteMode(mode) {
      if (__extendedQuote !== mode) {
        __extendedQuote = mode;
      }
    }

    //
    // Functions for connecting to and disconnecting from JERQ, monitoring
    // established connections, and handling involuntary disconnects.
    //

    /**
     * Attempts to establish a connection to JERQ, setting the flag to allow
     * reconnection if an involuntary disconnect occurs.
     *
     * @private
     * @param {String} hostname
     * @param {String=} username
     * @param {String=} password
     * @param {WebSocketAdapterFactory} webSocketAdapterFactory
     * @param {XmlParserFactory} xmlParserFactory
     * @param {Callbacks.JwtProvider} jwtProvider
     */
    function initializeConnection(hostname, username, password, webSocketAdapterFactory, xmlParserFactory, jwtProvider) {
      __connectionFactory = webSocketAdapterFactory;
      __xmlParserFactory = xmlParserFactory;

      __reconnectAllowed = true;

      connect(hostname, username, password, jwtProvider);
    }

    /**
     * Disconnects from JERQ, setting the flag to prevent further reconnect attempts and
     * clearing internal subscription state.
     *
     * @private
     */
    function terminateConnection() {
      broadcastEvent('events', { event: 'disconnecting' });

      __reconnectAllowed = false;

      if (__reconnectToken !== null) {
        clearTimeout(__reconnectToken);
        
        __reconnectToken = null;
      }

      __loginInfo.mode = null;
      __loginInfo.hostname = null;
      __loginInfo.username = null;
      __loginInfo.password = null;
      __loginInfo.jwtProvider = null;
      __loginInfo.jwtPromise = null;

      __knownConsumerSymbols = {};
      __pendingProfileSymbols = {};

      __listeners.marketDepth = {};
      __listeners.marketUpdate = {};
      __listeners.cumulativeVolume = {};
      __listeners.events = [];
      __listeners.timestamp = [];

      __paused = false;

      disconnect();
    }

    /**
     * Attempts to read a JWT from an external provider.
     *
     * @private
     * @param {Callbacks.JwtProvider} jwtProvider
     * @returns {Promise<string|null>}
     */
    function getJwt(jwtProvider) {
      const connectionCount = __connectionCount;

      return Promise.resolve()
        .then(() => {
          __logger.log(`Connection [ ${__instance} ]: Requesting JWT for connection attempt [ ${connectionCount} ].`);

          return jwtProvider();
        }).then((jwt) => {
          __logger.log(`Connection [ ${__instance} ]: Request for JWT was successful for connection attempt [ ${connectionCount} ].`);

          if (__connectionCount !== connectionCount) {
            return null;
          }

          if (typeof(jwt) !== 'string') {
            __logger.warn(`Connection [ ${__instance} ]: Unable to extract JWT.`);

            return null;
          }

          return jwt;
        }).catch(() => {
          __logger.warn(`Connection [ ${__instance} ]: Request for JWT failed for connection attempt [ ${connectionCount} ].`);

          return null;
        });
    }

    /**
     * Attempts to establish a connection to JERQ.
     *
     * @private
     * @param {String} hostname
     * @param {String=} username
     * @param {String=} password
     * @param {Callbacks.JwtProvider=} jwtProvider
     */
    function connect(hostname, username, password, jwtProvider) {
      assert.argumentIsRequired(hostname, 'hostname', String);
      assert.argumentIsOptional(username, 'username', String);
      assert.argumentIsOptional(password, 'password', String);
      assert.argumentIsOptional(jwtProvider, 'jwtProvider', Function);

      if (!username && !jwtProvider) {
        throw new Error('Unable to connect, the "username" argument is required.');
      }

      if (!password && !jwtProvider) {
        throw new Error('Unable to connect, the "password" argument is required.');
      }

      if (__connection !== null) {
        __logger.warn(`Connection [ ${__instance} ]: Unable to connect, a connection already exists.`);

        return;
      }

      ensureExchangeMetadata();

      __connectionCount = __connectionCount + 1;

      __logger.log(`Connection [ ${__instance} ]: Starting connection attempt [ ${__connectionCount} ] using [ ${jwtProvider ? 'JWT' : 'credentials-based' } ] authentication.`);

      let protocol;
      let host;
      let port;

      if (hostname === 'localhost') {
        protocol = 'ws';
        host = 'localhost';
        port = 8080;
      } else {
        const match = hostname.match(regex.hostname);

        if (match !== null && match[1]) {
          protocol = match[1];
        } else {
          protocol = 'wss';
        }

        if (match !== null && match[2]) {
          host = match[2];
        } else {
          host = hostname;
        }

        if (match !== null && match[3]) {
          port = parseInt(match[3]);
        } else {
          port = protocol === 'ws' ? 80 : 443;
        }
      }

      __loginInfo.hostname = hostname;

      __loginInfo.username = null;
      __loginInfo.password = null;

      __loginInfo.jwtProvider = null;
      __loginInfo.jwtPromise = null;

      if (jwtProvider) {
        __loginInfo.mode = mode.token;

        __loginInfo.jwtProvider = jwtProvider;
        __loginInfo.jwtPromise = getJwt(jwtProvider);
      } else {
        __loginInfo.mode = mode.credentials;

        __loginInfo.username = username;
        __loginInfo.password = password;
      }

      __xmlParser = __xmlParserFactory.build();

      __connectionState = state.disconnected;

      __logger.log(`Connection [ ${__instance} ]: Opening connection to [ ${protocol}://${host}:${port} ].`);

      __connection = __connectionFactory.build(`${protocol}://${host}:${port}/jerq`);
      __connection.binaryType = 'arraybuffer';

      __decoder = __connection.getDecoder();

      __connection.onopen = () => {
        __logger.log(`Connection [ ${__instance} ]: Open event received.`);
      };

      __connection.onclose = () => {
        __logger.log(`Connection [ ${__instance} ]: Close event received.`);

        __connectionState = state.disconnected;

        stopWatchdog();

        __connection.onopen = null;
        __connection.onclose = null;
        __connection.onmessage = null;
        __connection = null;

        const loginFailed = __inboundMessages.length > 0 && __inboundMessages.some(m => m.indexOf('-') === 0);

        let messages = __inboundMessages;

        __inboundMessages = [];
        __marketMessages = [];
        __pendingTasks = [];
        __outboundMessages = [];

        if (loginFailed) {
          __logger.warn(`Connection [ ${__instance} ]: Connection closed before login was processed.`);

          const lines = messages[0].split('\n');

          __logger.debug(`Connection [ ${__instance} ]: Discarding pending message(s) because connection was closed.`);

          lines.forEach((line) => {
            if (line.length > 0) {
              __logger.debug(`Connection [ ${__instance} ] << ${line}`);
            }
          });

          broadcastEvent('events', { event: 'login fail' });
        } else {
          __logger.warn(`Connection [ ${__instance} ]: Connection dropped.`);

          broadcastEvent('events', { event: 'disconnect' });
        }

        if (__reconnectAllowed) {
          __logger.log(`Connection [ ${__instance} ]: Scheduling reconnect attempt.`);

          const reconnectAction = () => {
            connect(__loginInfo.hostname, __loginInfo.username, __loginInfo.password, __loginInfo.jwtProvider);
            
            __reconnectToken = null;
          };
          const reconnectDelay = _RECONNECT_INTERVAL + Math.floor(Math.random() * _WATCHDOG_INTERVAL);

          __reconnectToken = setTimeout(reconnectAction, reconnectDelay);
        }
      };

      __connection.onmessage = (event) => {
        __watchdogAwake = false;

        let message;

        if (event.data instanceof ArrayBuffer) {
          message = __decoder.decode(event.data);
        } else {
          message = event.data;
        }

        if (message) {
          __inboundMessages.push(message);
        }
      };

      startWatchdog();
    }

    /**
     * Changes state to disconnected and attempts to drop the websocket
     * connection to JERQ.
     *
     * @private
     */
    function disconnect() {
      __logger.warn(`Connection [ ${__instance} ]: Disconnecting.`);

      __connectionState = state.disconnected;

      stopWatchdog();

      if (__connection !== null) {
        try {
          if (__connection.readyState === __connection.OPEN) {
            __connection.send('LOGOUT\r\n');
          }

          __logger.warn(`Connection [ ${__instance} ]: Closing connection.`);

          __connection.close();
        } catch {
          __logger.warn(`Connection [ ${__instance} ]: Unable to close connection.`);
        }
      }

      __inboundMessages = [];
      __marketMessages = [];
      __pendingTasks = [];
      __outboundMessages = [];
    }

    function pause() {
      if (__paused) {
        __logger.warn(`Connection [ ${__instance} ]: Unable to pause, feed is already paused.`);

        return;
      }

      __logger.log(`Connection [ ${__instance} ]: Pausing feed.`);

      if (__pollingFrequency === null) {
        enqueueStopTasks();
        enqueueHeartbeat();
      }

      __paused = true;

      broadcastEvent('events', { event: 'feed paused' });
    }

    function resume() {
      if (!__paused) {
        __logger.warn(`Connection [ ${__instance} ]: Unable to resume, feed is not paused.`);

        return;
      }

      __logger.log(`Connection [ ${__instance} ]: Resuming feed.`);

      __paused = false;

      if (__pollingFrequency === null) {
        enqueueGoTasks();
      }

      broadcastEvent('events', { event: 'feed resumed' });
    }

    /**
     * Starts heartbeat connection monitoring.
     *
     * @private
     */
    function startWatchdog() {
      stopWatchdog();

      __logger.log(`Connection [ ${__instance} ]: Watchdog started.`);

      const watchdogAction = () => {
        if (__watchdogAwake) {
          __logger.log(`Connection [ ${__instance} ]: Watchdog triggered, connection silent for too long. Triggering disconnect.`);

          stopWatchdog();

          disconnect();
        } else {
          __watchdogAwake = true;
        }
      };

      __watchdogToken = setInterval(watchdogAction, _WATCHDOG_INTERVAL);
      __watchdogAwake = true;
    }

    /**
     * Stops heartbeat connection monitoring.
     *
     * @private
     */
    function stopWatchdog() {
      if (__watchdogToken !== null) {
        __logger.log(`Connection [ ${__instance} ]: Watchdog stopped.`);

        clearInterval(__watchdogToken);
      }

      __watchdogAwake = false;
    }

    //
    // Functions used to maintain exchange metadata
    //

    /**
     * Runs out-of-band query for exchange metadata and forwards it to the
     * {@link MarketState} instance.
     *
     * @private
     */
    function ensureExchangeMetadata() {
      if (__exchangeMetadataPromise !== null) {
        return;
      }

      try {
        __logger.log(`Connection [ ${__instance} ]: Downloading exchange metadata.`);

        __exchangeMetadataPromise = retrieveExchanges()
          .then((items) => {
            items.forEach(item => {
              __marketState.processExchangeMetadata(item.id, item.description, item.timezoneDdf, item.timezoneExchange);
            });

            __logger.log(`Connection [ ${__instance} ]: Downloaded exchange metadata.`);

            return true;
          }).catch(() => {
            __logger.warn(`Connection [ ${__instance} ]: An error occurred while processing exchange metadata.`);

            __exchangeMetadataPromise = null;
          });
      } catch {
        __logger.warn(`Connection [ ${__instance} ]: An error occurred while downloading exchange metadata.`);

        __exchangeMetadataPromise = null;
      }
    }

    //
    // Functions for handling user-initiated requests to start subscriptions, stop subscriptions,
    // and request profiles.
    //

    /**
     * Subscribes to an event (e.g. quotes, heartbeats, connection status, etc), given
     * the event type, a callback, and a symbol (if necessary).
     *
     * @private
     * @param {Enums.SubscriptionType} subscriptionType
     * @param {Function} handler
     * @param {String=} symbol
     */
    function on(subscriptionType, handler, symbol) {
      if (typeof(subscriptionType) !== 'string') {
        throw new Error('The "subscriptionType" argument must be a string.');
      }

      if (typeof(handler) !== 'function') {
        throw new Error('The "handler" argument must be a function.');
      }

      if (!Object.prototype.hasOwnProperty.call(subscriptionTypes, subscriptionType)) {
        __logger.log(`Consumer [ ${__instance} ]: Unable to process "on" command, subscription type is not recognized.`);

        return;
      }

      const subscriptionData = subscriptionTypes[subscriptionType];

      if (subscriptionData.requiresSymbol) {
        if (typeof(symbol) !== 'string') {
          throw new Error(`The "symbol" argument must be a string for [ ${subscriptionType} ] subscriptions.`);
        }

        symbol = symbol.toUpperCase().trim();

        if (!symbol || !(symbol.indexOf(' ') < 0)) {
          __logger.log(`Consumer [ ${__instance} ]: Unable to process "on" command, the "symbol" argument is invalid.`);
          __logger.trace();

          return;
        }
      }

      const subscribe = (streamingTaskName, snapshotTaskName, listenerMap, sharedListenerMaps) => {
        const consumerSymbol = symbol;
        const producerSymbol = SymbolParser.getProducerSymbol(consumerSymbol);

        if (SymbolParser.getIsReference(consumerSymbol)) {
          __logger.warn(`Connection [ ${__instance} ]: Ignoring subscription for reference symbol [ ${consumerSymbol} ].`);

          return false;
        }

        if (SymbolParser.getIsExpired(consumerSymbol)) {
          __logger.warn(`Connection [ ${__instance} ]: Ignoring subscription for expired symbol [ ${consumerSymbol} ].`);

          return false;
        }

        addKnownConsumerSymbol(consumerSymbol, producerSymbol);

        const producerListenerExists = getProducerListenerExists(producerSymbol, sharedListenerMaps.concat(listenerMap));

        listenerMap[consumerSymbol] = addListener(listenerMap[consumerSymbol], handler);

        if (!__paused) {
          if (producerListenerExists) {
            addTask(snapshotTaskName, producerSymbol);
          } else {
            addTask(streamingTaskName, producerSymbol);
          }
        }

        return true;
      };

      switch (subscriptionType) {
      case 'events':
        __listeners.events = addListener(__listeners.events, handler);
        break;
      case 'marketDepth':
        if (subscribe('MD_GO', 'MD_REFRESH', __listeners.marketDepth, [])) {
          if (__marketState.getBook(symbol)) {
            handler({ type: 'INIT', symbol: symbol });
          }
        }

        break;
      case 'marketUpdate':
        if (subscribe('MU_GO', 'MU_REFRESH', __listeners.marketUpdate, [__listeners.cumulativeVolume])) {
          if (__marketState.getQuote(symbol)) {
            handler({ type: 'INIT', symbol: symbol });
          }
        }

        break;
      case 'cumulativeVolume':
        if (subscribe('MU_GO', 'MU_REFRESH', __listeners.cumulativeVolume, [__listeners.marketUpdate])) {
          __marketState.getCumulativeVolume(symbol, (container) => {
            container.on('events', handler);
          });
        }

        break;
      case 'timestamp':
        __listeners.timestamp = addListener(__listeners.timestamp, handler);
        break;
      }
    }

    /**
     * Drops a subscription to an event for a specific handler (callback). If other
     * subscriptions to the same event (as determined by strict equality of the
     * handler) exist, the subscription will continue to operate for other handlers.
     *
     * @private
     * @param {Enums.SubscriptionType} subscriptionType
     * @param {Function} handler
     * @param {String=} symbol
     */
    function off(subscriptionType, handler, symbol) {
      if (typeof(subscriptionType) !== 'string') {
        throw new Error('The "subscriptionType" argument must be a string.');
      }

      if (typeof(handler) !== 'function') {
        throw new Error('The "handler" argument must be a function.');
      }

      if (!Object.prototype.hasOwnProperty.call(subscriptionTypes, subscriptionType)) {
        __logger.log(`Consumer [ ${__instance} ]: Unable to process "off" command, subscription type is not supported [ ${subscriptionType} ].`);
        __logger.trace();

        return;
      }

      const subscriptionData = subscriptionTypes[subscriptionType];

      if (subscriptionData.requiresSymbol) {
        if (typeof(symbol) !== 'string') {
          throw new Error(`The "symbol" argument must be a string for [ ${subscriptionType} ] subscriptions.`);
        }

        symbol = symbol.toUpperCase().trim();

        if (!symbol || !(symbol.indexOf(' ') < 0)) {
          __logger.log(`Consumer [ ${__instance} ]: Unable to process "off" command, the "symbol" argument is empty.`);
          __logger.trace();

          return;
        }
      }

      const unsubscribe = (stopTaskName, listenerMap, sharedListenerMaps) => {
        const consumerSymbol = symbol;
        const producerSymbol = SymbolParser.getProducerSymbol(consumerSymbol);

        const listenerMaps = sharedListenerMaps.concat(listenerMap);

        let previousProducerListenerExists = getProducerListenerExists(producerSymbol, listenerMaps);
        let currentProducerListenerExists;

        listenerMap[consumerSymbol] = removeListener(listenerMap[consumerSymbol], handler);

        if (listenerMap[consumerSymbol].length === 0) {
          delete listenerMap[consumerSymbol];
        }

        currentProducerListenerExists = getProducerListenerExists(producerSymbol, listenerMaps);

        if (previousProducerListenerExists && !currentProducerListenerExists && !__paused) {
          addTask(stopTaskName, producerSymbol);

          if (!getProducerSymbolsExist()) {
            enqueueHeartbeat();
          }
        }
      };

      switch (subscriptionType) {
      case 'events':
        __listeners.events = removeListener(__listeners.events, handler);

        break;
      case 'marketDepth':
        unsubscribe('MD_STOP', __listeners.marketDepth, []);

        break;
      case 'marketUpdate':
        unsubscribe('MU_STOP', __listeners.marketUpdate, [__listeners.cumulativeVolume]);

        break;
      case 'cumulativeVolume':
        unsubscribe('MU_STOP', __listeners.cumulativeVolume, [__listeners.marketUpdate]);

        __marketState.getCumulativeVolume(symbol, (container) => {
          container.off('events', handler);
        });

        break;
      case 'timestamp':
        __listeners.timestamp = removeListener(__listeners.timestamp, handler);

        break;
      }
    }

    /**
     * Enqueues a request to retrieve a profile.
     *
     * @private
     * @param {String} symbol
     */
    function handleProfileRequest(symbol) {
      if (typeof(symbol) !== 'string') {
        throw new Error('The "symbol" argument must be a string.');
      }

      const consumerSymbol = symbol.toUpperCase().trim();

      if (!consumerSymbol || !(consumerSymbol.indexOf(' ') < 0)) {
        __logger.log(`Consumer [ ${__instance} ]: Unable to process profile request, the "symbol" argument is empty.`);
        __logger.trace();

        return;
      }

      const producerSymbol = SymbolParser.getProducerSymbol(consumerSymbol);

      const pendingConsumerSymbols = __pendingProfileSymbols[producerSymbol] || [];

      if (!pendingConsumerSymbols.some(candidate => candidate === producerSymbol)) {
        pendingConsumerSymbols.push(producerSymbol);
      }

      if (!pendingConsumerSymbols.some(candidate => candidate === consumerSymbol)) {
        pendingConsumerSymbols.push(consumerSymbol);
      }

      __pendingProfileSymbols[producerSymbol] = pendingConsumerSymbols;

      addTask('P_SNAPSHOT', producerSymbol);
    }

    /**
     * Adds a task to a queue for asynchronous processing.
     *
     * @private
     * @param {String} id
     * @param {String|null} symbol
     */
    function addTask(id, symbol) {
      if (__connectionState !== state.authenticated) {
        return;
      }

      const lastIndex = __pendingTasks.length - 1;

      if (!(lastIndex < 0) && __pendingTasks[lastIndex].id === id && symbol !== null) {
        __pendingTasks[lastIndex].symbols.push(symbol);
      } else {
        __pendingTasks.push({ id: id, symbols: [symbol] });
      }
    }

    function enqueueHeartbeat() {
      addTask('H_GO', null);
    }

    function enqueueGoTasks() {
      const marketUpdateSymbols = getProducerSymbols([__listeners.marketUpdate, __listeners.cumulativeVolume]);
      const marketDepthSymbols = getProducerSymbols([__listeners.marketDepth]);

      marketUpdateSymbols.forEach((symbol) => {
        addTask('MU_GO', symbol);
      });

      marketDepthSymbols.forEach((symbol) => {
        addTask('MD_GO', symbol);
      });

      const pendingProfileSymbols = array.unique(object.keys(__pendingProfileSymbols).filter(s => !marketUpdateSymbols.some(already => already === s)));

      pendingProfileSymbols.forEach((symbol) => {
        addTask('P_SNAPSHOT', symbol);
      });
    }

    function enqueueStopTasks() {
      getProducerSymbols([__listeners.marketUpdate, __listeners.cumulativeVolume]).forEach((symbol) => {
        addTask('MU_STOP', symbol);
      });

      getProducerSymbols([__listeners.marketDepth]).forEach((symbol) => {
        addTask('MD_STOP', symbol);
      });
    }

    function processInboundMessage(message) {
      if (__connectionState === state.disconnected) {
        __connectionState = state.connecting;
      }

      if (__connectionState === state.connecting) {
        const lines = message.split('\n');

        if (lines.length > 0) {
          __logger.debug(`Connection [ ${__instance} ]: Processing inbound message(s) in [ connecting ] mode.`);

          lines.forEach((line) => {
            if (line.length > 0) {
              __logger.debug(`Connection [ ${__instance} ] << ${line}`);
            }
          });
        }

        if (lines.some(line => line === '+++')) {
          __connectionState = state.authenticating;

          let connectionCount = __connectionCount;

          if (__loginInfo.mode === mode.credentials) {
            __connection.send(`LOGIN ${__loginInfo.username}:${__loginInfo.password} VERSION=${_API_VERSION}\r\n`);

            return;
          }

          if (__loginInfo.mode === mode.token) {
            const jwtPromise = __loginInfo.jwtPromise || Promise.resolve(null);

            jwtPromise.then((jwt) => {
              if (__connectionCount !== connectionCount) {
                return;
              }

              if (__connectionState !== state.authenticating) {
                return;
              }

              if (jwt === null) {
                broadcastEvent('events', { event: 'jwt acquisition failed' });

                disconnect();

                return;
              }

              __connection.send(`TOKEN ${jwt} VERSION=${_API_VERSION}\r\n`);
            });

            return;
          }
        }
      } else if (__connectionState === state.authenticating) {
        const lines = message.split('\n');

        if (lines.length > 0) {
          __logger.debug(`Connection [ ${__instance} ]: Processing inbound message(s) in [ authenticating ] mode.`);

          lines.forEach((line) => {
            if (line.length > 0) {
              __logger.debug(`Connection [ ${__instance} ] << ${line}`);
            }
          });
        }

        const firstCharacter = message.charAt(0);

        if (firstCharacter === '+') {
          __connectionState = state.authenticated;

          __logger.log(`Connection [ ${__instance} ]: Login accepted.`);

          broadcastEvent('events', { event: 'login success' });

          if (__paused) {
            __logger.log(`Connection [ ${__instance} ]: Establishing heartbeat only -- feed is paused.`);

            enqueueHeartbeat();
          } else {
            __logger.log(`Connection [ ${__instance} ]: Establishing subscriptions for heartbeat and existing symbols.`);

            enqueueHeartbeat();
            enqueueGoTasks();
          }
        } else if (firstCharacter === '-') {
          __logger.log(`Connection [ ${__instance} ]: Login failed.`);

          broadcastEvent('events', { event: 'login fail' });

          disconnect();
        }
      }

      if (__connectionState === state.authenticated) {
        __marketMessages.push(message);
      }
    }

    function pumpInboundProcessing() {
      try {
        while (__inboundMessages.length > 0) {
          processInboundMessage(__inboundMessages.shift());
        }
      } catch (e) {
        __logger.warn(`Pump Inbound [ ${__instance} ]: An error occurred during inbound message queue processing. Disconnecting.`, e);

        disconnect();
      }

      setTimeout(pumpInboundProcessing, 125);
    }

    function parseMarketMessage(message) {
      let parsed;

      try {
        parsed = parseMessage(message, __xmlParser, __processOptions);
      } catch (e) {
        parsed = null;

        __logger.error(`An error occurred while parsing a market message [ ${message} ]. Continuing.`, e);
      }

      if (parsed !== null) {
        if (parsed.type) {
          processMarketMessage(parsed);
        } else {
          __logger.log('Message parser failed to assign the message type');
        }
      }
    }

    function processMarketMessage(message) {
      try {
        const producerSymbol = message.symbol;

        if (producerSymbol) {
          let consumerSymbols = __knownConsumerSymbols[producerSymbol] || [];

          if (Object.prototype.hasOwnProperty.call(__pendingProfileSymbols, producerSymbol)) {
            let profileSymbols = __pendingProfileSymbols[producerSymbol] || [];

            consumerSymbols = array.unique(consumerSymbols.concat(profileSymbols));

            delete __pendingProfileSymbols[producerSymbol];
          }

          consumerSymbols.forEach((consumerSymbol) => {
            let messageToProcess;

            if (consumerSymbol === producerSymbol) {
              messageToProcess = message;
            } else {
              messageToProcess = Object.assign({}, message);
              messageToProcess.symbol = consumerSymbol;
            }

            updateMarketState(messageToProcess);
          });
        } else {
          updateMarketState(message);
        }
      } catch (e) {
        __logger.error(`An error occurred while processing a market message [ ${message} ]. Continuing.`, e);
      }
    }

    function updateMarketState(message) {
      try {
        __marketState.processMessage(message);

        if (message.type === 'BOOK') {
          broadcastEvent('marketDepth', message);
        } else if (message.type === 'TIMESTAMP') {
          broadcastEvent('timestamp', __marketState.getTimestamp());
        } else if (message.type !== 'REFRESH_CUMULATIVE_VOLUME') {
          broadcastEvent('marketUpdate', message);
        }
      } catch (e) {
        __logger.error(`An error occurred while updating market state [ ${message} ]. Continuing.`, e);
      }
    }

    function broadcastEvent(subscriptionType, message) {
      let listeners;

      if (subscriptionType === 'events') {
        listeners = __listeners.events;
      } else if (subscriptionType === 'marketDepth') {
        listeners = __listeners.marketDepth[message.symbol];
      } else if (subscriptionType === 'marketUpdate') {
        listeners = __listeners.marketUpdate[message.symbol];
      } else if (subscriptionType === 'timestamp') {
        listeners = __listeners.timestamp;
      } else {
        __logger.warn(`Broadcast [ ${__instance} ]: Unable to notify subscribers of [ ${subscriptionType} ].`);

        listeners = null;
      }

      if (listeners) {
        listeners.forEach((listener) => {
          try {
            listener(message);
          } catch (e) {
            __logger.warn(`Broadcast [ ${__instance} ]:: A consumer-supplied listener for [ ${subscriptionType} ] threw an error. Continuing.`, e);
          }
        });
      }
    }

    function pumpMarketProcessing() {
      const suffixLength = 9;

      let done = false;

      while (!done) {
        let s = __marketMessages.shift();

        if (!s) {
          done = true;
        } else {
          let skip = false;

          let msgType = 1;

          let idx = -1;
          let idxETX = s.indexOf(ascii.etx);
          let idxNL = s.indexOf(ascii.lf);

          if ((idxNL > -1) && ((idxETX < 0) || (idxNL < idxETX))) {
            idx = idxNL;
            msgType = 2;
          }
          else if (idxETX > -1) {
            idx = idxETX;
          }

          if (idx > -1) {
            let epos = idx + 1;

            if (msgType === 1) {
              if (s.length < idx + suffixLength + 1) {
                if (__marketMessages.length > 0)
                  __marketMessages[0] = s + __marketMessages[0];
                else {
                  __marketMessages.unshift(s);
                  done = true;
                }

                skip = true;
              } else if (s.substr(idx + 1, 1) === ascii.dc4) {
                epos += suffixLength + 1;
              }
            }

            if (!skip) {
              let s2 = s.substring(0, epos);
              if (msgType === 2) {
                s2 = s2.trim();
              } else {
                idx = s2.indexOf(ascii.soh);
                if (idx > 0) {
                  s2 = s2.substring(idx);
                }
              }

              if (s2.length > 0) {
                parseMarketMessage(s2);
              }

              s = s.substring(epos);

              if (s.length > 0) {
                if (__marketMessages.length > 0) {
                  __marketMessages[0] = s + __marketMessages[0];
                } else {
                  __marketMessages.unshift(s);
                }
              }
            }
          } else {
            if (s.length > 0) {
              if (__marketMessages.length > 0) {
                __marketMessages[0] = s + __marketMessages[0];
              } else {
                __marketMessages.unshift(s);
                done = true;
              }
            }
          }
        }

        if (__marketMessages.length === 0) {
          done = true;
        }
      }

      setTimeout(pumpMarketProcessing, 125);
    }

    function processTasksInPollingMode() {
      if (__connectionState !== state.authenticated || __outboundMessages.length !== 0 || __paused) {
        return;
      }

      __pendingTasks = [];

      const quoteBatches = getSymbolBatches(getProducerSymbols([__listeners.marketUpdate, __listeners.cumulativeVolume]), getIsStreamingSymbol);

      quoteBatches.forEach((batch) => {
        __outboundMessages.push(`GO ${batch.map(s => `${s}=sc`).join(',')}`);
      });

      const profileBatches = getSymbolBatches(array.unique(object.keys(__pendingProfileSymbols)).filter(s => !quoteBatches.some(q => q === s)), getIsStreamingSymbol);

      profileBatches.forEach((batch) => {
        __outboundMessages.push(`GO ${batch.map(s => `${s}=s`).join(',')}`);
      });

      const bookBatches = getSymbolBatches(getProducerSymbols([__listeners.marketDepth]), getIsStreamingSymbol);

      bookBatches.forEach((batch) => {
        __outboundMessages.push(`GO ${batch.map(s => `${s}=b`).join(',')}`);
      });

      const snapshotBatches = getSymbolBatches(getProducerSymbols([__listeners.marketUpdate]), getIsSnapshotSymbol);

      snapshotBatches.forEach((batch) => {
        processSnapshots(batch);
      });
    }

    function processTasksInStreamingMode() {
      if (__connectionState !== state.authenticated) {
        return;
      }

      const processTask = (task) => {
        if (task.callback) {
          task.callback();
        } else if (task.id) {
          let command = null;
          let suffix = null;

          switch (task.id) {
          case 'MD_GO':
            command = 'GO';
            suffix = 'Bb';
            break;
          case 'MU_GO':
            command = 'GO';
            suffix = 'Ssc';
            break;
          case 'MD_REFRESH':
            command = 'GO';
            suffix = 'b';
            break;
          case 'MU_REFRESH':
            command = 'GO';
            suffix = 'sc';
            break;
          case 'P_SNAPSHOT':
            command = 'GO';
            suffix = 's';
            break;
          case 'MD_STOP':
            command = 'STOP';
            suffix = 'Bb';
            break;
          case 'MU_STOP':
            command = 'STOP';
            suffix = 'Ssc';
            break;
          case 'H_GO':
            command = 'GO _TIMESTAMP_';
            suffix = null;
            break;
          }

          if (command === null) {
            __logger.warn(`Pump Tasks [ ${__instance} ]: An unsupported task was found in the tasks queue.`);

            return;
          }

          if (suffix === null) {
            __outboundMessages.push(command);
          } else {
            let batchSize;

            if (task.id === 'MD_GO' || task.id === 'MD_STOP') {
              batchSize = 1;
            } else {
              batchSize = 250;
            }

            const symbolsUnique = array.unique(task.symbols);

            const symbolsStreaming = symbolsUnique.filter(getIsStreamingSymbol);
            const symbolsSnapshot = symbolsUnique.filter(getIsSnapshotSymbol);

            const pushOutboundTask = (batch) => {
              __outboundMessages.push(`${command} ${batch.map(s => `${s}=${suffix}`).join(',')}`);
            };

            while (symbolsStreaming.length > 0) {
              pushOutboundTask(symbolsStreaming.splice(0, batchSize));
            }

            if (task.id === 'MU_GO' || task.id === 'MU_REFRESH') {
              while (symbolsSnapshot.length > 0) {
                const batch = symbolsSnapshot.splice(0, batchSize);

                processSnapshots(batch);
              }
            }

            if (__extendedProfile && (task.id === 'MU_GO' || task.id === 'P_SNAPSHOT')) {
              const symbolsExtended = symbolsUnique.filter(getIsExtendedProfileSymbol);

              while (symbolsExtended.length > 0) {
                const batch = symbolsExtended.splice(0, batchSize);

                processExtendedProfiles(batch);
              }
            }

            if (__extendedQuote && (task.id === 'MU_GO')) {
              const symbolsExtended = symbolsUnique.filter(getIsExtendedQuoteSymbol);

              while (symbolsExtended.length > 0) {
                const batch = symbolsExtended.splice(0, batchSize);

                processExtendedQuotes(batch);
              }
            }
          }
        }
      };

      while (__pendingTasks.length > 0) {
        processTask(__pendingTasks.shift());
      }
    }

    function pumpTaskProcessing(polling) {
      let pumpDelegate;
      let pumpDelay;

      if (__pollingFrequency === null) {
        pumpDelay = 250;
        pumpDelegate = processTasksInStreamingMode;

        if (polling && !__paused) {
          enqueueGoTasks();
        }
      } else {
        pumpDelay = __pollingFrequency;
        pumpDelegate = processTasksInPollingMode;

        if (!polling) {
          enqueueStopTasks();

          processTasksInStreamingMode();
        }
      }

      let pumpWrapper = () => {
        try {
          pumpDelegate();
        } catch (e) {
          __logger.warn(`Pump Tasks [ ${__instance} ]: An error occurred during task queue processing. Disconnecting.`, e);

          disconnect();
        }

        pumpTaskProcessing(pumpDelegate === processTasksInPollingMode);
      };

      setTimeout(pumpWrapper, pumpDelay);
    }

    function pumpOutboundProcessing() {
      if (__connectionState === state.authenticated) {
        while (__outboundMessages.length > 0) {
          try {
            const message = __outboundMessages.shift();

            __logger.log(`Pump Outbound [ ${__instance} ]: ${message}`);

            __connection.send(message);
          } catch (e) {
            __logger.warn(`Pump Outbound [ ${__instance} ]: An error occurred during outbound message queue processing. Disconnecting.`, e);

            disconnect();

            break;
          }
        }
      }

      setTimeout(pumpOutboundProcessing, 200);
    }

    function processSnapshots(symbols) {
      if (__connectionState !== state.authenticated || symbols.length === 0) {
        return;
      }

      retrieveQuoteSnapshots(symbols, __loginInfo.username, __loginInfo.password)
        .then((quotes) => {
          if (__connectionState !== state.authenticated) {
            return;
          }

          quotes.forEach(message => processMarketMessage(message));
        }).catch((e) => {
          __logger.log(`Snapshots [ ${__instance} ]: Out-of-band snapshot request failed for [ ${symbols.join()} ].`, e);
        });
    }

    function pumpSnapshotRefresh() {
      if (__connectionState !== state.authenticated) {
        return;
      }

      try {
        const snapshotBatches = getSymbolBatches(getProducerSymbols([__listeners.marketUpdate]), getIsSnapshotSymbol);

        snapshotBatches.forEach((batch) => {
          processSnapshots(batch);
        });
      } catch (e) {
        __logger.warn(`Snapshots [ ${__instance} ]: An error occurred during refresh processing. Ignoring.`, e);
      }

      setTimeout(pumpSnapshotRefresh, 3600000);
    }

    function processExtendedProfiles(symbols) {
      if (__connectionState !== state.authenticated) {
        return;
      }

      retrieveProfileExtensions(array.difference(symbols, __completedProfileExtensions))
        .then((extensions) => {
          if (__connectionState !== state.authenticated) {
            return;
          }

          extensions.forEach((extension) => {
            const producerSymbol = extension.symbol;
            const consumerSymbols = __knownConsumerSymbols[producerSymbol] || [];

            const compositeSymbols = array.unique(([producerSymbol]).concat(consumerSymbols));

            compositeSymbols.forEach((symbol) => {
              const message = Object.assign({}, extension);

              message.symbol = symbol;
              message.type = 'PROFILE_EXTENSION';

              updateMarketState(message);

              __completedProfileExtensions.push(symbol);
            });
          });
        }).catch((e) => {
          __logger.log(`Profiles [ ${__instance} ]: Out-of-band profile extension request failed for [ ${symbols.join()} ].`, e);
        });
    }

    function processExtendedQuotes(symbols) {
      if (__connectionState !== state.authenticated) {
        return;
      }

      retrieveQuoteExtensions(symbols, __loginInfo.username, __loginInfo.password)
        .then((extensions) => {
          if (__connectionState !== state.authenticated) {
            return;
          }

          extensions.forEach((extension) => {
            const producerSymbol = extension.symbol;
            const consumerSymbols = __knownConsumerSymbols[producerSymbol] || [];

            const compositeSymbols = array.unique(([producerSymbol]).concat(consumerSymbols));

            compositeSymbols.forEach((symbol) => {
              const message = Object.assign({}, extension);

              message.symbol = symbol;
              message.type = 'QUOTE_EXTENSION';

              updateMarketState(message);
            });
          });
        }).catch((e) => {
          __logger.log(`Profiles [ ${__instance} ]: Out-of-band quote extension request failed for [ ${symbols.join()} ].`, e);
        });
    }

    function getProducerSymbolCount() {
      return getProducerSymbols([__listeners.marketUpdate, __listeners.marketDepth, __listeners.cumulativeVolume]).length;
    }

    function getProducerSymbolsExist() {
      return !(object.empty(__listeners.marketUpdate) && object.empty(__listeners.marketDepth) && object.empty(__listeners.cumulativeVolume));
    }

    function getProducerSymbols(listenerMaps) {
      const producerSymbols = listenerMaps.reduce((symbols, listenerMap) => {
        return symbols.concat(object.keys(listenerMap).map(consumerSymbol => SymbolParser.getProducerSymbol(consumerSymbol)));
      }, []);

      return array.unique(producerSymbols);
    }

    function getProducerListenerExists(producerSymbol, listenerMaps) {
      const consumerSymbols = __knownConsumerSymbols[producerSymbol] || [];

      return consumerSymbols.some(consumerSymbol => getConsumerListenerExists(consumerSymbol, listenerMaps));
    }

    function getConsumerListenerExists(consumerSymbol, listenerMaps) {
      return listenerMaps.some(listenerMap => Object.prototype.hasOwnProperty.call(listenerMap, consumerSymbol) && listenerMap[consumerSymbol].length !== 0);
    }

    function addKnownConsumerSymbol(consumerSymbol, producerSymbol) {
      if (!Object.prototype.hasOwnProperty.call(__knownConsumerSymbols, producerSymbol)) {
        __knownConsumerSymbols[producerSymbol] = [];
      }

      const consumerSymbols = __knownConsumerSymbols[producerSymbol];

      if (!consumerSymbols.some(candidate => candidate === consumerSymbol)) {
        consumerSymbols.push(consumerSymbol);
      }
    }

    function addListener(listeners, listener) {
      listeners = listeners || [];

      const add = !listeners.some((candidate) => {
        return candidate === listener;
      });

      let updatedListeners;

      if (add) {
        updatedListeners = listeners.slice(0);
        updatedListeners.push(listener);
      } else {
        updatedListeners = listeners;
      }

      return updatedListeners;
    }

    function removeListener(listeners, listener) {
      const listenersToFilter = listeners || [];

      return listenersToFilter.filter((candidate) => {
        return candidate !== listener;
      });
    }

    function getDiagnosticsController() {
      if (__connection === null || __loginInfo.hostname !== 'localhost') {
        throw new Error('Diagnostics mode is only available when connected to localhost.');
      }

      if (__diagnosticsController === null) {
        const subscribeAction = (symbol, callback) => {
          __logger.log(`Connection [ ${__instance} ]: Added diagnostic subscription to market updates for [ ${symbol} ]`);

          on('marketUpdate', callback, symbol);
        };

        const transmitAction = (message) => {
          __logger.log(`Connection [ ${__instance} ]: Enqueued outbound diagnostic message [ ${message} ]`);

          __outboundMessages.push(message);
        };

        __diagnosticsController = new DiagnosticsController(transmitAction, subscribeAction);
      }

      return __diagnosticsController;
    }

    function getIsStreamingSymbol(_symbol) {
      return !getIsSnapshotSymbol(_symbol);
    }

    function getIsSnapshotSymbol() {
      return false;
    }

    function getIsExtendedProfileSymbol(symbol) {
      return SymbolParser.getIsFuture(symbol) || SymbolParser.getIsC3(symbol) || SymbolParser.getIsCmdty(symbol) || SymbolParser.getIsFutureOption(symbol);
    }

    function getIsExtendedQuoteSymbol(symbol) {
      return SymbolParser.getIsFuture(symbol) || SymbolParser.getIsCmdtyStats(symbol);
    }

    function getSymbolBatches(symbols, predicate) {
      const candidates = symbols.filter(predicate);
      const partitions = [];

      while (candidates.length !== 0) {
        partitions.push(candidates.splice(0, 250));
      }

      return partitions;
    }

    setTimeout(pumpInboundProcessing, 125);
    setTimeout(pumpOutboundProcessing, 200);
    setTimeout(pumpMarketProcessing, 125);
    setTimeout(pumpTaskProcessing, 250);
    setTimeout(pumpSnapshotRefresh, 3600000);

    return {
      connect: initializeConnection,
      disconnect: terminateConnection,
      pause: pause,
      resume: resume,
      on: on,
      off: off,
      getProducerSymbolCount: getProducerSymbolCount,
      setPollingFrequency: setPollingFrequency,
      setExtendedProfileMode: setExtendedProfileMode,
      setExtendedQuoteMode: setExtendedQuoteMode,
      handleProfileRequest: handleProfileRequest,
      getDiagnosticsController: getDiagnosticsController
    };
  }

  class DiagnosticsController extends DiagnosticsControllerBase {
    constructor(transmitAction, subscribeAction) {
      super();

      this._transmitAction = transmitAction;
      this._subscribeAction = subscribeAction;
    }

    _initialize(subscriptions) {
      subscriptions.forEach((subscription) => {
        this._subscribeAction(subscription.symbol, subscription.callback);
      });
    }

    _transmit(message) {
      this._transmitAction(message);
    }

    toString() {
      return '[DiagnosticsController]';
    }
  }

  class Connection extends ConnectionBase {
    constructor(environment) {
      super(environment);

      this._internal = ConnectionInternal(this.getMarketState(), this._getInstance());
    }

    _connect(webSocketAdapterFactory, xmlParserFactory) {
      this._internal.connect(this.getHostname(), this.getUsername(), this.getPassword(), webSocketAdapterFactory, xmlParserFactory, this.getJwtProvider());
    }

    _disconnect() {
      this._internal.disconnect();
    }

    _pause() {
      this._internal.pause();
    }

    _resume() {
      this._internal.resume();
    }

    _on() {
      this._internal.on.apply(this._internal, arguments);
    }

    _off() {
      this._internal.off.apply(this._internal, arguments);
    }

    _getActiveSymbolCount() {
      return this._internal.getProducerSymbolCount();
    }

    _onPollingFrequencyChanged(pollingFrequency) {
      return this._internal.setPollingFrequency(pollingFrequency);
    }

    _onExtendedProfileModeChanged(mode) {
      return this._internal.setExtendedProfileMode(mode);
    }

    _onExtendedQuoteModeChanged(mode) {
      return this._internal.setExtendedQuoteMode(mode);
    }

    _handleProfileRequest(symbol) {
      this._internal.handleProfileRequest(symbol);
    }

    _getDiagnosticsController() {
      return this._internal.getDiagnosticsController.call(this._internal);
    }

    toString() {
      return `[Connection (instance=${this._getInstance()})]`;
    }
  }

  return Connection;
})();