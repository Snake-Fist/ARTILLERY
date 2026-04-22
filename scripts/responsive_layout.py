import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app_target = f.read()

# 1. DPAD grid sizing 26px -> 40px
app_target = app_target.replace("gridTemplateColumns: 'repeat(3, 26px)', gridTemplateRows: 'repeat(5, 26px)'", 
                                "gridTemplateColumns: 'repeat(3, 40px)', gridTemplateRows: 'repeat(5, 40px)'")
app_target = app_target.replace("fontSize: '14px'", "fontSize: '18px'")
app_target = app_target.replace("fontSize: '10px'", "fontSize: '12px'")

# 2. dpads-sidebar wrapper
app_target = app_target.replace("""<div className="dpads-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '220px' }}>""", 
                                """<div className="dpads-sidebar">""")

# 3. Grouping Contacts
# From: {showCoordsInput && ( ... )}
# To: <div className="sidebar-right-group"> {showCoordsInput && (...)} {showBDT && (...)} </div>
target_grouping = """                     {/* TERMINAL INPUTS */}
                     {showCoordsInput && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '12px' }}>
"""
new_grouping = """                     <div className="sidebar-right-group">
                     {/* TERMINAL INPUTS */}
                     {showCoordsInput && (
                         <div className="term-inputs-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '12px' }}>
"""

app_target = app_target.replace(target_grouping, new_grouping)

target_bdt_end = """                     )}
                 </div>
             )}"""

new_bdt_end = """                     )}
                     </div>
                 </div>
             )}"""
             
# Wait, let's use exact line replacements for BDT boundary.
# Let's inspect App.tsx for where showBDT ends.

# In App.tsx:
#                      {showBDT && (
#                          <div ...> ... </div>
#                      )}
#                  </div>
#              )}
# If I just match `                     )}\n                 </div>\n             )}`
# Let's write the CSS first to file.

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_target)

with open('src/index.css', 'r', encoding='utf-8') as f:
    css_target = f.read()

# Update map and sidebar flex
target_landscape = """@media (orientation: landscape) {
  .map-responsive-wrapper {
    flex-direction: row;
    height: 100%;
    position: relative;
  }
  .map-canvas-container {
    max-height: 100%;
  }
  .dpads-sidebar {
    flex-direction: column;
    height: 100%;
  }
}"""
new_landscape = """@media (orientation: landscape) {
  .map-responsive-wrapper {
    flex-direction: row;
    height: 100%;
    width: 100%;
    position: relative;
    display: flex;
  }
  .map-canvas-container {
    height: 100%;
    aspect-ratio: 1 / 1;
    flex-shrink: 0;
  }
  .dpads-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex: 1;
    padding: 0 20px;
    gap: 20px;
  }
  .sidebar-right-group {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
  }
}"""
css_target = css_target.replace(target_landscape, new_landscape)

target_portrait = """@media (orientation: portrait) {
  .map-responsive-wrapper {
    flex-direction: column;
    width: 100%;
  }
  .map-canvas-container {
    max-width: 100%;
  }
  .dpads-sidebar {
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 10px;
  }
}"""
new_portrait = """@media (orientation: portrait) {
  .map-responsive-wrapper {
    flex-direction: column;
    width: 100%;
    display: flex;
  }
  .map-canvas-container {
    width: 100%;
    aspect-ratio: 1 / 1;
  }
  .dpads-sidebar {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 10px;
    padding: 0 10px;
    box-sizing: border-box;
  }
  .sidebar-right-group {
    display: flex;
    flex-direction: row;
    gap: 30px;
    margin-left: auto;
    max-width: 600px;
    flex: 1;
    justify-content: flex-end;
  }
  .term-inputs-wrapper {
    min-width: 250px;
  }
}"""
css_target = css_target.replace(target_portrait, new_portrait)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(css_target)

print("done")
