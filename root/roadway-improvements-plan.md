# Roadway Improvements Visualization Plan

## Overview
Create a new visualization that identifies crash-causing factors and suggests infrastructure interventions. The visualization shows four improvement types as circles overlaid on the map at crash locations, with circle size representing the need level based on crash data.

## Implementation Steps

### 1. Create New Visualization File (`js/improvementsVis.js`)
- Follow the D3 update pattern (initVis -> wrangleData -> updateVis)
- Create a class `ImprovementsVis` similar to existing visualization classes
- Reuse MapVis's SVG and projection to overlay circles on the map (similar to CrashPointsVis)
- Display four improvement types as circles positioned at crash locations:
  - **Speeding** → Dynamic Speed Signs (yellow: rgba(237,225,55,0.8))
  - **Darkness** → Street Lighting (dark grey: rgba(0,0,0,0.64))
  - **Ice** → Anti-icing Technology (blue: rgba(58,93,220,0.8))
  - **Inattentive Drivers** → Rumble Strips (red: rgba(237,70,55,0.8))
- Create factor filter checkboxes dynamically with D3 in `initVis()` or separate method
- Create "Back" button dynamically with D3 in options panel
- Create "Factors in Accident" title dynamically with D3

### 2. Data Processing
- Analyze crash data to identify factors (field names TBD - need to check CSV):
  - **Speeding**: Count crashes where speed is a contributing factor
  - **Darkness**: Count crashes in dark conditions (lighting condition or time-based)
  - **Ice**: Count crashes in icy conditions (road surface or weather)
  - **Inattentive Drivers**: Count crashes with distraction/inattention factors
- Filter by selected year (respects timeline filter)
- Group crashes by location and factor type
- Calculate "need level" for each improvement based on crash count at each location
- Size circles proportionally to need level (using area, not radius)
- Position circles at crash locations using map projection

### 3. Visual Design (Based on Figma)
- Circles overlaid directly on the map at crash locations
- Circle area scales with need level (use `d3.scaleSqrt()` for area-based sizing)
- Each improvement type has distinct color matching Figma:
  - Speeding: rgba(237,225,55,0.8) - yellow
  - Dark: rgba(0,0,0,0.64) - dark grey
  - Ice: rgba(58,93,220,0.8) - blue
  - Inattentive Driver: rgba(237,70,55,0.8) - red
- Hover tooltip shows:
  - Improvement name
  - Number of crashes that would benefit
  - Brief description
- Double-click opens modal/detail view with:
  - Detailed statistics
  - Link to relevant Road Safety Strategy page
  - Information from provided resources

### 4. HTML Updates (`index.html`)
- Add separate button to trigger improvements view (next to play button)
- Include script tag for new `improvementsVis.js` file
- Factor filter checkboxes and "Back" button will be created dynamically with D3 in the visualization classes

### 5. Main.js Integration
- Add global variable for `myImprovementsVis`
- Add view toggle state (map view vs improvements view)
- Wire separate improvements view button to switch to improvements view
- Pass crash data and MapVis's SVG/projection to improvements visualization
- Improvements view respects year filter from timeline
- When switching views:
  - Hide/show severity filters vs factor filters (created dynamically with D3)
  - Hide/show crash points vs improvement circles
  - Show/hide "Back" button (created dynamically with D3)
- Connect factor filter checkboxes to update improvements visualization
- Multiple factor filters can be selected simultaneously

### 6. CSS Styling (`css/style.css`)
- Style "Back" button (created with D3) to match Figma (black button, rounded, with shadow)
- Style factor filter checkboxes (created with D3) similar to severity filters but with new colors:
  - Speeding: rgba(237,225,55,0.8)
  - Dark: rgba(0,0,0,0.64)
  - Ice: rgba(58,93,220,0.8)
  - Inattentive Driver: rgba(237,70,55,0.8)
- Style improvement circles (colors match Figma)
- Style tooltip
- Style modal/detail view for double-click

### 7. Resource Links Integration
- Store URLs for each improvement type:
  - Street Lighting: https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/street_lighting_and_illumination
  - Rumble Strips: https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/rumble_strips
  - Dynamic Speed Signs: https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/changeable_%28variable%2C_dynamic%2C_active%29_message_signs
  - Anti-icing Technology: https://roadsafetystrategy.ca/en/listing-directory/roadsafetystrategy/anti-icing_technology
- Include links in double-click detail view

## Key Technical Details

### D3 Update Pattern Structure
```javascript
class ImprovementsVis {
    constructor(svg, projection, crashData) { 
        // Reuse MapVis's SVG and projection
    }
    initVis() { /* Set up scales, initial state, create UI elements with D3 */ }
    wrangleData(crashData, selectedYear, activeFactors) { 
        /* Filter by year and factors, group by location, calculate need levels */ 
    }
    updateVis() { /* D3 enter/update/exit pattern for circles on map */ }
}
```

### Circle Sizing & Positioning
- Use area-based scaling: `radius = Math.sqrt(needLevel * scaleFactor)`
- Or use `d3.scaleSqrt()` for proper area scaling
- Position circles using MapVis's projection: `projection([lng, lat])`
- Cluster nearby crashes similar to CrashPointsVis approach

### View Toggling
- Toggle visibility of crash points vs improvement circles
- Replace severity filter UI with factor filter UI (created dynamically with D3)
- "Back" button (created with D3) toggles back to map view
- Maintain state in main.js to track current view mode

## Key Design Decisions (Based on User Input & Figma)
1. **Year Filter**: Improvements view respects year filter from timeline ✓
2. **Severity Filters**: Replaced with factor filters in improvements view ✓
3. **Circle Layout**: Circles overlaid on map at crash locations ✓
4. **Navigation**: Separate button to trigger improvements view, "Back" button to return ✓
5. **Factor Selection**: Multiple factor filters can be selected simultaneously ✓
6. **UI Creation**: Factor filters, "Back" button, and panel title created dynamically with D3 ✓
7. **Factor Colors** (from Figma):
   - Speeding: rgba(237,225,55,0.8) - yellow
   - Dark: rgba(0,0,0,0.64) - dark grey  
   - Ice: rgba(58,93,220,0.8) - blue
   - Inattentive Driver: rgba(237,70,55,0.8) - red

## Questions to Resolve
1. What are the exact field names in the CSV for:
   - Speed/speeding crashes?
   - Lighting conditions (darkness)?
   - Road/weather conditions (ice)?
   - Contributing factors (inattention)?

## Implementation Todos
1. Create js/improvementsVis.js with ImprovementsVis class following D3 update pattern, reusing MapVis SVG and projection
2. Create factor filter checkboxes dynamically with D3 in ImprovementsVis or main.js (Speeding, Dark, Ice, Inattentive Driver)
3. Create Back button dynamically with D3 in options panel, styled as black button matching Figma
4. Create 'Factors in Accident' title dynamically with D3 when in improvements view
5. Add separate button in index.html next to play button to trigger improvements view
6. Implement data wrangling to identify crashes by factor (speeding, darkness, ice, inattention) and calculate need levels, respecting year filter
7. Implement circle rendering overlaid on map with area-based sizing, Figma colors, and positioning at crash locations
8. Add hover tooltips showing improvement name, crash count, and description
9. Implement double-click handler to show detailed modal with statistics and resource links
10. Wire up view toggle in main.js to switch between map and improvements views, handle factor filters (multiple selection), and connect to timeline year changes
11. Add CSS styling for Back button, factor filter checkboxes with correct colors, circles, tooltips, and modal
12. Integrate Road Safety Strategy URLs into double-click detail view

