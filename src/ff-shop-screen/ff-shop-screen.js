(function(scope) {

  scope.FF = scope.FF || {};

   Polymer({
    is: 'ff-shop-screen',

    behaviors: [
      scope.FF.ScreenBehavior,
      scope.FF.ShopBehavior
    ],

    properties: {
      gold: {
        readonly: true,
        type: Number
      },
      party: {
        readonly: true,
        type: Array
      },
      purchase: {
        readonly: true,
        type: Object,
        value: function() {
          return {};
        }
      },
      shop: {
        readonly: true,
        reflectToAttribute: true,
        type: String
      },
      shopData: {
        readonly: true,
        type: Object
      },
      shopItems: {
        readonly: true,
        type: Array
      },
      shopkeepers: {
        readonly: true,
        type: String
      }
    },

    listeners: {
      'ff-back': '_onBack',
      'ff-selected': '_onSelect',
      'ff-resting': '_onResting'
    },

    observers: [
      '_shopChanged(shop, _isReady)',
      '_stateChanged(_state)'
    ],

    ready: function() {
      this.shopkeepers = this.resolveUrl('shopkeepers.png');
      this._buyingRegex = /buying/i;
      this._exitRegex = /exit/i;
      this._forWhomRegex = /forWhom/i;
      this._inventoryRegex = /inventory/i;
      this._showingInventory = false;
      this._isReady = true;
    },

    primaryKeyHandler: function() {
      this._currentSelector = this.$.decision;
      return this.$.decision.$.keyHandler;
    },

    _buildState: function(stateId) {
      var shopState = this.shopData.states[stateId];
      if (shopState.copyFrom) {
        shopState = Object.assign({}, this.shopData.states[shopState.copyFrom], shopState);
      }
      return shopState;
    },

    _canAfford: function() {
      return this.gold > +this.purchase.item.price;
    },

    _charClassFor: function(change, index) {
      return this.get('charClass', change.base[index]);
    },

    _getPrice: function(thingToBuy) {
      if (this._isInn() || this._isClinic()) {
        return this.shopItems[0];
      }

      return this.$.inventorySelector.selectedItem.getAttribute('price')
    },

    _isClinic: function() {
      return /clinic/i.test(this.shop);
    },

    _isInn: function() {
      return /inn/i.test(this.shop);
    },

    _onBack: function(e, detail) {
      var state = this.shopData.states[this._state];
      if (state.back) {
        this.set('_state', state.back);
      }
    },

    _onResting: function(e, detail) {
      this.$.party.classList.toggle('resting', detail.resting);
    },

    _onSelect: function(e, detail) {
      var state = this._buildState(this._state);

      if (state.confirmPurchase) {
        this.purchase.forChar = detail.value;
        if (!this._canAfford()) {
          this.set('_state', 'notEnoughMoney');
          return;
        }
        // TODO: check if has room
        this.fire('ff-purchase', this.purchase);
        this.set('_state', state.to);
      } else if (state.to) {
        this.set('_state', state.to);
      } else {
        this.set('_state', this._choices[detail.value].to);
      }
    },

    _padPrice: function(price) {
      var priceStr = '' + price;
      for (var i = priceStr.length; i < 5; i++) {
        priceStr = ' ' + priceStr;
      }
      return priceStr;
    },

    _partyNames: function() {
      return this.party.map(function(c) {
        return { label: c.name };
      });
    },

    _shopChanged: function(shop) {
      if (!shop || !this._isReady) {
        return;
      }

      this.set('_state', undefined);
      this.shopData = this.Shops[shop];

      this.set('_sign', this.shopData.sign);
      this.set('_state', 'start');
    },

    _stateChanged: function() {
      if (!this._state) {
        return;
      }

      this._showingInventory = false;

      if (this._exitRegex.test(this._state)) {
        this.fire('ff-exit-shop');
        this.set('shop', undefined);
        return;
      }

      var shopState = this._buildState(this._state);

      if (shopState.fire) {
        this.fire(shopState.fire.event, shopState.fire.detail);
      }

      if (shopState.showInventory) {
        this._showingInventory = true;
      }

      if (shopState.reset) {
        this.purchase = {
          shop: this.shop
        };
      }

      if (this._buyingRegex.test(this._state)) {
        this.purchase.item = this._shopInventory[this.$.inventorySelector.selected];
        this.set('_conversation', [
          this._padPrice(this._getPrice()),
          '',
          'Gold',
          '',
          'OK?']);
        this._switchKeyHandler(this.$.decision);
      } else {
        this.set('_conversation', shopState.conversation);
      }

      this._switchKeyHandler(shopState.inventoryActive
        ? this.$.inventorySelector
        : this.$.decision);

      this.set('_choices', shopState.choices || []);

      if (this._forWhomRegex.test(this._state)) {
        this.set('_choices', this._partyNames());
      }

      this.set('_noChoices', !this._choices.length);
    },

    _switchKeyHandler: function(newSelector) {
      if (this._currentSelector) {
        this._currentSelector.selected = null;
        this._currentSelector.$.keyHandler.deactivate();
      }
      newSelector.$.keyHandler.activate();
      newSelector.selectIndex(0);
      this._currentSelector = newSelector;
    }

  });

 }(window));