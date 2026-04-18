with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove rangeCorrection state
content = content.replace("const [rangeCorrection, setRangeCorrection] = useState<boolean>(true);", "")

# 2. Update bdtPosition state options
content = content.replace(
    "const [bdtPosition, setBdtPosition] = useState<'bottom-left' | 'top-left'>('bottom-left');",
    "const [bdtPosition, setBdtPosition] = useState<'bottom-left' | 'bottom-right'>('bottom-left');\n  const [coordsPosition, setCoordsPosition] = useState<'top-left' | 'top-right'>('top-left');\n  const [windSpeed, setWindSpeed] = useState<string>('');\n  const [windDir, setWindDir] = useState<string>('');"
)

# 3. Clean up the calculation dependency array
content = content.replace(", rangeCorrection", "")

# 4. Remove rangeCorrection math in calculation
content = content.replace(
    "const r = rangeCorrection ? rawR * 0.96 : rawR;",
    "const r = rawR;"
)

# 5. Remove rangeCorrection map ring logic
map_logic_old = """          if (rangeCorrection) {
              minR = minR / 0.96;
              maxR = maxR / 0.96;
          }"""

content = content.replace(map_logic_old, "")

# 6. Remove rangeCorrection UI from SETTINGS and update dropdowns
settings_old = """                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input
                          id="range-correction-cb"
                          type="checkbox"
                          checked={rangeCorrection}
                          onChange={(e) => setRangeCorrection(e.target.checked)}
                          style={{ marginTop: '2px', accentColor: 'var(--term-fg)', cursor: 'pointer', width: '14px', height: '14px', flexShrink: 0 }}
                      />
                      <label htmlFor="range-correction-cb" style={{ cursor: 'pointer', lineHeight: 1.5 }}>
                          RANGE CORRECTION (×0.96)<br/>
                          <span style={{ opacity: 0.6, fontSize: '10px' }}>
                              Compensates for ~4% overshoot observed in current mod version.
                              Reduces effective range by 4% before table lookup.
                          </span>
                      </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <label style={{ lineHeight: 1.5 }}>BDT LOCATION</label>
                      <select 
                          value={bdtPosition} 
                          onChange={(e) => setBdtPosition(e.target.value as 'bottom-left' | 'top-left')}
                          style={{
                              backgroundColor: 'transparent',
                              border: '1px solid var(--term-border)',
                              color: 'var(--term-fg)',
                              fontFamily: 'inherit',
                              padding: '2px',
                              outline: 'none'
                          }}
                      >
                          <option value="bottom-left" style={{ background: 'var(--term-bg)' }}>BOTTOM LEFT</option>
                          <option value="top-left" style={{ background: 'var(--term-bg)' }}>TOP LEFT</option>
                      </select>
                  </div>"""

settings_new = """                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <label style={{ lineHeight: 1.5 }}>BDT LOCATION:</label>
                      <select 
                          value={bdtPosition} 
                          onChange={(e) => setBdtPosition(e.target.value as 'bottom-left' | 'bottom-right')}
                          style={{ backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }}
                      >
                          <option value="bottom-left" style={{ background: 'var(--term-bg)' }}>BOTTOM LEFT</option>
                          <option value="bottom-right" style={{ background: 'var(--term-bg)' }}>BOTTOM RIGHT</option>
                      </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <label style={{ lineHeight: 1.5 }}>COORDS LOC:</label>
                      <select 
                          value={coordsPosition} 
                          onChange={(e) => setCoordsPosition(e.target.value as 'top-left' | 'top-right')}
                          style={{ backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }}
                      >
                          <option value="top-left" style={{ background: 'var(--term-bg)' }}>TOP LEFT</option>
                          <option value="top-right" style={{ background: 'var(--term-bg)' }}>TOP RIGHT</option>
                      </select>
                  </div>"""

content = content.replace(settings_old, settings_new)

# 7. Update coords overlay styling (transparent, position) and add wind inputs
old_coords_wrapper_start = "                 <div style={{ position: 'absolute', top: '15px', left: '15px', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', zIndex: 12 }}>"
new_coords_wrapper_start = "                 <div style={{ position: 'absolute', top: '15px', left: coordsPosition === 'top-left' ? '15px' : undefined, right: coordsPosition === 'top-right' ? '15px' : undefined, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', zIndex: 12 }}>"

content = content.replace(old_coords_wrapper_start, new_coords_wrapper_start)

# Update the exact background property of coords input form
content = content.replace(
    "backgroundColor: 'var(--term-bg)', border: '1px solid var(--term-border)'", 
    "backgroundColor: 'transparent'"
)

chg_block = '''                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', width: '30px' }}>CHG:</span>
                                  <select 
                                      value={forcedCharge === null ? 'AUTO' : forcedCharge.toString()}
                                      onChange={(e) => setForcedCharge(e.target.value === 'AUTO' ? null : parseInt(e.target.value))}
                                      style={{ width: '166px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }}
                                  >
                                      <option value="AUTO" style={{ background: 'var(--term-bg)' }}>AUTO (OPTIMAL)</option>
                                      <option value="1" style={{ background: 'var(--term-bg)' }}>CHARGE 1</option>
                                      <option value="2" style={{ background: 'var(--term-bg)' }}>CHARGE 2</option>
                                      <option value="3" style={{ background: 'var(--term-bg)' }}>CHARGE 3</option>
                                      <option value="4" style={{ background: 'var(--term-bg)' }}>CHARGE 4</option>
                                      <option value="5" style={{ background: 'var(--term-bg)' }}>CHARGE 5</option>
                                  </select>
                              </div>'''

wind_block = '''                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', width: '30px' }}>WND:</span>
                                  <input type="number" value={windSpeed} onChange={e => setWindSpeed(e.target.value)} style={{ width: '75px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="SPD m/s" />
                                  <input type="number" value={windDir} onChange={e => setWindDir(e.target.value)} style={{ width: '83px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="DIR (Deg)" />
                              </div>'''

content = content.replace(chg_block, chg_block + "\n" + wind_block)

# 8. Update BDT display position style
old_bdt_style = "position: 'absolute', bottom: bdtPosition === 'bottom-left' ? '15px' : undefined, top: bdtPosition === 'top-left' ? '120px' : undefined, left: '15px'"
new_bdt_style = "position: 'absolute', bottom: '15px', left: bdtPosition === 'bottom-left' ? '15px' : undefined, right: bdtPosition === 'bottom-right' ? '15px' : undefined"

content = content.replace(old_bdt_style, new_bdt_style)


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done modifications")
