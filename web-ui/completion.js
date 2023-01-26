// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { COPTS_ISA } from "../core/Config.js";
import { ISA } from "../core/Constants.js";
import { ISA_TRIE, ISA_TRIE_RV32, ISA_TRIE_RV64, ISA_TRIE_RV128, CANONICAL_OPERANDS } from "../core/Completion.js";

const input = document.getElementById('search-input');
const inputPlaceholder = document.getElementById('search-placeholder');
const isaParameter = document.getElementById('isa');
const searchResults = document.getElementById('search-result-list');

/**
 * Constants
 */
const MAX_SEARCH_RESULTS = 5;

/**
 * Context variables that are global to this module (excluding scroll vars)
 */
let searchIterator = undefined;
let completeMne = undefined;
let placeholderString = '';

/**
 * Build full search results
 */
export function buildPlaceholder() {
  generatePlaceholderString();
  renderPlaceholder();
}
export function buildSearchResults() {
  generateSearchIterator();
  renderSearchResults();
  buildPlaceholder();
}

/**
 * Small API functions
 */
export function clearSearchResults() {
  searchIterator = undefined;
  completeMne = undefined;
  renderSearchResults();
  buildPlaceholder();
}

export function getPlaceholderString() {
  return placeholderString;
}

export function getSelectedMnemonic() {
  return searchIterator?.get() ?? completeMne;
}

/**
 * Generate search list iterator
 */
export function generateSearchIterator() {
  // Get important input string information
  const inputTrimStart = input.value.toLowerCase().trimStart();
  const inputSplit = inputTrimStart.split(' ');
  const inputMne = inputSplit.length ? inputSplit[0] : '';

  if (!(inputMne?.length)) {
    // Clear search results if empty input
    searchIterator = undefined;
    completeMne = undefined;

  } else {
    // Lookup potential mnemonic in the Trie for the appropriate ISA
    let isaTrie;
    switch (COPTS_ISA[isaParameter.value]) {
      case COPTS_ISA.RV32I:
        isaTrie = ISA_TRIE_RV32;
        break;
      case COPTS_ISA.RV64I:
        isaTrie = ISA_TRIE_RV64;
        break;
      case COPTS_ISA.RV128I:
        isaTrie = ISA_TRIE_RV128;
        break;
      default:
        isaTrie = ISA_TRIE;
    }

    if (inputSplit.length > 1) {
      // If space present after mnemonic, use completeMne
      if (inputMne !== completeMne) {
        searchIterator = undefined;
        completeMne = isaTrie.contains(inputMne) ? inputMne : undefined;
      }
    } else {
      // Otherwise, only writing to mne so use searchIterator
      searchIterator = isaTrie.iteratorAt(inputMne);
      completeMne = undefined;
    }
  }
}

/**
 * Render search list results
 */
function createSearchResultText(mne) {
  const inst = ISA[mne];
  const oprs = CANONICAL_OPERANDS[mne];
  return mne + (oprs?.length > 0 ? (' ' + oprs) : '');
}

function setSearchResultContent(elem, mne, textContent = undefined) {
  elem.mne = mne;
  elem.textContent = textContent ?? createSearchResultText(mne);
}

export function renderSearchResults() {
  // Only generate 1 result if completeMne is set
  if (completeMne !== undefined) {
    // Try to recycle top result
    if (searchResults.childElementCount >= 1) {
      // Skip if we can re-use top result, as it may have this mnemonic already
      if (searchResults.children[0].mne !== completeMne) {
        setSearchResultContent(searchResults.children[0], completeMne);
      }
      // Delete dangling children
      while (searchResults.childElementCount > 1) {
        searchResults.removeChild(searchResults.lastElementChild);
      }
    } else {
      // Can't recycle top result, create new one
      let elem = document.createElement('span');
      setSearchResultContent(elem, completeMne);
      searchResults.append(elem);
    }

    // Show results
    searchResults.toggleAttribute('hidden', false);

    // Exit early
    return;
  }

  // Invalid iterator, hide results and exit early
  if (!(searchIterator?.valid())) {
    searchResults.toggleAttribute('hidden', true);
    return;
  }

  // Create each result span
  let it = searchIterator.clone();
  searchResults.toggleAttribute('hidden', false);
  let endOfIterator = false;
  for (let i = 0; !endOfIterator && i < MAX_SEARCH_RESULTS; ++i) {
    // Either use existing span or create new one
    let elem;
    if (i < searchResults.childElementCount) {
      elem = searchResults.children[i];
      elem.classList.toggle('selected', false)
    } else {
      elem = document.createElement('span');
      searchResults.append(elem);
    }
    setSearchResultContent(elem, it.get());

    // Get next result
    endOfIterator = !(it.next());

    // If end of iterator, delete extra spans
    if (endOfIterator) {
      ++i;
      while (i < searchResults.childElementCount) {
        searchResults.removeChild(searchResults.children[i]);
      }
    }
  }

  // Select top result
  searchResults.children[0]?.classList?.toggle('selected', true);
}

/**
 * Iterate search results
 */
export function iterateSearchResults(forward) {
  // Invalid iterator, exit early
  if (!(searchIterator?.valid())) {
    return;
  }

  // Increment iterator, if already at end, exit
  if ((forward && !(searchIterator.next()))
      || (!forward && !(searchIterator.prev()))) {
    return;
  }

  // Find currently selected result
  let selectedIndex = 0;
  for (; selectedIndex < searchResults.childElementCount; ++selectedIndex) {
    if (searchResults.children[selectedIndex].classList.contains('selected')) {
      break;
    }
  }

  // Decide whether to just scroll selector or to scroll text elements
  if (forward) {
    // Forward version
    if (selectedIndex < MAX_SEARCH_RESULTS - 2) {
      // Unselect current result and select next result
      searchResults.children[selectedIndex].classList.toggle('selected', false);
      searchResults.children[selectedIndex + 1].classList.toggle('selected', true);
    } else {
      // Attempt to scroll text elements
      // Clone iterator and test if there is a next value
      let it = searchIterator.clone();
      if (it.next()) {
        // Push results up
        for (let i = 0; i < searchResults.childElementCount - 1; ++i) {
          setSearchResultContent(searchResults.children[i], searchResults.children[i + 1].mne, searchResults.children[i + 1].textContent);
        }
        // Write to bottom result
        let elem = searchResults.lastElementChild;
        setSearchResultContent(elem, it.get());

      } else if (selectedIndex < MAX_SEARCH_RESULTS - 1) {
        // If text scroll failed, try to do one last selector scroll
        searchResults.children[selectedIndex].classList.toggle('selected', false);
        searchResults.children[selectedIndex + 1].classList.toggle('selected', true);
      }
    }

  } else {
    // Backward version
    if (selectedIndex > 1) {
      // Unselect current result and select next result
      searchResults.children[selectedIndex].classList.toggle('selected', false);
      searchResults.children[selectedIndex - 1].classList.toggle('selected', true);
    } else {
      // Attempt to scroll text elements
      // Clone iterator and test if there is a prev value
      let it = searchIterator.clone();
      if (it.prev()) {
        // Push results down
        for (let i = searchResults.childElementCount - 1; i > 0; --i) {
          setSearchResultContent(searchResults.children[i], searchResults.children[i - 1].mne, searchResults.children[i - 1].textContent);
        }
        // Write to top result
        let elem = searchResults.firstElementChild;
        setSearchResultContent(elem, it.get());

      } else if (selectedIndex > 0) {
        // If text scroll failed, try to do one last selector scroll
        searchResults.children[selectedIndex].classList.toggle('selected', false);
        searchResults.children[selectedIndex - 1].classList.toggle('selected', true);
      }
    }
  }
}

/**
 * Generate placeholder string
 */
export function generatePlaceholderString() {
  // Invalid iterator, clear placeholder and exit early
  if (!(searchIterator?.valid())) {
    inputPlaceholder.value = '';
    placeholderString = '';
    return;
  }

  // Useful values from input element
  const inputTrimStart = input.value.trimStart();

  // Get placeholderString as suffix of mnemonic from iterator
  placeholderString = searchIterator.get().substring(inputTrimStart.length);
  return placeholderString;
}

export function renderPlaceholder() {
  // Determine whether or not to show placeholder
  if (placeholderString.length > 0) {
    const spaces = ' '.repeat(input.value.length);
    inputPlaceholder.value = spaces + placeholderString;
  } else {
    inputPlaceholder.value = '';
  }
}

/**
 * Scrolling function
 */
const scrollIterateThreshold = 30;
const scrollFullDampenTime = 250;
let scrollCarryOverDelta = 0;
let scrollPrevTime = 0;
function scrollSearchResults(delta) {
  // Exit early if there's only one result
  if (searchResults.childElementCount <= 1) {
    return;
  }

  // Dampen carryover
  scrollCarryOverDelta -= scrollCarryOverDelta * ((Date.now() - scrollPrevTime) / scrollFullDampenTime);

  // Perform the scroll, element by element
  const dir = delta > 0;
  delta = Math.abs(delta) + Math.max(0, scrollCarryOverDelta);
  while (delta >= scrollIterateThreshold) {
    iterateSearchResults(dir);
    generatePlaceholderString();
    delta -= scrollIterateThreshold;
  }

  // Track any carryover
  scrollCarryOverDelta = delta;
  scrollPrevTime = Date.now();
}

/**
 * Scrolling callback
 */
searchResults.onwheel = function(event) {
  // Call scroll function and prevent window scrolling
  scrollSearchResults(event.deltaY);
  event.preventDefault();
}

/**
 * Touch scrolling function
 */
const scrollTouchAmplify = 2.0;
let prevTouchY = 0;
function touchScrollSearchResults(touchY) {
  // Calculate scroll delta
  let delta = 0;
  if (Date.now() - scrollPrevTime > scrollFullDampenTime) {
    // Too long since last touch, just set prev
    prevTouchY = touchY;
  } else {
    // Calculate delta from last touch point
    delta = touchY - prevTouchY;
    prevTouchY = touchY;
  }

  // Reverse and amplify touch delta
  delta *= -scrollTouchAmplify;

  // Call scroll function
  scrollSearchResults(delta);
}

/**
 * Touch scrolling callback
 */
searchResults.ontouchmove = function(event) {
  // Call touch scroll function and prevent window scrolling
  touchScrollSearchResults(event.targetTouches[0].clientY);
  event.preventDefault();
}