with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove coordsPosition state and settings dropdown
content = content.replace("  const [coordsPosition, setCoordsPosition] = useState<'top-left' | 'top-right'>('top-left');\n", "")

coords_settings_block_start = "                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>\n                      <label style={{ lineHeight: 1.5 }}>COORDS LOC:</label>"
coords_settings_block_end = "                  </div>"

start_idx = content.find(coords_settings_block_start)
if start_idx != -1:
    end_idx = content.find(coords_settings_block_end, start_idx) + len(coords_settings_block_end)
    content = content[:start_idx] + content[end_idx:]


# 2. Find and extract the showCoordsInput block from map canvas container.
coords_input_block_start = "                     {showCoordsInput && ("
coords_input_block_end = "                      )}\n                 </div>\n                 \n                 {timerRender}"
start_idx = content.find(coords_input_block_start)
if start_idx != -1:
    end_idx = content.find("                      )}\n", start_idx) + len("                      )}\n")
    coords_html = content[start_idx:end_idx]
    
    # We remove it from the map container wrapper... 
    # But wait, it's currently inside the wrapper:
    wrapper_start = "                 <div style={{ position: 'absolute', top: '15px', left: coordsPosition === 'top-left' ? '15px' : undefined, right: coordsPosition === 'top-right' ? '15px' : undefined, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', zIndex: 12 }}>\n"
    wrapper_close = "                 </div>\n                 \n                 {timerRender}"
    # actually, earlier we replaced the top/left wrapper.
    # Let's cleanly just find where the wrapper is and pull coords out.
    
    wrap_start_idx = content.find("                 <div style={{ position: 'absolute', top: '15px'")
    if wrap_start_idx != -1:
        wrap_end_idx = content.find("                 </div>\n                 \n                 {timerRender}")
        if wrap_end_idx != -1:
            # We want to pull showCoordsInput out of that wrapper. The wrapper also holds showMapSizeInput!
            # Let's specifically just delete showCoordsInput from wherever it is.
            content = content.replace(coords_html, "")
            
            # Now modify coords_html to not have absolute positioning
            coords_html_new = coords_html.replace(
                "style={{ pointerEvents: 'auto', backgroundColor: 'transparent', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}",
                "style={{ backgroundColor: 'transparent', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}"
            )
            
            # 3. Insert coords_html_new into dpads-sidebar, above the dpad item
            dpad_target = "             {showDPad && (\n                 <div className=\"dpads-sidebar\">\n"
            content = content.replace(dpad_target, dpad_target + coords_html_new + "\n")


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
