import re

with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State changes
if "spotterTargets" not in code:
    code = re.sub(
        r"const \[activePage, setActivePage\] = useState<'COORDS'\s*\|\s*'MAP'\s*\|\s*'SETTINGS'>\('MAP'\);",
        "const [activePage, setActivePage] = useState<'COORDS' | 'MAP' | 'SETTINGS' | 'SPOTTER'>('MAP');",
        code
    )
    
    code = code.replace(
        "const [windDir, setWindDir] = useState<string>('');",
        "const [windDir, setWindDir] = useState<string>('');\n  const [spotterTargets, setSpotterTargets] = useState<Record<number, {x:string, y:string, alt:string}>>({});\n  const [dpadTgtMode, setDpadTgtMode] = useState<boolean>(false);"
    )

    code = code.replace(
        "const currVals: Record<string, string> = { gunX, gunY, gunElev: gunElevStr, tgtX, tgtY, tgtElev: tgtElevStr, windSpeed, windDir, charge: forcedChargeStr, linkCode };",
        "const currVals: any = { gunX, gunY, gunElev: gunElevStr, tgtX, tgtY, tgtElev: tgtElevStr, windSpeed, windDir, charge: forcedChargeStr, linkCode, spotterTargets };"
    )
    
    code = code.replace(
        "if (data.windDir !== undefined && now - (m['windDir'] || 0) > 1500) setWindDir(data.windDir);",
        "if (data.windDir !== undefined && now - (m['windDir'] || 0) > 1500) setWindDir(data.windDir);\n                    if (data.spotterTargets !== undefined && now - (m['spotterTargets'] || 0) > 1500) setSpotterTargets(data.spotterTargets);"
    )
    
    code = code.replace(
        "last.windDir === windDir",
        "last.windDir === windDir &&\n                     JSON.stringify(last.spotterTargets) === JSON.stringify(spotterTargets)"
    )

    code = code.replace(
        "gunX, gunY, tgtX, tgtY, gunElevStr, tgtElevStr, forcedChargeStr, windSpeed, windDir",
        "gunX, gunY, tgtX, tgtY, gunElevStr, tgtElevStr, forcedChargeStr, windSpeed, windDir, spotterTargets"
    )
    
    # 2. handleKeypadPress intercept
    code = code.replace(
        "if (activeField === 'gunY') setGunY(updater);",
        "if (activeField === 'gunY') setGunY(updater);\n        if (activeField && activeField.startsWith('spot')) {\n            const i = parseInt(activeField.charAt(4));\n            const field = activeField.substring(5).toLowerCase();\n            setSpotterTargets(prev => ({\n                ...prev,\n                [i]: {\n                    ...(prev[i]||{x:'',y:'',alt:''}),\n                    [field]: updater((prev[i] as any)?.[field] || '')\n                }\n            }));\n        }"
    )

    code = code.replace(
        "const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];",
        "const isSpot = activeField && activeField.startsWith('spot');\n              const fields = isSpot ? [] : ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];"
    )

    keypad_start = "const handleKeypadPress = (val: string) => {\n      playSound(val);"
    keypad_tgt = """const handleKeypadPress = (val: string) => {
      playSound(val);
      
      if (dpadTgtMode && /^[1-9]$/.test(val)) {
          setDpadTgtMode(false);
          const t = spotterTargets[parseInt(val)];
          if (t && t.x !== '' && t.y !== '') {
              setTgtX(t.x);
              setTgtY(t.y);
              if (t.alt !== '') setTgtElevStr(t.alt);
          }
          return;
      }"""
    code = code.replace(keypad_start, keypad_tgt)

    # 3. Add OSB Button and Spotter Html
    code = code.replace(
        "<button className={`osb-button ${activePage === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActivePage('SETTINGS')}>SYS<br/>CFG</button>",
        "<button className={`osb-button ${activePage === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActivePage('SETTINGS')}>SYS<br/>CFG</button>\n            <button className={`osb-button ${activePage === 'SPOTTER' ? 'active' : ''}`} onClick={() => setActivePage('SPOTTER')}>SPT<br/>TGT</button>"
    )

    spotter_html = """{activePage === 'SPOTTER' && (
            <div className="terminal-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="terminal-header" style={{ marginBottom: '10px' }}>SPOTTER TARGETS</div>
                <div className="input-section" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {[1,2,3,4,5,6,7,8,9].map(i => {
                        const t = spotterTargets[i] || {x:'', y:'', alt:''};
                        return (
                            <div key={i} style={{ marginBottom: '15px' }}>
                                <div style={{ color: 'var(--term-fg)', marginBottom: '4px', borderBottom: '1px solid var(--term-border)' }}>TARGET {i}</div>
                                <div className="input-row">
                                    <span>X:</span>
                                    <input 
                                        type="text" 
                                        className={`terminal-input ${activeField === `spot${i}X` ? 'active' : ''}`}
                                        value={t.x}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/[^0-9]/g, '');
                                            if (v.length > 4) v = v.substring(0, 4);
                                            setSpotterTargets(p => ({...p, [i]: {...(p[i]||{x:'',y:'',alt:''}), x: v}}));
                                        }}
                                        onFocus={() => { setJustFocusedField(`spot${i}X`); setActiveField(`spot${i}X`); }}
                                        onBlur={() => { if (activeField === `spot${i}X`) setActiveField('linkCode'); }}
                                    />
                                </div>
                                <div className="input-row">
                                    <span>Y:</span>
                                    <input 
                                        type="text" 
                                        className={`terminal-input ${activeField === `spot${i}Y` ? 'active' : ''}`}
                                        value={t.y}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/[^0-9]/g, '');
                                            if (v.length > 4) v = v.substring(0, 4);
                                            setSpotterTargets(p => ({...p, [i]: {...(p[i]||{x:'',y:'',alt:''}), y: v}}));
                                        }}
                                        onFocus={() => { setJustFocusedField(`spot${i}Y`); setActiveField(`spot${i}Y`); }}
                                        onBlur={() => { if (activeField === `spot${i}Y`) setActiveField('linkCode'); }}
                                    />
                                </div>
                                <div className="input-row">
                                    <span>ALT:</span>
                                    <input 
                                        type="text" 
                                        className={`terminal-input ${activeField === `spot${i}Alt` ? 'active' : ''}`}
                                        value={t.alt}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/[^0-9-]/g, '');
                                            setSpotterTargets(p => ({...p, [i]: {...(p[i]||{x:'',y:'',alt:''}), alt: v}}));
                                        }}
                                        onFocus={() => { setJustFocusedField(`spot${i}Alt`); setActiveField(`spot${i}Alt`); }}
                                        onBlur={() => { if (activeField === `spot${i}Alt`) setActiveField('linkCode'); }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}"""
    code = code.replace("{activePage === 'SETTINGS' && (", spotter_html + "\n\n        {activePage === 'SETTINGS' && (")

    # 4. Canvas tags
    tag_render = """
        // T1-T9 SPOTTER TAGS
        for (let i = 1; i <= 9; i++) {
            const st = spotterTargets[i];
            if (st && st.x !== '' && st.y !== '') {
                const sx = parseInt(st.x);
                const sy = parseInt(st.y);
                const px = Math.floor(((sx - mapOriginX) / mapMeters) * canvas.width) + 0.5;
                const py = Math.floor(canvas.height - ((sy - mapOriginY) / mapMeters) * canvas.height) + 0.5;
                
                ctx.lineWidth = 1.0;
                ctx.strokeStyle = mapFg;
                ctx.beginPath();
                ctx.moveTo(px - 10, py); ctx.lineTo(px + 10, py);
                ctx.moveTo(px, py - 10); ctx.lineTo(px, py + 10);
                ctx.stroke();
                
                ctx.fillStyle = mapFg;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.font = '10px "TX02", monospace';
                ctx.fillText(`T${i}`, px + 6, py - 6);
            }
        }
        
        const g_y = """
    code = code.replace("const g_y =", tag_render)

    # 5. D-Pad Replace
    # Replace the exact block
    dpad_pattern = r'<div className="dpad-grid" style={{ gridTemplateColumns: \'repeat\(3, 40px\)\', gridTemplateRows: \'repeat\(5, 40px\)\', gap: \'4px\' }}>.*?</button>\s*</div>'
    new_dpad = """<div className="dpad-grid" style={{ gridTemplateColumns: 'repeat(3, 40px)', gridTemplateRows: 'repeat(4, 40px)', gap: '4px' }}>
                                <button className="dpad-btn" style={{fontSize: '12px', borderStyle: 'solid'}} onClick={() => { if (dpadMode === 'TGT') setDpadMode('GUN'); else if (dpadMode === 'GUN') setDpadMode('ADJUST'); else if (dpadMode === 'ADJUST') setDpadMode('PAN'); else setDpadMode('TGT'); }}>MOD</button>
                                <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'N'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'N'); else if (dpadMode === 'ADJUST') handleAdjust('N'); else if (dpadMode === 'PAN') handlePan('N'); }}>▲</RepeatButton>
                                <div />
                                <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'W'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'W'); else if (dpadMode === 'ADJUST') handleAdjust('W'); else if (dpadMode === 'PAN') handlePan('W'); }}>◀</RepeatButton>
                                {dpadMode === 'ADJUST' ? <button onClick={handleResetAdjust} className="dpad-btn dpad-btn-reset" style={{ marginTop: 0, fontSize: '18px' }}>⨯</button> : <button className={`dpad-btn ${dpadTgtMode ? 'active' : ''}`} style={{fontSize: '12px', borderStyle: dpadTgtMode ? 'solid' : 'dashed', color: dpadTgtMode ? 'var(--term-bg)' : '', backgroundColor: dpadTgtMode ? 'var(--term-fg)' : ''}} onClick={() => setDpadTgtMode(!dpadTgtMode)}>TGT</button>}
                                <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'E'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'E'); else if (dpadMode === 'ADJUST') handleAdjust('E'); else if (dpadMode === 'PAN') handlePan('E'); }}>▶</RepeatButton>
                                <div />
                                <RepeatButton className="dpad-btn" style={{fontSize: '18px'}} onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'S'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'S'); else if (dpadMode === 'ADJUST') handleAdjust('S'); else if (dpadMode === 'PAN') handlePan('S'); }}>▼</RepeatButton>
                                <div />
                            </div>"""
    code = re.sub(dpad_pattern, new_dpad, code, flags=re.DOTALL)

    # 6. Map Snap Replace
    map_interaction_snap = """let coordX = Math.round(((xPx / canvas.width) * mapMeters) + mapOriginX);
        let coordY = Math.round(((canvas.height - py) / canvas.height) * mapMeters) + mapOriginY;
        
        // Snap to nearest spotter target within 100m
        for (let i = 1; i <= 9; i++) {
            const st = spotterTargets[i];
            if (st && st.x !== '' && st.y !== '') {
                const sx = parseInt(st.x);
                const sy = parseInt(st.y);
                if (Math.hypot(coordX - sx, coordY - sy) <= 100) {
                    coordX = sx;
                    coordY = sy;
                    break;
                }
            }
        }"""
    code = code.replace(
        "let coordX = Math.round(((xPx / canvas.width) * mapMeters) + mapOriginX);\n        let coordY = Math.round(((canvas.height - py) / canvas.height) * mapMeters) + mapOriginY;",
        map_interaction_snap
    )

    with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SPOTTER REFACTORED SUCCESSFULLY")
else:
    print("Already applied!")
