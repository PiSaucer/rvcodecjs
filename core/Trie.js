// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

function charOrd(str) {
  return str[0].toLowerCase().charCodeAt(0);
}

class TrieNode {
  /* Members */
  /**
   * Object acting as a map from characters to child nodes
   * @type Object
   */
  children;
  endOfWord;

  /**
   * Constructor
   */
  constructor(other) {
    if (other instanceof TrieNode) {
      // Copy constructor
      this.children = {};
      for (const [k,v] of other.children) {
        this.children[k] = new TrieNode(v);
      }
      this.endOfWord = other.endOfWord;
    } else {
      // Default constructor
      this.children = {};
      this.endOfWord = false;
    }
  }

  /**
   * Insertion
   */
  insertString(str, i) {
    // Exit condition, end-of-string
    if (i >= str.length) {
      this.endOfWord = true;
      return;
    }
    // Lookup child or create child by char at i
    const ord = charOrd(str[i]);
    let child = this.children[ord];
    if (child === undefined) {
      child = new TrieNode();
      this.children[ord] = child;
    }
    // Insert string to child
    child.insertString(str, i+1);
  }

  /**
   * Lookup Node
   */
  lookupNode(str, i) {
    // End-of-string, find lowerBound
    if (i >= str.length) {
      return this;
    }
    // Lookup child, or return empty string
    const ord = charOrd(str[i]);
    let child = this.children[ord];
    if (child === undefined) {
      return undefined;
    }
    // Return recursive call string to child
    return child.lookupNode(str, i+1);
  }

  /**
   * Lookup Lower Bound
   */
  lookupLowerBound(str, i) {
    // End-of-string, find lowerBound
    if (i >= str.length) {
      // Exit condition, start recursively building up string
      if (this.endOfWord) {
        return '';
      }
      // Find lowest leaf
      const lowest = Object.entries(this.children)[0];
      // Internal error: should not occur, fail quietly
      if (lowest === undefined) {
        return undefined;
      }
      // Descend lowest leaf
      return String.fromCharCode(lowest[0]) + lowest[1].lookupLowerBound(str, i+1);
    }
    // Lookup child, or return empty string
    const ord = charOrd(str[i]);
    let child = this.children[ord];
    if (child === undefined) {
      return '';
    }
    // Return recursive call string to child
    const suffix = child.lookupLowerBound(str, i+1);
    // Fail condition
    if (suffix === undefined) {
      return undefined;
    }
    // Success
    return str[i] + suffix;
  }
}

class TrieIterator {
  /* Private Members */
  #baseStr;
  #nodeStack;
  #indexStack;
  #charStack;
  #strCache;
  #validIterator;

  /**
   * Constructor
   */
  constructor(baseStr, subRoot) {
    // Common constructor
    this.#baseStr = baseStr;
    this.#nodeStack = [subRoot];
    this.#indexStack = [-1];
    this.#charStack = [];
    // Iterator is valid if subRoot is a word-end or it has children
    this.#validIterator = (subRoot instanceof TrieNode)
                          && (subRoot.endOfWord || Object.keys(subRoot.children).length > 0);
    // Signal empty cache if valid, store empty string if invalid
    this.#strCache = this.#validIterator ? undefined : '';
    // If not at endOfWord, perform initial next() call to find lowerBound
    if (this.#validIterator && !(subRoot.endOfWord)) {
      this.next();
    }
  }

  /**
   * Clone
   */
  clone() {
    let o = new TrieIterator(this.#baseStr, this.#nodeStack[0]);
    o.#nodeStack = Array.from(this.#nodeStack);
    o.#indexStack = Array.from(this.#indexStack);
    o.#charStack = Array.from(this.#charStack);
    o.#validIterator = this.#validIterator;
    o.#strCache = this.#strCache;
    return o;
  }

  /**
   * Valid
   */
  valid() {
    return this.#validIterator;
  }

  /**
   * Get
   */
  get() {
    // If iterator is invalid, return undefined
    if (!(this.#validIterator)) {
      return undefined;
    }
    // If cached value, return it
    if (this.#strCache !== undefined) {
      return this.#strCache;
    }
    // Build suffix, cache full string and return it
    this.#strCache = this.#baseStr + this.#charStack.join('');
    return this.#strCache;
  }

  /**
   * Next
   */
  next() {
    // Exit early if invalid iterator
    if (!(this.#validIterator)) {
      return false; // Signal end of iterator
    }
    // Initialize iter vars
    let stackIndex = this.#nodeStack.length - 1;
    let currNode = this.#nodeStack[stackIndex];
    let currIndex = this.#indexStack[stackIndex] + 1;
    let currEntries = Object.entries(currNode.children);
    let endOfIterator = false;
    // Repeatedly pop out of nodes until a valid next node is found
    // - Also ends if exits stack, aka at upperBound/iterator-end
    while (currIndex >= currEntries.length) {
      // Decrement index and exit if out of stack
      if (--stackIndex < 0) {
        break;
      }
      currNode = this.#nodeStack[stackIndex];
      currIndex = this.#indexStack[stackIndex] + 1;
      currEntries = Object.entries(currNode.children);
    }
    // If reached end of stack, adjust vars to reset state at upperBound
    if (stackIndex < 0) {
      endOfIterator = true;
      stackIndex = this.#nodeStack.length - 1;
      currNode = this.#nodeStack[stackIndex];
      currIndex = this.#indexStack[stackIndex];
      currEntries = Object.entries(currNode.children);
    }
    // Trim end of stacks
    this.#nodeStack = this.#nodeStack.slice(0, stackIndex + 1);
    this.#indexStack = this.#indexStack.slice(0, stackIndex + 1);
    this.#charStack = this.#charStack.slice(0, stackIndex);
    // Set top of to indexStack to current index
    this.#indexStack[stackIndex] = currIndex;
    // Descend until reached the next word-end (index===-1 when at an endOfWord)
    while (currIndex >= 0) {
      // Get next node
      currNode = currEntries[currIndex]?.[1];
      // If no next node, exit early and set cache to empty string
      // - Should never happen, so invalidate iterator if it occurs
      if (currNode === undefined) {
        this.#strCache = '';
        this.#validIterator = false;
        return false; // Signal end of iterator
      }
      // Push character to stack
      this.#charStack.push(String.fromCharCode(currEntries[currIndex][0]));
      // Set other iterating vars
      currIndex = currNode.endOfWord ? -1 : 0;
      currEntries = Object.entries(currNode.children);
      // Push new node and index to stack
      this.#nodeStack.push(currNode);
      this.#indexStack.push(currIndex);
    }
    // Clear strCache
    this.#strCache = undefined;
    // Return false if EoI
    return !endOfIterator;
  }

  /**
   * Prev
   */
  prev() {
    // Exit early if invalid iterator
    if (!(this.#validIterator)) {
      return false; // Signal end of iterator
    }
    // Initialize iter vars
    let stackIndex = this.#nodeStack.length - 1;
    let currNode = this.#nodeStack[stackIndex];
    let currIndex = this.#indexStack[stackIndex] - 1;
    let currEntries = Object.entries(currNode.children);
    let endOfIterator = false;
    // Repeatedly pop out of nodes until a valid prev node is found
    // - Also ends if exits stack, aka at lowerBound/iterator-end
    while (currIndex < (currNode.endOfWord ? -1 : 0)) {
      // Decrement index and exit if out of stack
      if (--stackIndex < 0) {
        break;
      }
      currNode = this.#nodeStack[stackIndex];
      currIndex = this.#indexStack[stackIndex] - 1;
      currEntries = Object.entries(currNode.children);
    }
    // If reached end of stack, adjust vars to reset state at lowerBound
    if (stackIndex < 0) {
      endOfIterator = true;
      stackIndex = this.#nodeStack.length - 1;
      currNode = this.#nodeStack[stackIndex];
      currIndex = this.#indexStack[stackIndex];
      currEntries = Object.entries(currNode.children);
    }
    // Trim end of stacks
    this.#nodeStack = this.#nodeStack.slice(0, stackIndex + 1);
    this.#indexStack = this.#indexStack.slice(0, stackIndex + 1);
    this.#charStack = this.#charStack.slice(0, stackIndex);
    // Set top of to indexStack to current index
    this.#indexStack[stackIndex] = currIndex;
    // Descend until reached the prev word-end (index===-1 when at an endOfWord)
    while (currIndex >= 0) {
      // Get next node
      currNode = currEntries[currIndex]?.[1];
      // If no next node, exit early and set cache to empty string
      // - Should never happen, so invalidate iterator if it occurs
      if (currNode === undefined) {
        this.#strCache = '';
        this.#validIterator = false;
        return false; // Signal end of iterator
      }
      // Push character to stack
      this.#charStack.push(String.fromCharCode(currEntries[currIndex][0]));
      // Set other iterating vars
      currEntries = Object.entries(currNode.children);
      currIndex = currEntries.length - 1;
      // If no children and not word-end, internal Trie error, invalidate iterator
      if (currIndex === -1 && !(currNode.endOfWord)) {
        this.#strCache = '';
        this.#validIterator = false;
        return false; // Signal end of iterator
      }
      // Push new node and index to stack
      this.#nodeStack.push(currNode);
      this.#indexStack.push(currIndex);
    }
    // Clear strCache
    this.#strCache = undefined;
    // Return false if EoI
    return !endOfIterator;
  }
}

export class Trie {
  /* Private Members */
  #root;

  /**
   * Constructor
   */
  constructor(other) {
    if (other instanceof Trie) {
      // Copy constructor
      this.#root = new TrieNode(other);
    } else {
      // Default constructor
      this.#root = new TrieNode();
    }
  }

  /**
   * Insertion
   */
  insertString(str) {
    this.#root.insertString(str, 0);
  }

  /**
   * Lookup
   */
  lookupLowerBound(str) {
    const node = this.#root.lookupNode(str, 0);
    if (node === undefined) {
      return '';
    }
    return str + node.lookupLowerBound('', 0);
    // return this.#root.lookupLowerBound(str, 0);
  }

  contains(str) {
    const node = this.#root.lookupNode(str, 0);
    return node !== undefined && node.endOfWord;
  }

  /**
   * Iterator
   */
  iteratorAt(str) {
    return new TrieIterator(str, this.#root.lookupNode(str, 0));
  }
}