with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add rangeCorrection state after showBDT
content = content.replace(
    "  const [showBDT, setShowBDT] = useState<boolean>(true);",
    "  const [showBDT, setShowBDT] = useState<boolean>(true);\n  const [rangeCorrection, setRangeCorrection] = useState<boolean>(false);\n  const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS'>('COORDS');"
)

# Remove the old activePage state declaration (now duplicated)
content = content.replace(
    "  const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS'>('COORDS');\n  const [activePage, setActivePage] = useState<'COORDS' | 'MAP'>('COORDS');",
    "  const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS'>('COORDS');"
)
# This might not match, let's try more carefully:
# The original has: const [activePage, setActivePage] = useState<'COORDS' | 'MAP'>('COORDS');
content = content.replace(
    "  const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS'>('COORDS');\n  const [activePage, setActivePage] = useState<'COORDS' | 'MAP'>('COORDS');",
    "  const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS'>('COORDS');"
)
content = content.replace(
    "  const [activePage, setActivePage] = useState<'COORDS' | 'MAP'>('COORDS');",
    ""
)

# 2. Wire rangeCorrection into the calculation - apply 0.96 factor to range before table lookup
old_calc = "        const r = parseFloat(activeRange);\n        \n        if (isNaN(r)) return { valid: false, message: 'INVALID RANGE' };"
new_calc = "        const rawR = parseFloat(activeRange);\n        \n        if (isNaN(rawR)) return { valid: false, message: 'INVALID RANGE' };\n        const r = rangeCorrection ? rawR * 0.96 : rawR;"
content = content.replace(old_calc, new_calc)

# Also add rangeCorrection to the useMemo deps
content = content.replace(
    "  }, [activeRange, gunElevStr, tgtElevStr, forcedCharge]);",
    "  }, [activeRange, gunElevStr, tgtElevStr, forcedCharge, rangeCorrection]);"
)

# 3. Add SETTINGS button to left bezel (between COORDS and TACTCL MAP)
old_left = '''        <div className="mfd-sidebar left">
            <button className={`osb-button ${activePage === 'COORDS' ? 'active' : ''}`} onClick={() => setActivePage('COORDS')}>COORDS</button>
            <div style={{ flex: 1 }} />
            <button className={`osb-button ${activePage === 'MAP' ? 'active' : ''}`} onClick={() => setActivePage('MAP')}>TACTCL<br/>MAP</button>
        </div>'''
new_left = '''        <div className="mfd-sidebar left">
            <button className={`osb-button ${activePage === 'COORDS' ? 'active' : ''}`} onClick={() => setActivePage('COORDS')}>COORDS</button>
            <div style={{ flex: 1 }} />
            <button className={`osb-button ${activePage === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActivePage('SETTINGS')}>SYS<br/>CFG</button>
            <button className={`osb-button ${activePage === 'MAP' ? 'active' : ''}`} onClick={() => setActivePage('MAP')}>TACTCL<br/>MAP</button>
        </div>'''
content = content.replace(old_left, new_left)

# 4. Add SETTINGS page content after the COORDS page block
# Find the spot where MAP page starts and insert SETTINGS page before it
settings_page = '''
      {activePage === 'SETTINGS' && (
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px dashed var(--term-border)', paddingBottom: '8px', fontSize: '11px', letterSpacing: '0.1em' }}>
                  SYSTEM CONFIGURATION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
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
              </div>
              <div style={{ borderTop: '1px dashed var(--term-border)', paddingTop: '8px', opacity: 0.4, fontSize: '10px' }}>
                  M107 HE / M777A2 HOW / ARMA REFORGER MOD
              </div>
          </div>
      )}

'''

old_map_section = "\n      {activePage === 'MAP' && ("
content = content.replace(old_map_section, settings_page + "\n      {activePage === 'MAP' && (", 1)

with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
