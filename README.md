![Dynamic Content Grid Extension](media/screenshot.png)

# Dynamic Content Grid Extension

This extension allows users to place and resize grid items using a WYSIWYG editor, and edit their content by selecting them.

## Parameters

Parameters can go on instance or installation, with priority going to instance.

- `cols`: The number of columns on the grid. (default: 3)
- `pageSize`: The number of items on a page. (default: 24)
- `paginated`: Whether the grid is paginated or not. (default: true)
- `pageCount`: The number of pages content can be placed on. (default: 100)
- `mode`: The type of positioning that the grid items use. (default: absolute)
  - `absolute`: Position indices are always equivalent to the same position on the grid: `pageBase + (y * cols) + x`. Useful for layouts with only grid content, or for implementing custom wrapping logic.
  - `wrap`: Grid items consume `rows*cols` spaces directly after their position, and positions for surrounding spaces flow from left to right, up to down. Useful for placing items that need other content to wrap around them.
  - `wrap-simple`: Similar to wrap in that positions wrap around large grid items, but each grid item only takes up one position slot. Does not work with pagination.
- `contentTypes`: Content type information for the editor to display links and references. A list of objects with the following properties:
  - `id`: The schema ID of the content type.
  - `icon`: The URL of an icon to use for displaying the content type.
  - `card`: The templatized URL of a card to use for displaying the content type.

If you want to get started after cloning this repo, remember to sync packages with `npm i`.

## Multiple Column Layouts

It's possible to use more than one number of columns for a single grid layout, and have different positioning for each number of columns. This is useful for creating grid layouts for desktop, tablet and mobile at the same time.

First, provide `cols` in the extension parameters with an array of column numbers you want to create layouts for. Change all grid item properties to be an array of numbers (`rows`, `cols`, `position`). Each array item will represent the position and sizing of the item paired with the column number with the same array index. You should read these based on the number of columns you want on your render, so that you can use the unique layouts as the number of columns changes.

![Multi-Column Animation](media/grid-multi-column-animation-small.gif)


> Note: when multiple column layouts are used, the sorting order of grid items may be different between them. Make sure that your render is aware of this, and sorts based on the correct layout if necessary.

## Example Snippets

### Single column layout
```json
{
    "title": "Grid Content",
    "description": "Items to display in the grid",
    "type": "array",
    "minItems": 0,
    "maxItems": 10,
    "items": {
        "type": "object",
        "properties": {
            "position": {
                "title": "Grid Position",
                "description": "Grid item placement. Should not be a duplicate or overlap.",
                "type": "number",
                "minimum": 0,
                "default": 0
            },
            "cols": {
                "title": "Column Span",
                "description": "Width of the item in number of grid columns.",
                "type": "number",
                "minimum": 1,
                "default": 1
            },
            "rows": {
                "title": "Row Span",
                "description": "Height of the item in number of grid rows.",
                "type": "number",
                "minimum": 1,
                "default": 1
            }
            // Insert your item specific properties here.
        }
    },
    "ui:extension": {
        "name": "grid",
        "params": {
            "mode": "absolute",
            "cols": 3
        }
    }
}
```

### Multiple column layouts
```json
{
    "title": "Grid Content",
    "description": "Items to display in the grid",
    "type": "array",
    "minItems": 0,
    "maxItems": 10,
    "items": {
        "type": "object",
        "properties": {
            "position": {
                "title": "Grid Position",
                "description": "Grid item placement. Should not be a duplicate or overlap.",
                "type": "array",
                "items": {
                    "type": "number",
                    "minimum": 0,
                    "default": 0
                }
            },
            "cols": {
                "title": "Column Span",
                "description": "Width of the item in number of grid columns.",
                "type": "array",
                "items": {
                    "type": "number",
                    "minimum": 1,
                    "default": 1
                }
            },
            "rows": {
                "title": "Row Span",
                "description": "Height of the item in number of grid rows.",
                "type": "array",
                "items": {
                    "type": "number",
                    "minimum": 1,
                    "default": 1
                }
            }
            // Insert your item specific properties here.
        }
    },
    "ui:extension": {
        "name": "grid",
        "params": {
            "mode": "absolute",
            "cols": [1, 2, 3]
        }
    }
}
```

## How to install

### Register Extension

This extension needs to be [registered](https://amplience.com/docs/development/registeringextensions.html) against a Hub with in the Dynamic Content application (Developer -> Extensions), for it to load within that Hub.

#### Setup

![Setup](media/setup.png)

* Category: Content Field
* Label: Grid _(this will appear as the tab title in the Dashboard)_
* Name: grid _(needs to be unique with the Hub)_
* URL: [https://grid-extension.dc-demostore.com/](https://grid-extension.dc-demostore.com/)
* Description: Grid Layout Extension _(can be left blank, if you wish)_

Note:
You can use our deployed version of this extension (builds from the "production" branch) -

[https://grid-extension.dc-demostore.com/](https://grid-extension.dc-demostore.com/)

_As this is an open source project you're welcome to host your own "fork" of this project. You can use any standard static hosting service (Netlify, Amplify, Vercel, etc.) if you wish._

##### Permissions

![Permissions](media/permissions.png)

Sandbox permissions:
- Allow same origin (required to load font)

## Output Data Format & Usage

The grid extension manages an array of objects with the following properties:

- `position`: The position of this item on the grid, absolute or wrapped based on the extension parameter. (see above)
- `cols`: How many columns this item spans. (width)
- `rows`: How many rows this item spans. (height)

Any other properties in the object are exposed via the content field editor that appears when you select a content item.

## Building and customisation

This extension was built and tested on node v16.x

To run the extension, please ensure your are on the correct node version and run:

`npm install` / `npm i`

## Available Scripts

In the project directory, you can run:

### `HTTPS=true npm start`

Runs the app in the development mode.\
Open [https://localhost:3000](https://localhost:3000) to view it in your browser.\
You can use this as the extension URL in DC to test local changes.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Useful Links
 * [Contributing](./CONTRIBUTING.md)
 * [Support](./support.md)
 * [Licensing](./LICENSE)
