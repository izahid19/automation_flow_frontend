/**
 * Custom hook for managing items in quotes and purchase orders
 * Handles add, remove, copy, and update operations
 */

import { useState, useCallback } from 'react';
import {
  createNewItem,
  duplicateItem,
  updateItemField,
} from '@/utils/itemHelpers';

/**
 * Hook for managing a list of items
 * @param {array} initialItems - Initial items array
 * @param {object} options - Configuration options
 * @returns {object} Items state and management functions
 */
export const useItemManagement = (initialItems = [], options = {}) => {
  const {
    minItems = 1,
    onItemsChange,
  } = options;

  const [items, setItems] = useState(initialItems);

  /**
   * Add a new item to the list
   */
  const addItem = useCallback(() => {
    const newItem = createNewItem();
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
  }, [items, onItemsChange]);

  /**
   * Remove an item at specific index
   * @param {number} index - Index of item to remove
   */
  const removeItem = useCallback((index) => {
    if (items.length <= minItems) {
      return; // Don't allow removing below minimum
    }

    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    
    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
  }, [items, minItems, onItemsChange]);

  /**
   * Copy/duplicate an item at specific index
   * @param {number} index - Index of item to duplicate
   */
  const copyItem = useCallback((index) => {
    if (index < 0 || index >= items.length) {
      return; // Invalid index
    }

    const itemToCopy = duplicateItem(items[index]);
    const updatedItems = [...items, itemToCopy];
    setItems(updatedItems);
    
    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
  }, [items, onItemsChange]);

  /**
   * Update a specific field in an item
   * @param {number} index - Index of item to update
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const updateItem = useCallback((index, field, value) => {
    if (index < 0 || index >= items.length) {
      return; // Invalid index
    }

    const updatedItems = [...items];
    const currentItem = updatedItems[index];
    
    // Use updateItemField to handle dependencies
    updatedItems[index] = updateItemField(currentItem, field, value);
    
    setItems(updatedItems);
    
    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
  }, [items, onItemsChange]);

  /**
   * Replace entire item at index
   * @param {number} index - Index of item to replace
   * @param {object} newItem - New item object
   */
  const replaceItem = useCallback((index, newItem) => {
    if (index < 0 || index >= items.length) {
      return; // Invalid index
    }

    const updatedItems = [...items];
    updatedItems[index] = newItem;
    setItems(updatedItems);
    
    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
  }, [items, onItemsChange]);

  /**
   * Replace all items
   * @param {array} newItems - New items array
   */
  const setAllItems = useCallback((newItems) => {
    setItems(newItems);
    
    if (onItemsChange) {
      onItemsChange(newItems);
    }
  }, [onItemsChange]);

  /**
   * Reset to initial items
   */
  const reset = useCallback(() => {
    setItems(initialItems);
    
    if (onItemsChange) {
      onItemsChange(initialItems);
    }
  }, [initialItems, onItemsChange]);

  /**
   * Get item count
   */
  const getItemCount = useCallback(() => {
    return items.length;
  }, [items]);

  /**
   * Check if can remove items (above minimum)
   */
  const canRemoveItems = useCallback(() => {
    return items.length > minItems;
  }, [items, minItems]);

  return {
    items,
    addItem,
    removeItem,
    copyItem,
    updateItem,
    replaceItem,
    setAllItems,
    reset,
    getItemCount,
    canRemoveItems,
  };
};

export default useItemManagement;
