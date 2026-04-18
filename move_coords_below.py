with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract the showCoordsInput block
coords_input_block_start = "                     {showCoordsInput && ("
coords_input_block_end = "                      )}\n"
start_idx = content.find(coords_input_block_start)
end_idx = content.find(coords_input_block_end, start_idx) + len(coords_input_block_end)

coords_html = content[start_idx:end_idx]

# 2. Remove it from its current position
content = content[:start_idx] + content[end_idx:]

# 3. Find the end of dpad-item and insert it there
# The end of the dpad-grid looks like:
#                              <div />
#                          </div>
#                      </div>
#                  </div>
#              )}

dpad_end_target = "                             <div />\n                         </div>\n                     </div>\n"
content = content.replace(dpad_end_target, dpad_end_target + coords_html)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done moving coords below dpad")
