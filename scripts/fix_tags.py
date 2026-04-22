with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # From line 1192 to 1219 we want to delete ALL of it EXCEPT for `{timerRender}`
    if i >= 1192 and i <= 1219:
        if "{timerRender}" in line or i == 1219:
            # wait, if i == 1219, that's "              </div>". We need that!
            # let's be careful.
            pass
    # Actually let's just do a string replacement
    
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """
                     {showCoordsInput && (
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
                      )}
                 </div>
                 
                 {timerRender}

                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>RNG</span><span>{gridData ? gridData.range : '----'} M</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>ADJ</span><span>{adjStr}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--term-border)', marginTop: '4px', paddingTop: '4px' }}><span>CHG</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{chargeStr}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>AZ</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{azDegStr}° / {azMilStr}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>EL</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{elDegStr}° / {elMilStr}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--term-border)', marginTop: '4px', paddingTop: '4px' }}><span>TOF</span><span>{tofStr}s</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>DISP</span><span>{calculation.valid && calculation.dispersion ? `~${calculation.dispersion}` : '--'} M</span></div>
                      </div>
                  )}
             </div>"""

replacement = """
                 </div>
                 
                 {timerRender}
             </div>"""

if target in content:
    content = content.replace(target, replacement)
else:
    # try just removing the orphaned divs if target isn't exact
    print("Exact target not found! Retrying with regex...")
    import re
    # We remove anything between {showMapSizeInput && (...)} (which ends at </div>) and {timerRender}
    content = re.sub(r'\{showCoordsInput && \(\s*<div.*?</div>\s*\)\s*\}\s*</div>', '</div>', content, flags=re.DOTALL)
    
    # We remove orphaned divs between {timerRender} and '</div>\n             {(showDPad'
    content = re.sub(r'(?<=timerRender\})\s*<div.*?</div>\s*\)\s*</div>\s*(?=\{\(showDPad\|\| showCoordsInput)', '\n             </div>\n\n             ', content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved!")
