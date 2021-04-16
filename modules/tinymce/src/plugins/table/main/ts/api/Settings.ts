/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Arr, Obj, Optional, Type } from '@ephox/katamari';
import Editor from 'tinymce/core/api/Editor';
import { Menu } from 'tinymce/core/api/ui/Ui';

export interface StringMap {
  [key: string]: string;
}

type ClassList = Array<{title: string; value: string}>;
type TableSizingMode = 'fixed' | 'relative' | 'responsive' | 'auto';

const defaultTableToolbar = 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol';

const defaultStyles = {
  'border-collapse': 'collapse',
  'width': '100%'
};

const defaultCellBorderWidth = [
  {
    title: '1px',
    value: '1px'
  },
  {
    title: '2px',
    value: '2px'
  },
  {
    title: '3px',
    value: '3px'
  },
  {
    title: '4px',
    value: '4px'
  },
  {
    title: '5px',
    value: '5px'
  }
];

const defaultCellBorderStyles = [
  {
    title: 'Solid',
    value: 'solid'
  },
  {
    title: 'Dashed',
    value: 'dashed'
  },
  {
    title: 'Dotted',
    value: 'dotted'
  },
  {
    title: 'Double',
    value: 'double'
  }
];

const mapColors = (colorMap: string[]): Menu.ChoiceMenuItemSpec[] => {
  const colors: Menu.ChoiceMenuItemSpec[] = [];

  const canvas = document.createElement('canvas');
  canvas.height = 1;
  canvas.width = 1;
  const canvasContext = canvas.getContext('2d');

  const byteAsHex = (colorByte: number, alphaByte: number) => {
    const bg = 255;
    const alpha = (alphaByte / 255);
    const colorByteWithWhiteBg = Math.round((colorByte * alpha) + (bg * (1 - alpha)));
    return ('0' + colorByteWithWhiteBg.toString(16)).slice(-2).toUpperCase();
  };

  const asHexColor = (color: string) => {
    // backwards compatibility
    if (/^[0-9A-Fa-f]{6}$/.test(color)) {
      return '#' + color.toUpperCase();
    }
    // all valid colors after this point
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    // invalid colors will be shown as white - the first assignment will pass and the second may be ignored
    canvasContext.fillStyle = '#FFFFFF'; // lgtm[js/useless-assignment-to-property]
    canvasContext.fillStyle = color;
    canvasContext.fillRect(0, 0, 1, 1);
    const rgba = canvasContext.getImageData(0, 0, 1, 1).data;
    const r = rgba[0], g = rgba[1], b = rgba[2], a = rgba[3];
    return '#' + byteAsHex(r, a) + byteAsHex(g, a) + byteAsHex(b, a);
  };

  for (let i = 0; i < colorMap.length; i += 2) {
    const value = colorMap[i];

    if (value === 'remove') {
      colors.push({
        type: 'choiceitem',
        text: 'Remove color',
        icon: 'color-swatch-remove-color',
        value: 'remove'
      });
    } else if (value === 'custom') {
      colors.push({
        type: 'choiceitem',
        text: 'Custom color',
        icon: 'color-picker',
        value: 'custom'
      });
    } else {
      colors.push({
        text: colorMap[i + 1],
        value: asHexColor(colorMap[i]),
        type: 'choiceitem'
      });
    }
  }

  return colors;
};

const determineDefaultStyles = (editor: Editor) => {
  if (isPixelsForced(editor)) {
    const editorWidth = editor.getBody().offsetWidth;
    return { ...defaultStyles, width: editorWidth + 'px' };
  } else if (isResponsiveForced(editor)) {
    return Obj.filter(defaultStyles, (_value, key) => key !== 'width');
  } else {
    return defaultStyles;
  }
};

const defaultAttributes = {
  border: '1'
};

const defaultColumnResizingBehaviour = 'preservetable';

const getTableSizingMode = (editor: Editor): TableSizingMode => editor.getParam('table_sizing_mode', 'auto');
const getTableResponseWidth = (editor: Editor): boolean | undefined => editor.getParam('table_responsive_width');

const getDefaultAttributes = (editor: Editor): StringMap => editor.getParam('table_default_attributes', defaultAttributes, 'object');
const getDefaultStyles = (editor: Editor): StringMap => editor.getParam('table_default_styles', determineDefaultStyles(editor), 'object');
const hasTableResizeBars = (editor: Editor): boolean => editor.getParam('table_resize_bars', true, 'boolean');
const hasTabNavigation = (editor: Editor): boolean => editor.getParam('table_tab_navigation', true, 'boolean');
const hasAdvancedCellTab = (editor: Editor): boolean => editor.getParam('table_cell_advtab', true, 'boolean');
const hasAdvancedRowTab = (editor: Editor): boolean => editor.getParam('table_row_advtab', true, 'boolean');
const hasAdvancedTableTab = (editor: Editor): boolean => editor.getParam('table_advtab', true, 'boolean');
const hasAppearanceOptions = (editor: Editor): boolean => editor.getParam('table_appearance_options', true, 'boolean');
const hasTableGrid = (editor: Editor): boolean => editor.getParam('table_grid', true, 'boolean');
const shouldStyleWithCss = (editor: Editor): boolean => editor.getParam('table_style_by_css', false, 'boolean');
const shouldNormalizeBorder = (editor: Editor): boolean => editor.getParam('table_normalize_border', false, 'boolean');
const getCellClassList = (editor: Editor): ClassList => editor.getParam('table_cell_class_list', [], 'array');

const getTableBorderWidths = (editor: Editor): ClassList => editor.getParam('table_border_widths', defaultCellBorderWidth, 'array');

const getTableBorderStyles = (editor: Editor): ClassList => editor.getParam('table_border_styles', defaultCellBorderStyles, 'array');

const getRowClassList = (editor: Editor): ClassList => editor.getParam('table_row_class_list', [], 'array');

const getTableClassList = (editor: Editor): ClassList => editor.getParam('table_class_list', [], 'array');

const isPercentagesForced = (editor: Editor): boolean => getTableSizingMode(editor) === 'relative' || getTableResponseWidth(editor) === true;
const isPixelsForced = (editor: Editor): boolean => getTableSizingMode(editor) === 'fixed' || getTableResponseWidth(editor) === false;
const isResponsiveForced = (editor: Editor): boolean => getTableSizingMode(editor) === 'responsive';
const getToolbar = (editor: Editor): string => editor.getParam('table_toolbar', defaultTableToolbar);

const useColumnGroup = (editor: Editor): boolean => editor.getParam('table_use_colgroups', false, 'boolean');

const getTableHeaderType = (editor: Editor): string => {
  const defaultValue = 'section';
  const value = editor.getParam('table_header_type', defaultValue, 'string');
  const validValues = [ 'section', 'cells', 'sectionCells', 'auto' ];
  if (!Arr.contains(validValues, value)) {
    return defaultValue;
  } else {
    return value;
  }
};

const getColumnResizingBehaviour = (editor: Editor): 'preservetable' | 'resizetable' => {
  const validModes: Array<'preservetable' | 'resizetable'> = [ 'preservetable', 'resizetable' ];
  const givenMode = editor.getParam('table_column_resizing', defaultColumnResizingBehaviour, 'string');
  return Arr.find(validModes, (mode) => mode === givenMode).getOr(defaultColumnResizingBehaviour);
};

const isPreserveTableColumnResizing = (editor: Editor) => getColumnResizingBehaviour(editor) === 'preservetable';
const isResizeTableColumnResizing = (editor: Editor) => getColumnResizingBehaviour(editor) === 'resizetable';

const getCloneElements = (editor: Editor): Optional<string[]> => {
  const cloneElements = editor.getParam('table_clone_elements');

  if (Type.isString(cloneElements)) {
    return Optional.some(cloneElements.split(/[ ,]/));
  } else if (Array.isArray(cloneElements)) {
    return Optional.some(cloneElements);
  } else {
    return Optional.none();
  }
};

const hasObjectResizing = (editor: Editor): boolean => {
  const objectResizing = editor.getParam('object_resizing', true);
  return Type.isString(objectResizing) ? objectResizing === 'table' : objectResizing;
};

const getTableCellBackgroundColors = (editor: Editor): Menu.ChoiceMenuItemSpec[] => {
  return mapColors(editor.getParam('table_cell_background_color_map', []));
};

const getTableCellBorderColors = (editor: Editor): Menu.ChoiceMenuItemSpec[] => {
  return mapColors(editor.getParam('table_cell_border_color_map', []));
};

export {
  getDefaultAttributes,
  getDefaultStyles,
  hasTableResizeBars,
  hasTabNavigation,
  hasAdvancedCellTab,
  hasAdvancedRowTab,
  hasAdvancedTableTab,
  hasAppearanceOptions,
  hasTableGrid,
  shouldStyleWithCss,
  shouldNormalizeBorder,
  getCellClassList,
  getRowClassList,
  getTableClassList,
  getCloneElements,
  hasObjectResizing,
  isPercentagesForced,
  isPixelsForced,
  isResponsiveForced,
  getToolbar,
  getTableHeaderType,
  getColumnResizingBehaviour,
  isPreserveTableColumnResizing,
  isResizeTableColumnResizing,
  useColumnGroup,
  getTableCellBackgroundColors,
  getTableBorderWidths,
  getTableBorderStyles,
  getTableCellBorderColors
};
