import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update useState
content = content.replace(
    "const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS'>('MAP');",
    "const [activePage, setActivePage] = useState<'MAP' | 'SETTINGS'>('MAP');"
)

# 2. Update sidebar left
sidebar_old = """        <div className="mfd-sidebar left">
            <button className={`osb-button ${activePage === 'MAP' ? 'active' : ''}`} onClick={() => setActivePage('MAP')}>MAP</button>
            <button className={`osb-button ${activePage === 'COORDS' ? 'active' : ''}`} onClick={() => setActivePage('COORDS')}>COORDS</button>
            <div style={{ flex: 1 }} />
            <button className={`osb-button ${activePage === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActivePage('SETTINGS')}>SYS<br/>CFG</button>
        </div>"""
sidebar_new = """        <div className="mfd-sidebar left">
            <button className={`osb-button ${activePage === 'MAP' ? 'active' : ''}`} onClick={() => setActivePage('MAP')}>MAP</button>
            <div style={{ flex: 1 }} />
            <button className={`osb-button ${activePage === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActivePage('SETTINGS')}>SYS<br/>CFG</button>
        </div>"""
content = content.replace(sidebar_old, sidebar_new)

# 3. Remove COORDS block
block_start = "{activePage === 'COORDS' && ("
block_end = "{activePage === 'SETTINGS' && ("
start_idx = content.find(block_start)
end_idx = content.find(block_end)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]

# 4. Update the coords overlay
overlay_old = """                     {showCoordsInput && (
                          <div style={{ pointerEvents: 'auto', backgroundColor: 'var(--term-bg)', border: '1px solid var(--term-border)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', width: '30px' }}>GUN:</span>
                                  <input type="text" value={gunX} onChange={e => setGunX(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="X" />
                                  <input type="text" value={gunY} onChange={e => setGunY(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="Y" />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', width: '30px' }}>TGT:</span>
                                  <input type="text" value={tgtX} onChange={e => setTgtX(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="X" />
                                  <input type="text" value={tgtY} onChange={e => setTgtY(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="Y" />
                              </div>
                          </div>
                      )}"""

overlay_new = """                     {showCoordsInput && (
                          <div style={{ pointerEvents: 'auto', backgroundColor: 'var(--term-bg)', border: '1px solid var(--term-border)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', width: '30px' }}>GUN:</span>
                                  <input type="text" value={gunX} onChange={e => setGunX(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="X" />
                                  <input type="text" value={gunY} onChange={e => setGunY(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="Y" />
                                  <input type="text" value={gunElevStr} onChange={e => setGunElevStr(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="EL" />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', width: '30px' }}>TGT:</span>
                                  <input type="text" value={tgtX} onChange={e => setTgtX(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="X" />
                                  <input type="text" value={tgtY} onChange={e => setTgtY(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="Y" />
                                  <input type="text" value={tgtElevStr} onChange={e => setTgtElevStr(e.target.value)} style={{ width: '50px', backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none' }} placeholder="EL" />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                              </div>
                          </div>
                      )}"""

content = content.replace(overlay_old, overlay_new)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Replaced string sizes: {len(sidebar_old)} -> {len(sidebar_new)}, and Block removed: {start_idx} to {end_idx}, Overlay length: {len(overlay_old)} -> {len(overlay_new)}")
