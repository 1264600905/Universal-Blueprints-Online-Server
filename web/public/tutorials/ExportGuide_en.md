# Blueprint Export Detailed Guide

This guide explains each function option in the order they appear in the export window, from top to bottom.

---

## 1. Top Toolbar (Configuration & Automation)

At the very top of the window, there is a row of buttons for managing input state and translation:

1. **Enable Staging**: When checked, the content you filled in will be preserved even if you close the window. Click "Reset Content" to clear it.
2. **Language Switch**: Click to switch the language version currently being edited. You can write specific names and descriptions for different languages.
3. **Auto Translate**: Clicking this will use AI to automatically fill in translations for all other languages based on the text you currently entered.
4. **Auto Translate Config**: Set up the API Key and model address required for AI translation.

---

## 2. Core Information Area (Required & Optional)

This is the basic identity of the blueprint:

### 1. Building Name (Required)
- **Explanation**: Determines the saved file name.
- **Restrictions**: Cannot contain `< > : " / \ | ? *`.
- **Validation**: "Name Valid" or an error message will be displayed in real-time below the input box.

### 2. Description (Optional)
- **Explanation**: Detailed introduction of the building's function or background. Supports multi-line input.

### 3. Author (Optional)
- **Restrictions**: **Cannot contain spaces** or special symbols (such as `@ # $ %`), and cannot start with a number.
- **Suggestion**: Use English or Pinyin, e.g., `Artisan_Li`.

### 4. Export Area
- **Dropdown Menu**: Defaults to "Rectangle".
- **Allowed Area Export**: If you have set up an "Allowed Area" on the map and it contains at least one cell, you can select the corresponding area name here.

![Export Area Selection](ExportAreaSelection)

You can create a new allowed area and then use "Expand allowed area" to cover the building range you wish to export.

![Add Export Area](AddExportArea)

Then select this allowed area here and export. This achieves irregular export, exporting only the parts you selected.
Exporting by Allowed Area can greatly reduce unnecessary content being written, making the blueprint cleaner and more precise.
Also, when exporting by Allowed Area, since the box selection is no longer the export area, you are free to choose a better screenshot area.

![Export Area Example](ExportAreaExample)

For example, although the selected box in this blueprint is large, the actual size is determined by your allowed area.
If it is a huge base blueprint, you can split the blueprint size by dividing different export areas to reduce lag during placement.

### 5. Category (Required)
- **Default Mode**: Click the "Select Category" button and choose the closest one from the preset list.

![Category Selection](CategorySelection)

- **Custom Mode**: After checking "Use Custom Category" at the bottom, this box becomes editable. **Note: Custom category names cannot contain spaces either.**

![Custom Category Checkbox](CustomCategoryCheckbox)

Buildings exported with custom categories will be displayed in a separate classification.

![Custom Category Display](CustomCategoryDisplay)

You can release a series of blueprints yourself and use the same custom category name, so they will eventually be displayed together.

![Series Blueprint Display](SeriesBlueprintDisplay)

Inside the Remote Library, custom categories can also be selected.

![Remote Blueprint Category](RemoteBlueprintCategory)

This allows players to find your blueprints faster.

---

## 3. Advanced Function Cards (Enable as Needed)

These cards will only appear after checking the corresponding options at the bottom:

### 1. Fold Group Info
- **Group Name**: Blueprints with the same group name will be folded together in the library.

![Fold Group Example](FoldGroupExample)

- **Display Order**: The smaller the number, the higher it ranks in the folded list.

![Fold Group Ranking](FoldGroupRanking)

- **Set Cover**: Only one blueprint in a group can serve as the cover.
The design intent of this feature is to allow players to release phased blueprints, such as blueprints of a base at various stages, merging them for easier viewing.

### 2. Related URL
- **URL Name**: e.g., "Video Demo" or "Author's Homepage".

![URL Input Location](UrlInputLocation)

- **URL Address**: Only supports whitelisted domains like BiliBili, YouTube, Xiaoheihe, etc.

![URL Final Effect](UrlFinalEffect)

### 3. Custom Building ID
- **Usage**: If you want to **update and replace** an existing blueprint in the cloud, fill in the original ID of that blueprint. Otherwise, please keep it empty.

![Building ID Input](BuildingIDInput)

Note that updating a blueprint has a 3 to 5-minute delay, and you need to restart the game to truly see the modification effect.
---

### 3. Export All Items (Backup Export) —— **Important!**
This is the key switch distinguishing "Standard Version" from "Full Version" blueprints:

![Export All Items Checkbox](ExportAllItemsCheckbox)

- **Unchecked (Standard Sharing Mode)**:
    - **Includes**: Buildings, artificial floors, power conduits, water pipes, lamps, roof zones.
    - **Excludes**: Natural terrain like dirt/sand, resources on the ground, plants, pawns, animals.
    - **Features**: Small file size, strong compatibility, suitable for sharing designs.

- **Checked (Backup/Moving Mode)**:
    - **Includes**: Everything! Including natural terrain, every piece of wood on the ground, plants,
    even colonists and their equipment (requires Character Editor mod),
    storage building filters, workbench crafting recipes, storage zones (requires [KV] Save Storage, Outfit, Crafting, Dr).
    - **Features**: Displayed with a purple badge. Large file size, many dependencies, suitable for moving bases yourself or backing up saves.

---

## 5. Execute Selection
   Note that the screenshot selection is entirely based on **screen coordinates**. The top-left and bottom-right corners you click determine the screenshot range. If you move the camera during the screenshot process, the screenshot range will not change; it will always be the screen position you clicked, not the world coordinates of the game map!

## 6. Mod Report

If you want to know which mod the items in the layout belong to, you can use the Mod Report function.

![Mod Report Button](ModReportBtn)

Click and select the area you want to check for mods.

![Select Mod Report Area](ModReportSelectArea)

In the Mod Report page, you can see the mod content existing in the area.

![Mod Report Details](ModReportDetails)

Among them, **Show** can highlight the mod building cells. If selectable, these items will be selected. The **Delete** button will directly delete these items for you.

![Mod Report Highlight](ModReportHighlight)

And **Replace** means you can choose a building from a specific mod to replace this building or floor. The **Advanced Options** allow you to choose rotation and material. Note that selection may directly overwrite other buildings.

![Mod Report Replace Page](ModReportReplace)

This function is intended to help blueprint creators reduce mod dependencies for their blueprints.