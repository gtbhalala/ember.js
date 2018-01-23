/*
  NOTE: This test is adapted from the 1.x series of unit tests.  The tests
  are the same except for places where we intend to break the API we instead
  validate that we warn the developer appropriately.

  CHANGES FROM 1.6:

  * Create ObservableObject which includes Ember.Observable
  * Remove test that tests internal _kvo_changeLevel property.  This is an
    implementation detail.
  * Remove test for allPropertiesDidChange
  * Removed star observer test.  no longer supported
  * Removed property revision test.  no longer supported
*/

// ========================================================================
// Ember.Observable Tests
// ========================================================================

import EmberObject from '../../../../system/object';
import Observable from '../../../../mixins/observable';
import { computed, observer } from 'ember-metal';
import { moduleFor, AbstractTestCase } from 'internal-test-helpers';

const ObservableObject = EmberObject.extend(Observable);

let ObjectA;

moduleFor('object.propertyChanges', class extends AbstractTestCase {
  beforeEach() {
    ObjectA = ObservableObject.extend({
      action: observer('foo', function() {
        this.set('prop', 'changedPropValue');
      }),
      notifyAction: observer('newFoo', function() {
        this.set('newProp', 'changedNewPropValue');
      }),

      notifyAllAction: observer('prop', function() {
        this.set('newFoo', 'changedNewFooValue');
      }),

      starObserver(target, key) {
        this.starProp = key;
      }
    }).create({
      starProp: null,

      foo: 'fooValue',
      prop: 'propValue',

      newFoo: 'newFooValue',
      newProp: 'newPropValue'
    });
  }

  ['@test should indicate that the property of an object has just changed'](assert) {
    // indicate that property of foo will change to its subscribers
    ObjectA.propertyWillChange('foo');

    //Value of the prop is unchanged yet as this will be changed when foo changes
    assert.equal(ObjectA.prop, 'propValue');

    //change the value of foo.
    ObjectA.set('foo', 'changeFooValue');

    // Indicate the subscribers of foo that the value has just changed
    ObjectA.propertyDidChange('foo', null);

    // Values of prop has just changed
    assert.equal(ObjectA.prop, 'changedPropValue');
  }

  ['@test should notify that the property of an object has changed'](assert) {
    // Notify to its subscriber that the values of 'newFoo' will be changed. In this
    // case the observer is "newProp". Therefore this will call the notifyAction function
    // and value of "newProp" will be changed.
    ObjectA.notifyPropertyChange('newFoo', 'fooValue');

    //value of newProp changed.
    assert.equal(ObjectA.newProp, 'changedNewPropValue');
  }

  ['@test should invalidate function property cache when notifyPropertyChange is called'](assert) {
    let a = ObservableObject.extend({
      b: computed({
        get() { return this._b; },
        set(key, value) {
          this._b = value;
          return this;
        }
      }).volatile()
    }).create({
      _b: null
    });

    a.set('b', 'foo');
    assert.equal(a.get('b'), 'foo', 'should have set the correct value for property b');

    a._b = 'bar';
    a.notifyPropertyChange('b');
    a.set('b', 'foo');
    assert.equal(a.get('b'), 'foo', 'should have invalidated the cache so that the newly set value is actually set');
  }
});