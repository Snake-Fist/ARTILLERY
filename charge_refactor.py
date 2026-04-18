with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
state_target = "  const [forcedCharge, setForcedCharge] = useState<number | null>(null);"
state_new = "  const [forcedChargeStr, setForcedChargeStr] = useState<string>('');\n  const forcedCharge = forcedChargeStr === '' ? null : parseInt(forcedChargeStr);"
content = content.replace(state_target, state_new)

# 2. updateVal mappers
import re

content = re.sub(r"(if \(activeField === 'windDir'\) setWindDir\(updater\);)", r"\1\n        if (activeField === 'charge') setForcedChargeStr(updater);", content)

content = content.replace("['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir']", "['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge']")

# 3. Keydown logic
keydown_target = """              return nextVal;
          });
      }
      if (e.key === '.'"""
      
keydown_new = """              if (activeField === 'charge') {
                  if (e.key === '0') return '';
                  if (/^[1-5]$/.test(e.key)) return e.key;
                  return prev;
              }
              return nextVal;
          });
      }
      if (e.key === '.'"""
content = content.replace(keydown_target, keydown_new)

# 4. Keypad logic
keypad_target = """              return nextVal;
          });
      }
"""
keypad_new = """              if (activeField === 'charge') {
                  if (val === '0') return '';
                  if (/^[1-5]$/.test(val)) return val;
                  return prev;
              }
              return nextVal;
          });
      }
"""
# WAIT: keypad logic is inside `handleKeypadPress`.
# Let's cleanly replace keypad updateVal inner function
content = content.replace(
"""              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              return nextVal;
          });
      }""",
"""              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              if (activeField === 'charge') {
                  if (val === '0') return '';
                  if (/^[1-5]$/.test(val)) return val;
                  return prev;
              }
              return nextVal;
          });
      }"""
)


# 5. UI replacements
# There are two places where the SELECT is used potentially (one in map size input logic maybe? NO, map size is something else).
# But there are two matches for `setForcedCharge(e.target.value === 'AUTO' ? null : parseInt(e.target.value))`
# One is in `showMapSizeInput` maybe? No, `showCoordsInput`.
# Let's just find the whole <div> mapping the SELECT and replace it.

ui_target1 = """                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                                 <span style={{ fontSize: '14px', width: '70px' }}>CHARGE</span>
                                 <select 
                                     value={forcedCharge === null ? 'AUTO' : forcedCharge.toString()}
                                     onChange={(e) => setForcedCharge(e.target.value === 'AUTO' ? null : parseInt(e.target.value))}
                                     style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none', textAlign: 'right' }}
                                 >
                                     <option value="AUTO" style={{ background: 'var(--term-bg)' }}>AUTO</option>
                                     <option value="1" style={{ background: 'var(--term-bg)' }}>CH 1</option>
                                     <option value="2" style={{ background: 'var(--term-bg)' }}>CH 2</option>
                                     <option value="3" style={{ background: 'var(--term-bg)' }}>CH 3</option>
                                     <option value="4" style={{ background: 'var(--term-bg)' }}>CH 4</option>
                                     <option value="5" style={{ background: 'var(--term-bg)' }}>CH 5</option>
                                 </select>
                             </div>"""
                             
ui_new1 = """                             <TerminalField id="charge" label="CHARGE" val={forcedChargeStr === '' ? 'AUTO' : forcedChargeStr} />"""

content = content.replace(ui_target1, ui_new1)

# Ensure fallback doesn't miss the 30px version if it exists
ui_target2 = ui_target1.replace('width: \'70px\'', 'width: \'30px\'')
content = content.replace(ui_target2, ui_new1)


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
